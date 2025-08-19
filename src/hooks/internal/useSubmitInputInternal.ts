import { useCallback } from "react";
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
import { RcbEvent } from "../../constants/RcbEvent";

export const useSubmitInputInternal = () => {
  const { settings } = useSettingsContext();
  const {
    endStreamMessage,
    injectMessage,
    simulateStreamMessage,
    streamMessage,
  } = useMessagesInternal();
  const { getCurrPath } = usePathsInternal();

  const {
    setSyncedTextAreaDisabled,
    setSyncedIsBotTyping,
    setInputLength,
  } = useBotStatesContext();

  const { inputRef, paramsInputRef } = useBotRefsContext();
  const { dispatchRcbEvent } = useDispatchRcbEventInternal();
  const { setTextAreaValue } = useTextAreaInternal();
  const { showToast } = useToastsInternal();
  const { syncVoice } = useVoiceInternal();

  const BACKEND_URL = "http://222.116.135.71:8555/chat"; //로컬로 변경하세요 주소

  /** 유저 말풍선 출력 */
  const handleSendUserInput = useCallback(
    async (userInput: string) => {
      if (settings.userBubble?.simulateStream) {
        await simulateStreamMessage(userInput, "USER");
      } else {
        await injectMessage(userInput, "USER");
      }
    },
    [settings, injectMessage, simulateStreamMessage]
  );

  /** 백엔드 응답 스트리밍 */
  const streamBotAnswerFromBackend = useCallback(
    async (prompt: string) => {
      try {
        const resp = await fetch(BACKEND_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: String(prompt) }),
        });
        if (!resp.ok || !resp.body) throw new Error(`Bad response: ${resp.status}`);

        setSyncedIsBotTyping(true); // ✅ "입력 중" 상태 활성화

        const reader = resp.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let done = false;
        let buffer = "";

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: !done });
            if (chunk) {
              buffer += chunk;
            }
          }
        }

        if (buffer.trim()) {
          // ✅ 챗봇이 "3초간 고민" 후 답변
          await new Promise((resolve) => setTimeout(resolve, 1500));
          await injectMessage(buffer.trim(), "BOT");
        }

        setSyncedIsBotTyping(false); // ✅ 고민 끝 → "입력 중" 해제
      } catch (err) {
        setSyncedIsBotTyping(false);
        await injectMessage("서버 응답에 문제가 발생했어요.", "BOT");
        console.error(err);
      }
    },
    [BACKEND_URL, injectMessage, setSyncedIsBotTyping]
  );

  /** 최종 제출 */
  const handleSubmitText = useCallback(
    async (inputText?: string) => {
      inputText = inputText ?? (inputRef.current?.value as string);
      if (!inputText) return;

      paramsInputRef.current = inputText; // ✅ 첫 질문부터 저장
      await handleSendUserInput(inputText);

      // 입력창 비우기
      if (inputRef.current) {
        setTextAreaValue("");
        setInputLength(0);
      }

      // 바로 백엔드 호출
      await streamBotAnswerFromBackend(inputText);
      setSyncedTextAreaDisabled(false);
      syncVoice(false);

      if (settings.event?.rcbUserSubmitText) {
        await dispatchRcbEvent(RcbEvent.USER_SUBMIT_TEXT, { inputText });
      }
    },
    [
      inputRef,
      paramsInputRef,
      handleSendUserInput,
      setTextAreaValue,
      setInputLength,
      streamBotAnswerFromBackend,
      setSyncedTextAreaDisabled,
      syncVoice,
      settings.event?.rcbUserSubmitText,
      dispatchRcbEvent,
    ]
  );

  return { handleSubmitText };
};
