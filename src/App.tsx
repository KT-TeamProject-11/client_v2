import React from "react";
import ChatBot from "./components/ChatBot";
import { Flow } from "./types/Flow";
import { Params } from "./types/Params";
import { ChatBotProvider } from "./context/ChatBotContext";
import { useAudio } from "./hooks/useAudio";
import { speak, cancelTTS } from "./utils/ttsKo";
import "./app.css";

const BACKEND_URL =
  ((import.meta as any).env?.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
    "http://localhost:8555") + "/chat";

export default function App() {
  const { audioToggledOn } = useAudio();

  const flow: Flow = {
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
              } catch {
                // 자동재생 제한 등으로 실패 시 무시
              }
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
  };

  return (
    <ChatBotProvider>
      <div className="App">
        <header className="App-header">
          <ChatBot
            id="chatbot-id"
            flow={flow}
            settings={{
              header: {
                showAvatar: true,
                avatar: "../assets/hodu.png",
                title: "호둥이 챗봇",
              },
              general: {
                primaryColor: "rgba(155, 195, 187, 1)",
                secondaryColor: "#c4e6a3ff",
                showHeader: true,
                showInputRow: true,
                flowStartTrigger: "ON_LOAD",
              },
              userBubble: { showAvatar: true },
              botBubble: {
                showAvatar: true,
                avatar: "../assets/hodu.png",
              },
              audio: { disabled: false },
              voice: { disabled: false },
              sensitiveInput: { asterisksCount: 6 },
              chatInput: { botDelay: 0 },
            }}
          />
        </header>
      </div>
    </ChatBotProvider>
  );
}
