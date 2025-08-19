import { Flow } from "../types/Flow";
import { Params } from "../types/Params";
import { speak, cancelTTS } from "../utils/ttsKo";

const BACKEND_URL = "http://222.116.135.71:8555/chat";

// flow를 생성하는 함수
export const createChatFlow = (audioToggledOn: boolean): Flow => ({
  greet: {
    message: "안녕하세요! 천안도시재생센터 챗봇입니다. 무엇을 도와드릴까요?",
    path: "start",
  },
  start: {
    path: async (params: Params) => {
      const question = (params.userInput ?? "").trim();
      if (!question) return "start";

      try {
        const res = await fetch(BACKEND_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: question }),
        });

        if (!res.ok || !res.body) {
          await params.injectMessage("서버 응답에 문제가 발생했어요. 잠시 후 다시 시도해주세요.", "BOT");
          return "start";
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let done = false;

        while (!done) {
          const { value, done: rDone } = await reader.read();
          done = rDone;
          if (value) {
            let chunk = decoder.decode(value, { stream: !done });
            if (!chunk) continue;
            if (chunk.toLowerCase().includes("confidence:")) continue;
            if (chunk.trim().startsWith("▲")) continue;
            buffer += chunk;
          }
        }

        const finalText = buffer.trim();
        if (finalText) {
          await params.injectMessage(finalText, "BOT");

          if (audioToggledOn) {
            try {
              await speak(finalText);
            } catch {}
          } else {
            cancelTTS();
          }
        }
      } catch {
        await params.injectMessage("네트워크 오류가 발생했어요. 연결을 확인해주세요.", "BOT");
      }
      return "start";
    },
  },
});
