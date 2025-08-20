import React from "react";
import ChatBot from "./components/ChatBot";
import { Flow } from "./types/Flow";
import { Params } from "./types/Params";
import { ChatBotProvider } from "./context/ChatBotContext";
import { useAudio } from "./hooks/useAudio";
import { speak, cancelTTS } from "./utils/ttsKo";
import "./app.css";

/** 퀵메뉴 HTML (앞뒤 개행 없이) */
const QUICK_MENU_HTML = `<div class="rcb-link-buttons" style="margin-top:8px">
  <a class="rcb-link-button" href="https://www.cheonanurc.or.kr/24"  target="_blank" rel="noopener noreferrer">인사말</a>
  <a class="rcb-link-button" href="https://www.cheonanurc.or.kr/new" target="_blank" rel="noopener noreferrer">공지사항</a>
  <a class="rcb-link-button" href="https://www.cheonanurc.or.kr/92"  target="_blank" rel="noopener noreferrer">커뮤니티</a>
  <a class="rcb-link-button" href="https://www.cheonanurc.or.kr/131" target="_blank" rel="noopener noreferrer">오시는 길</a>
  <a class="rcb-link-button" href="https://www.cheonanurc.or.kr/64"  target="_blank" rel="noopener noreferrer">도시재생투어</a>
</div>`;

/** 인사말(음성용 텍스트만) */
const GREETING_TEXT =
  "안녕하세요! 천안도시재생센터 챗봇입니다. 무엇을 도와드릴까요?";

export default function App() {
  const { audioToggledOn } = useAudio();

  const flow: Flow = {
    greet: {
      // 인사말 + 퀵메뉴를 같은 말풍선으로 출력
      message: GREETING_TEXT + QUICK_MENU_HTML, // 또는 `${GREETING_TEXT}${QUICK_MENU_HTML}`
      path: async (_params: Params) => {
        // TTS는 텍스트만
        if (audioToggledOn) {
          try { await speak(GREETING_TEXT); } catch {}
        } else {
          cancelTTS();
        }
        return "start";
      },
    },
    start: {
      path: async () => "start",
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
              botBubble: { showAvatar: true, avatar: "../assets/hodu.png" },
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
