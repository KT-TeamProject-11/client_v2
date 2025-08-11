// src/App.tsx
import React, { useState } from "react";
import ChatBot from "./components/ChatBot";
import CustomMicInput from "./components/CustomMicInput";
import { Flow } from "./types/Flow";
import { Params } from "./types/Params";
import { ChatBotProvider } from "./context/ChatBotContext";
import "./app.css";

const BACKEND_URL = "http://localhost:8555/chat";

/** 메타라인 제거 */
function cleanup(raw: string) {
  return (raw || "")
    .replace(/^\s*▲.*$/gim, "")
    .replace(/^\s*confidence:\s*.*$/gim, "")
    .trim();
}

/** 항상 한 번만(=말풍선 1개) 출력 */
async function showOnce(text: string, params: Params) {
  const t = cleanup(text || "").trim();
  await params.injectMessage(
    t || "답변이 비어있어요. 잠시 후 다시 시도해 주세요.",
    "BOT"
  );
}

export default function App() {
  const [hasGreeted, setHasGreeted] = useState(false);

  const flow: Flow = {
    start: {
      message: !hasGreeted
        ? "안녕하세요! 천안시 재생센터 챗봇입니다. 무엇을 도와드릴까요?"
        : "",
      path: async (params: Params) => {
        const question = (params.userInput ?? "").trim();

        if (!hasGreeted) {
          setHasGreeted(true);
          if (!question) return;
        }
        if (!question) return;

        try {
          const res = await fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: question }),
          });

          if (!res.ok) {
            await params.injectMessage(
              "서버 응답에 문제가 발생했어요. 잠시 후 다시 시도해주세요.",
              "BOT"
            );
            return;
          }

          const ct = res.headers.get("content-type") || "";

          if (ct.includes("text/event-stream")) {
            const reader = res.body?.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = "";
            if (reader) {
              let done = false;
              while (!done) {
                const { value, done: rDone } = await reader.read();
                done = rDone;
                if (value) {
                  const chunk = decoder.decode(value, { stream: !done });
                  chunk.split(/\r?\n/).forEach((line) => {
                    if (line.startsWith("data:")) {
                      buffer += line.replace(/^data:\s?/, "") + "\n";
                    }
                  });
                }
              }
            }
            await showOnce(buffer, params);
            return;
          }

          if (ct.includes("application/json")) {
            const data = await res.json().catch(() => ({}));
            const text =
              data.answer ??
              data.output ??
              data.message ??
              data.content ??
              JSON.stringify(data);
            await showOnce(String(text), params);
            return;
          }

          if (res.body) {
            const reader = res.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let done = false;
            let buffer = "";
            while (!done) {
              const { value, done: rDone } = await reader.read();
              done = rDone;
              if (value) buffer += decoder.decode(value, { stream: !done });
            }
            await showOnce(buffer, params);
          } else {
            const text = await res.text();
            await showOnce(text, params);
          }
        } catch {
          await params.injectMessage(
            "네트워크 오류가 발생했어요. 연결을 확인해주세요.",
            "BOT"
          );
        }
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
            // ✅ 커스텀 입력창(마이크 포함) 슬롯 주입
            slots={{ chatBotInput: CustomMicInput }}
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
                embed: true,
              },
              userBubble: { showAvatar: true },
              botBubble: {
                showAvatar: true,
                avatar: "../assets/hodu.png",
                animate: true,
              },
              chatWindow: { showTypingIndicator: true },
              audio: { disabled: false }, // (필요 시) 재생 버튼 유지
              voice: { disabled: true },  // 내장 마이크는 끔(중복 방지)
              sensitiveInput: { asterisksCount: 6 },
              chatInput: { botDelay: 0 },
            }}
          />
        </header>
      </div>
    </ChatBotProvider>
  );
}
