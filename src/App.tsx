// src/App.tsx

import React, { useState } from "react";
import ChatBot from "./components/ChatBot";
import { Flow } from "./types/Flow";
import { Params } from "./types/Params";
import { ChatBotProvider } from "./context/ChatBotContext";
import "./app.css";

function App() {
	const [name, setName] = useState("");
	const [initTopic, setInitTopic] = useState<string | null>(null);
	const [initialUserInput, setInitialUserInput] = useState<string | null>(null);

	const flow: Flow = {
		start: {
			message: () => {
				if (initTopic) return `안녕하세요! '${initTopic}'에 대해 안내해드릴게요.`;
				if (initialUserInput) return `입력하신 \"${initialUserInput}\"에 대해 알려드릴게요.`;
				return "안녕하세요! 무엇을 도와드릴까요?";
			},
			path: "show_name",
		},
		show_name: {
			message: (params: Params) => `안녕하세요, ${params.userInput}님!`,
			function: (params: Params) => setName(params.userInput),
			chatDisabled: true,
			transition: { duration: 1000 },
			path: "ask_token",
		},
		ask_token: {
			message: "6자리 프로필 ID를 입력해주세요.",
			isSensitive: true,
			path: (params: Params) => {
				return params.userInput.length === 6 ? "ask_age_group" : "incorrect_answer";
			},
		},
		ask_age_group: {
			message: () => `계정이 인증되었습니다, ${name}님! 연령대를 선택해주세요.`,
			options: ["청소년", "청년", "성인"],
			chatDisabled: true,
			path: () => "ask_math_question",
		},
		ask_math_question: {
			message: (params: Params) => `${params.userInput}을 선택하셨군요. 1 + 1은 무엇인가요?`,
			path: (params: Params) => (params.userInput === "2" ? "ask_favourite_color" : "incorrect_answer"),
		},
		ask_favourite_color: {
			message: "좋습니다! 좋아하는 색깔은 무엇인가요?",
			path: "ask_favourite_pet",
		},
		ask_favourite_pet: {
			message: "좋아하는 반려동물 2가지를 선택해주세요.",
			checkboxes: { items: ["강아지", "고양이", "토끼", "햄스터"], min: 2, max: 2 },
			function: (params: Params) => alert(`선택한 동물: ${JSON.stringify(params.userInput)}`),
			chatDisabled: true,
			path: "ask_height",
		},
		ask_height: {
			message: "키(cm)를 입력해주세요.",
			path: async (params: Params) => {
				if (isNaN(Number(params.userInput))) {
					await params.injectMessage("숫자로 입력해주세요!");
					return;
				}
				return "ask_weather";
			},
		},
		ask_weather: {
			message: () => "제 좋아하는 색깔을 맞춰보세요! 아래 버튼을 눌러보세요.",
			component: (
				<div style={{ width: "100%", display: "flex", justifyContent: "center", marginTop: 10 }}>
					<button className="secret-fav-color" onClick={() => alert("검정색")}>정답 보기</button>
				</div>
			),
			path: async (params: Params) => {
				if (params.userInput.toLowerCase() !== "검정색") {
					return "incorrect_answer";
				}
				await params.toggleChatWindow(false);
				return "close_chat";
			},
		},
		close_chat: {
			message: "숨은 챗봇을 찾으셨군요! 좋아하는 음식은 무엇인가요?",
			path: "ask_image",
		},
		ask_image: {
			message: (params: Params) => `${params.userInput}? 흥미롭네요. 사진으로 보여주시겠어요?`,
			file: (params: Params) => console.log(params.files),
			function: (params: Params) => params.showToast("이미지가 업로드되었습니다!"),
			path: "end",
		},
		end: {
			message: "감사합니다! 다음에 또 만나요.",
			path: "loop",
		},
		loop: {
			message: async (params: Params) => {
				setTimeout(() => {
					params.injectMessage("이 대화는 반복됩니다...");
				}, 500);
			},
			path: "loop",
		},
		incorrect_answer: {
			message: "오답입니다. 다시 시도해주세요!",
			transition: { duration: 0 },
			path: (params: Params) => params.prevPath,
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
							},
							userBubble: { showAvatar: true },
							botBubble: {
								showAvatar: true,
								avatar: "../assets/hodu.png",
							},
							audio: { disabled: false },
							voice: { disabled: false },
							sensitiveInput: { asterisksCount: 6 },
							chatInput: { botDelay: 1000 },
						}}
					/>
				</header>
			</div>
		</ChatBotProvider>
	);
}

export default App;
