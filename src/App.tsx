import React from "react";
import ChatBot from "./components/ChatBot";
import { Flow } from "./types/Flow";
import { Params } from "./types/Params";
import { ChatBotProvider } from "./context/ChatBotContext";
import "./app.css";

const BACKEND_URL = "http://localhost:8555/chat";

export default function App() {
  const flow: Flow = {
    // 앱 로드시 한 번 인사
    greet: {
      message: "안녕하세요! 무엇을 도와드릴까요?",
      path: "start",
    },

    // 사용자가 입력하면 백엔드로 요청
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
            await params.injectMessage(
              "서버 응답에 문제가 발생했어요. 잠시 후 다시 시도해주세요.",
              "BOT"
            );
            return "start";
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder("utf-8");
          let done = false;
          let buffer = ""; // ✅ 하나의 말풍선에 담을 응답 버퍼

          while (!done) {
            const { value, done: rDone } = await reader.read();
            done = rDone;
            if (value) {
              let chunk = decoder.decode(value, { stream: !done });

              if (!chunk) continue;

              // ✅ confidence나 불필요한 메타 제거
              if (chunk.toLowerCase().includes("confidence:")) continue;
              if (chunk.trim().startsWith("▲")) continue;

              buffer += chunk;
            }
          }

          if (buffer.trim()) {
            await params.injectMessage(buffer.trim(), "BOT"); // ✅ 한 번만 출력
          }
        } catch {
          await params.injectMessage(
            "네트워크 오류가 발생했어요. 연결을 확인해주세요.",
            "BOT"
          );
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
                primaryColor: "rgb(250,190,0)",
                secondaryColor: "#58a7a7",
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
