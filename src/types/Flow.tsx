// src/types/Flow.ts
import OptionButtons from "../components/OptionButtons";

export const flow = {
	start: {
		message: ({ sendMessage }: any) => ({
			type: "custom",
			content: (
				<OptionButtons
					onSelect={(text) => {
						sendMessage(text); // 버튼 선택 시 사용자 입력처럼 처리
					}}
				/>
			),
		}),
		next: "waitingForInput",
	},

	waitingForInput: {
		message: "무엇을 도와드릴까요?",
	},
};
