// src/App.tsx

import React from "react";
import ChatBot from "./components/ChatBot";
import { Flow } from "./types/Flow";
import { ChatBotProvider } from "./context/ChatBotContext";
import "./App.css";

function App() {
	const flow: Flow = {
		start: {
			message: "안녕하세요! 무엇을 도와드릴까요?",
			path: "end",
		},
		end: {
			message: "대화가 종료되었습니다.",
			path: "end",
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
								avatar: "../assets/hodu.png", // ✅ 말풍선 이미지와 동일하게
								title: "호둥이 챗봇",
							},
							general: {
								primaryColor: "rgb(250,190,0)",
							},
							userBubble: { showAvatar: true },
							botBubble: {
								showAvatar: true,
								avatar: "/assets/hodu.png", // ✅ 말풍선 아이콘에도 사용된 이미지
							},
							chatInput: { botDelay: 1000 },
						}}
					/>
				</header>
			</div>
		</ChatBotProvider>
	);
}

export default App;
