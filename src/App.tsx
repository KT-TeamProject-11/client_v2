import React from "react";
import ChatBot from "./components/ChatBot";
import { Flow } from "./types/Flow";
import { Params } from "./types/Params";
import { ChatBotProvider } from "./context/ChatBotContext";
import { useAudio } from "./hooks/useAudio";
import { speak, cancelTTS } from "./utils/ttsKo";
import "./app.css";

export default function App() {
  const { audioToggledOn } = useAudio();

  const flow: Flow = {
    greet: {
      message: "안녕하세요! 천안도시재생센터 챗봇입니다. 무엇을 도와드릴까요?",
      path: async (params: Params) => {
        const greeting = "안녕하세요! 천안도시재생센터 챗봇입니다. 무엇을 도와드릴까요?";
        if (audioToggledOn) {
          try {
            await speak(greeting);
          } catch {}
        } else {
          cancelTTS();
        }
        return "start"; // greet 후 start 경로로
      },
    },
    start: {
      path: async () => {
        return "start"; // ✅ 백엔드 호출은 useSubmitInputInternal에서만
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
                startPath: "greet",
                loadHistory: false,
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
