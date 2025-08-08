import { useCallback, useEffect, useRef } from "react";

import { postProcessBlock } from "../../services/BlockService/BlockService";
import { processIsSensitive } from "../../services/BlockService/IsSensitiveProcessor";
import { usePathsInternal } from "./usePathsInternal";
import { useMessagesInternal } from "./useMessagesInternal";
import { useDispatchRcbEventInternal } from "./useDispatchRcbEventInternal";
import { useVoiceInternal } from "./useVoiceInternal";
import { useTextAreaInternal } from "./useTextAreaInternal";
import { useChatWindowInternal } from "./useChatWindowInternal";
import { useToastsInternal } from "./useToastsInternal";
import { useBotStatesContext } from "../../context/BotStatesContext";
import { useBotRefsContext } from "../../context/BotRefsContext";
import { useSettingsContext } from "../../context/SettingsContext";
import { Flow } from "../../types/Flow";
import { RcbEvent } from "../../constants/RcbEvent";
import { usePathsContext } from "../../context/PathsContext";

/**
 * Internal custom hook for managing user input submissions.
 */
export const useSubmitInputInternal = () => {
  // settings
  const { settings } = useSettingsContext();

  // messages
  const {
    endStreamMessage,
    injectMessage,
    removeMessage,
    simulateStreamMessage,
    streamMessage
  } = useMessagesInternal();

  // paths
  const { syncedPathsRef } = usePathsContext();
  const { getCurrPath, getPrevPath, goToPath, firePostProcessBlockEvent } = usePathsInternal();

  // bot states
  const {
    setSyncedTextAreaSensitiveMode,
    setSyncedTextAreaDisabled,
    setSyncedIsBotTyping,
    setBlockAllowsAttachment,
    setInputLength,
    syncedVoiceToggledOnRef,
    syncedTextAreaSensitiveModeRef,
  } = useBotStatesContext();

  // bot refs
  const { flowRef, inputRef, keepVoiceOnRef, paramsInputRef, timeoutIdRef } = useBotRefsContext();

  // toast
  const { showToast, dismissToast } = useToastsInternal();

  // rcb events
  const { dispatchRcbEvent } = useDispatchRcbEventInternal();

  // voice
  const { syncVoice } = useVoiceInternal();

  // textarea
  const { setTextAreaValue } = useTextAreaInternal();

  // chat window
  const { toggleChatWindow } = useChatWindowInternal();

  const BACKEND_URL = "http://127.0.0.1:8555/chat";
  const firstMessageShown = useRef(false);

  // 처음 로드 시만 환영 메시지 출력
  useEffect(() => {
    if (!firstMessageShown.current) {
      injectMessage("안녕하세요 무엇을 도와드릴까요?", "BOT");
      firstMessageShown.current = true;
    }
  }, [injectMessage]);

  /**
   * Handles sending of user input
   */
  const handleSendUserInput = useCallback(async (userInput: string) => {
    const currPath = getCurrPath();
    if (!currPath) return;

    const block = (flowRef.current as Flow)[currPath];
    if (!block) return;

    if (syncedTextAreaSensitiveModeRef.current) {
      if (settings?.sensitiveInput?.hideInUserBubble) {
        return;
      } else if (settings?.sensitiveInput?.maskInUserBubble) {
        const masked = "*".repeat((settings.sensitiveInput?.asterisksCount as number) ?? 10);
        if (settings.userBubble?.simulateStream) {
          await simulateStreamMessage(masked, "USER");
        } else {
          await injectMessage(masked, "USER");
        }
        return;
      }
    }

    if (settings.userBubble?.simulateStream) {
      await simulateStreamMessage(userInput, "USER");
    } else {
      await injectMessage(userInput, "USER");
    }
  }, [flowRef, getCurrPath, settings, injectMessage, simulateStreamMessage, syncedTextAreaSensitiveModeRef]);

  /**
   * 백엔드로부터 스트리밍 응답을 받아서 하나의 BOT 말풍선에 출력
   */
  const streamBotAnswerFromBackend = useCallback(async (prompt: string) => {
    try {
      const resp = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: String(prompt) }), // 항상 string으로
      });

      if (!resp.ok || !resp.body) {
        throw new Error(`Bad response: ${resp.status}`);
      }

      setSyncedIsBotTyping(true);

      // BOT 말풍선 생성 (빈 상태)
      await injectMessage("", "BOT");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          if (chunk) {
            await streamMessage(chunk, "BOT"); // 기존 BOT 말풍선에 추가
          }
        }
      }

      await endStreamMessage("BOT");
      setSyncedIsBotTyping(false);
    } catch (err) {
      setSyncedIsBotTyping(false);
      await injectMessage("서버 응답에 문제가 발생했어요. 잠시 후 다시 시도해주세요.", "BOT");
      console.error(err);
    }
  }, [BACKEND_URL, streamMessage, endStreamMessage, injectMessage, setSyncedIsBotTyping]);

  /**
   * Handles action input
   */
  const handleActionInput = useCallback(async (userInput: string, sendUserInput = true) => {
    userInput = userInput.trim();
    if (userInput === "") return;

    if (sendUserInput) {
      await handleSendUserInput(userInput);
    }

    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }

    if (inputRef.current) {
      setTextAreaValue("");
      setInputLength(0);
    }

    const currPath = getCurrPath();
    if (!currPath) return;

    let block = (flowRef.current as Flow)[currPath];
    const finalBlock = await firePostProcessBlockEvent(block);
    if (!finalBlock) return;

    if (settings.chatInput?.blockSpam) setSyncedTextAreaDisabled(true);

    keepVoiceOnRef.current = syncedVoiceToggledOnRef.current;
    syncVoice(false);

    setTimeout(() => setSyncedIsBotTyping(true), 400);

    setSyncedTextAreaSensitiveMode(false);

    setTimeout(async () => {
      const params = {
        prevPath: getPrevPath(),
        currPath: getCurrPath(),
        goToPath,
        setTextAreaValue,
        userInput: paramsInputRef.current,
        injectMessage,
        simulateStreamMessage,
        streamMessage,
        removeMessage,
        endStreamMessage,
        toggleChatWindow,
        showToast,
        dismissToast
      };

      const currNumPaths = syncedPathsRef.current.length;

      await postProcessBlock(finalBlock, params);

      if (syncedPathsRef.current.length === currNumPaths) {
        await streamBotAnswerFromBackend(userInput);

        if ("chatDisabled" in block) {
          setSyncedTextAreaDisabled(!!(block as any).chatDisabled);
        } else {
          setSyncedTextAreaDisabled(!!settings.chatInput?.disabled);
        }
        processIsSensitive(block, params, setSyncedTextAreaSensitiveMode);
        setBlockAllowsAttachment(typeof (block as any).file === "function");
        syncVoice(keepVoiceOnRef.current);
        setSyncedIsBotTyping(false);
      }
    }, settings.chatInput?.botDelay);
  }, [
    timeoutIdRef, settings.chatInput?.blockSpam, settings.chatInput?.botDelay, settings.chatInput?.disabled,
    keepVoiceOnRef, syncedVoiceToggledOnRef, syncVoice, handleSendUserInput, getPrevPath, getCurrPath, goToPath,
    injectMessage, simulateStreamMessage, streamMessage, removeMessage, endStreamMessage, toggleChatWindow,
    showToast, dismissToast, flowRef, paramsInputRef, setSyncedTextAreaSensitiveMode, setSyncedIsBotTyping,
    setSyncedTextAreaDisabled, setBlockAllowsAttachment, syncedPathsRef, setInputLength, inputRef,
    setTextAreaValue, streamBotAnswerFromBackend
  ]);

  /**
   * Handles submit
   */
  const handleSubmitText = useCallback(async (inputText?: string, sendInChat = true) => {
    inputText = inputText ?? (inputRef.current?.value as string);

    if (settings.event?.rcbUserSubmitText) {
      const event = await dispatchRcbEvent(RcbEvent.USER_SUBMIT_TEXT, { inputText, sendInChat });
      if (event.defaultPrevented) return;
    }

    const currPath = getCurrPath();
    if (!currPath) return;
    handleActionInput(inputText, sendInChat);
  }, [dispatchRcbEvent, getCurrPath, handleActionInput, inputRef, settings.event?.rcbUserSubmitText]);

  return { handleSubmitText };
};
