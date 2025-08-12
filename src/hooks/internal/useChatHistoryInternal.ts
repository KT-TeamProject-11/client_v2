// src/hooks/internal/useChatHistoryInternal.ts
import { useCallback } from "react";

import { getHistoryMessages, loadChatHistory } from "../../services/ChatHistoryService";
import { useDispatchRcbEventInternal } from "./useDispatchRcbEventInternal";
import { useBotRefsContext } from "../../context/BotRefsContext";
import { useMessagesContext } from "../../context/MessagesContext";
import { useSettingsContext } from "../../context/SettingsContext";
import { useStylesContext } from "../../context/StylesContext";
import { useBotStatesContext } from "../../context/BotStatesContext";
import { RcbEvent } from "../../constants/RcbEvent";
import type { Message } from "../../types/Message"; // ✅ 추가: 타입 임포트

/**
 * Internal custom hook for managing chat history logic.
 */
export const useChatHistoryInternal = () => {
  // handles settings
  const { settings } = useSettingsContext();

  // handles styles
  const { styles } = useStylesContext();

  // handles messages
  const { setSyncedMessages, syncedMessagesRef } = useMessagesContext();

  // handles bot states
  const {
    isLoadingChatHistory,
    setIsLoadingChatHistory,
    hasChatHistoryLoaded,
    setHasChatHistoryLoaded,
  } = useBotStatesContext();

  // handles bot refs
  const { chatBodyRef } = useBotRefsContext();

  // handles rcb events
  const { dispatchRcbEvent } = useDispatchRcbEventInternal();

  /**
   * Loads and shows chat history in the chat window.
   *
   * - 과거 메시지에는 isHistory=true, isRead=true 표식을 부여하여
   *   배지(unreadCount) 로직에 영향이 가지 않도록 함.
   * - 이미 로드됐다면(개발모드 이펙트 중복 등) 재호출을 방지.
   */
  const showChatHistory = useCallback(async () => {
    // ✅ 중복 로드 방지
    if (hasChatHistoryLoaded) return;

    const chatHistory = getHistoryMessages();
    if (!chatHistory) {
      return;
    }

    // handles load chat history event
    if (settings.event?.rcbLoadChatHistory) {
      const event = await dispatchRcbEvent(RcbEvent.LOAD_CHAT_HISTORY, {});
      if (event.defaultPrevented) {
        return;
      }
    }

    setIsLoadingChatHistory(true);

    // ✅ 히스토리 메시지에 표식/읽음 처리
    const decorated = (chatHistory as Message[]).map((m) => ({
      ...m,
      isHistory: true,
      isRead: true,
    })) as Message[];

    const chatScrollHeight = chatBodyRef.current?.scrollHeight ?? 0;

    // ✅ 표식된 배열을 그대로 downstream으로 전달
    loadChatHistory(
      settings,
      styles,
      decorated,
      setSyncedMessages,
      syncedMessagesRef,
      chatBodyRef,
      chatScrollHeight,
      setIsLoadingChatHistory,
      setHasChatHistoryLoaded
    );
  }, [
    settings,
    styles,
    dispatchRcbEvent,
    syncedMessagesRef,
    chatBodyRef,
    setIsLoadingChatHistory,
    setHasChatHistoryLoaded,
    hasChatHistoryLoaded, // ✅ 의존성에 추가
  ]);

  return { isLoadingChatHistory, setIsLoadingChatHistory, hasChatHistoryLoaded, showChatHistory };
};
