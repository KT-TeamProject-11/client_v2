import { useCallback, useEffect } from "react";

import { createMessage } from "../../utils/messageBuilder";
import { useSettingsContext } from "../../context/SettingsContext";
import { useMessagesContext } from "../../context/MessagesContext";
import { useBotStatesContext } from "../../context/BotStatesContext";
import { useBotRefsContext } from "../../context/BotRefsContext";
import { useNotificationInternal } from "./useNotificationsInternal";
import { useDispatchRcbEventInternal } from "./useDispatchRcbEventInternal";
import { useAudioInternal } from "./useAudioInternal";
import { useChatWindowInternal } from "./useChatWindowInternal";
import { Message } from "../../types/Message";
import { RcbEvent } from "../../constants/RcbEvent";

export const useMessagesInternal = () => {
  const { settings } = useSettingsContext();
  const { messages, setSyncedMessages, syncedMessagesRef } = useMessagesContext();

  const {
    setSyncedIsBotTyping,
    setUnreadCount,
    syncedIsScrollingRef,
    syncedIsChatWindowOpenRef,
  } = useBotStatesContext();

  const { streamMessageMap, chatBodyRef, paramsInputRef } = useBotRefsContext();
  const { scrollToBottom, getIsChatBotVisible } = useChatWindowInternal();
  const { dispatchRcbEvent } = useDispatchRcbEventInternal();
  const { speakAudio } = useAudioInternal();
  const { playNotificationSound } = useNotificationInternal();



  /**
   * Handles post messages updates such as scrolling to bottom
   * and playing notification sound.
   */
  const handlePostMessagesUpdate = useCallback(
    (updatedMessages: Message[], isRepeatedStreamMessage = false) => {
      let shouldNotify = true;

      const lastMessage = updatedMessages[updatedMessages.length - 1];
      if (!lastMessage) {
        return;
      }

      const sender = lastMessage.sender.toUpperCase();
      if (sender === "USER") {
        shouldNotify = false;
      }

      if (settings.general?.embedded && getIsChatBotVisible()) {
        shouldNotify = false;
      }

      if (
        (syncedIsChatWindowOpenRef.current && !syncedIsScrollingRef.current) ||
        isRepeatedStreamMessage
      ) {
        shouldNotify = false;
      }

      if (shouldNotify) {
        playNotificationSound();
      }

      if (
        !isRepeatedStreamMessage &&
        ((sender !== "USER" && settings.chatWindow?.autoJumpToBottom) ||
          sender === "USER" ||
          !syncedIsScrollingRef.current)
      ) {
        setTimeout(() => scrollToBottom(), 1);
      }
    },
    [
      settings,
      chatBodyRef,
      syncedIsChatWindowOpenRef,
      syncedIsScrollingRef,
      playNotificationSound,
      scrollToBottom,
      getIsChatBotVisible,
    ]
  );

  const simulateStreamMessage = useCallback(
    async (
      content: string,
      sender = "BOT",
      simulateStreamChunker: ((content: string) => Array<string>) | null = null
    ): Promise<Message | null> => {
      if (typeof content !== "string") {
        throw new Error("Content must be of type string to simulate stream.");
      }

      sender = sender.toUpperCase();
      let message = createMessage(content, sender);

      if (settings.event?.rcbStartSimulateStreamMessage) {
        const event = await dispatchRcbEvent(
          RcbEvent.START_SIMULATE_STREAM_MESSAGE,
          { message }
        );
        if (event.defaultPrevented) {
          return null;
        }
        simulateStreamChunker =
          event.data.simulateStreamChunker || simulateStreamChunker;
        message = event.data.message;
      }

      setSyncedIsBotTyping(false);

      let streamSpeed = 30;
      if (sender === "BOT") {
        streamSpeed = settings.botBubble?.streamSpeed as number;
      } else {
        streamSpeed = settings.userBubble?.streamSpeed as number;
      }

      const placeholderMessage = { ...message, content: "" };
      setSyncedMessages((prev) => [...prev, placeholderMessage]);
      handlePostMessagesUpdate(syncedMessagesRef.current);

      let streamMessage: string | string[] = message.content as string;
      if (simulateStreamChunker) {
        streamMessage = simulateStreamChunker(streamMessage as string);
      }
      let streamIndex = 0;
      const endStreamIndex = streamMessage.length;

      if (
        message.sender.toUpperCase() === "BOT" &&
        (syncedIsChatWindowOpenRef.current || settings.general?.embedded)
      ) {
        if (typeof message.content === "string" && message.content.trim() !== "") {
          speakAudio(message.content);
        }
      }

      const simulateStreamDoneTask: Promise<void> = new Promise((resolve) => {
        const intervalId = setInterval(() => {
          if (streamIndex >= endStreamIndex) {
            clearInterval(intervalId);
            resolve();
            return;
          }

          setSyncedMessages((prevMessages) => {
            const updatedMessages = [...prevMessages];
            for (let i = updatedMessages.length - 1; i >= 0; i--) {
              if (updatedMessages[i].id === placeholderMessage.id) {
                const character = (streamMessage as string[])[streamIndex];
                if (character) {
                  placeholderMessage.content += character;
                  updatedMessages[i] = placeholderMessage;
                }
                streamIndex++;
                break;
              }
            }
            return updatedMessages;
          });
        }, streamSpeed);
      });

      if (syncedIsScrollingRef.current || !syncedIsChatWindowOpenRef.current) {
        setUnreadCount((prev) => prev + 1);
      }
      await simulateStreamDoneTask;

      if (settings.event?.rcbStopSimulateStreamMessage) {
        await dispatchRcbEvent(RcbEvent.STOP_SIMULATE_STREAM_MESSAGE, {
          message,
        });
      }

      if (sender === "USER") {
        paramsInputRef.current = content;
      }
      return message;
    },
    [
      settings,
      dispatchRcbEvent,
      handlePostMessagesUpdate,
      syncedMessagesRef,
      paramsInputRef,
      setSyncedIsBotTyping,
      setUnreadCount,
      syncedIsChatWindowOpenRef,
      speakAudio,
    ]
  );

  const injectMessage = useCallback(
    async (content: string | JSX.Element, sender = "BOT"): Promise<Message | null> => {
      sender = sender.toUpperCase();

      let message = createMessage(content, sender);
      if (settings.event?.rcbPreInjectMessage) {
        const event = await dispatchRcbEvent(RcbEvent.PRE_INJECT_MESSAGE, {
          message,
        });
        if (event.defaultPrevented) {
          return null;
        }
        message = event.data.message;
      }

      if (
        message.sender.toUpperCase() === "BOT" &&
        (syncedIsChatWindowOpenRef.current || settings.general?.embedded)
      ) {
        if (typeof message.content === "string" && message.content.trim() !== "") {
          speakAudio(message.content);
        }
      }

      if (syncedIsScrollingRef.current || !syncedIsChatWindowOpenRef.current) {
        setUnreadCount((prev) => prev + 1);
      }

      if (settings.event?.rcbPostInjectMessage) {
        await dispatchRcbEvent(RcbEvent.POST_INJECT_MESSAGE, { message });
      }

      setSyncedMessages((prev) => [...prev, message]);
      handlePostMessagesUpdate(syncedMessagesRef.current);

      if (sender === "USER" && typeof content === "string") {
        paramsInputRef.current = content;
      }
      return message;
    },
    [
      settings,
      dispatchRcbEvent,
      handlePostMessagesUpdate,
      paramsInputRef,
      syncedMessagesRef,
      syncedIsChatWindowOpenRef,
      speakAudio,
      setUnreadCount,
    ]
  );

  const removeMessage = useCallback(
    async (messageId: string): Promise<Message | null> => {
      const message = syncedMessagesRef.current.find((m) => m.id === messageId);
      if (!message) {
        return null;
      }

      if (settings.event?.rcbRemoveMessage) {
        const event = await dispatchRcbEvent(RcbEvent.REMOVE_MESSAGE, { message });
        if (event.defaultPrevented) {
          return null;
        }
      }

      setSyncedMessages((prev) => prev.filter((m) => m.id !== messageId));
      handlePostMessagesUpdate(syncedMessagesRef.current);
      setUnreadCount((prev) => Math.max(prev - 1, 0));
      return message;
    },
    [
      dispatchRcbEvent,
      settings.event?.rcbRemoveMessage,
      handlePostMessagesUpdate,
      syncedMessagesRef,
      setUnreadCount,
    ]
  );

  const streamMessage = useCallback(
    async (
      content: string | JSX.Element,
      sender = "BOT"
    ): Promise<Message | null> => {
      sender = sender.toUpperCase();

      if (!streamMessageMap.current.has(sender)) {
        const message = createMessage(content, sender);

        if (settings.event?.rcbStartStreamMessage) {
          const event = await dispatchRcbEvent(RcbEvent.START_STREAM_MESSAGE, {
            message,
          });
          if (event.defaultPrevented) {
            return null;
          }
        }

        setSyncedIsBotTyping(false);
        setSyncedMessages((prev) => [...prev, message]);
        handlePostMessagesUpdate(syncedMessagesRef.current);
        streamMessageMap.current.set(sender, message.id);
        if (syncedIsScrollingRef.current || !syncedIsChatWindowOpenRef.current) {
          setUnreadCount((prev) => prev + 1);
        }
        return message;
      }

      const message = {
        ...createMessage(content, sender),
        id: streamMessageMap.current.get(sender)!,
      };

      if (settings.event?.rcbChunkStreamMessage) {
        const event = await dispatchRcbEvent(RcbEvent.CHUNK_STREAM_MESSAGE, {
          message,
        });
        if (event.defaultPrevented) {
          return null;
        }
      }

      setSyncedMessages((prev) =>
        prev.map((m) => (m.id === message.id ? message : m))
      );
      handlePostMessagesUpdate(syncedMessagesRef.current, true);
      return message;
    },
    [
      dispatchRcbEvent,
      settings.event,
      handlePostMessagesUpdate,
      syncedMessagesRef,
      setSyncedIsBotTyping,
      setUnreadCount,
      streamMessageMap,
    ]
  );

  const endStreamMessage = useCallback(
    async (sender = "BOT"): Promise<boolean> => {
      sender = sender.toUpperCase();

      if (!streamMessageMap.current.has(sender)) {
        return true;
      }
      const messageId = streamMessageMap.current.get(sender)!;

      let message;
      for (let i = 0; i < 3; i++) {
        const msg = syncedMessagesRef.current.find((m) => m.id === messageId);
        if (msg) message = msg;
        await new Promise((res) => setTimeout(res, 20));
      }

      if (settings.event?.rcbStopStreamMessage) {
        const event = await dispatchRcbEvent(RcbEvent.STOP_STREAM_MESSAGE, {
          message,
        });
        if (event.defaultPrevented) {
          return false;
        }
      }

      streamMessageMap.current.delete(sender);

      if (sender === "USER" && typeof message?.content === "string") {
        paramsInputRef.current = message.content;
      }
      return true;
    },
    [
      dispatchRcbEvent,
      settings.event?.rcbStopStreamMessage,
      streamMessageMap,
      paramsInputRef,
    ]
  );

  const replaceMessages = useCallback(
    (newMessages: Array<Message>) => {
      setSyncedMessages(newMessages);
      handlePostMessagesUpdate(newMessages);
    },
    [handlePostMessagesUpdate]
  );

  return {
    simulateStreamMessage,
    injectMessage,
    removeMessage,
    streamMessage,
    endStreamMessage,
    replaceMessages,
    messages,
  };
};
