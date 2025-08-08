import { CSSProperties } from "react";
import { useSettingsContext } from "../../../context/SettingsContext";
import { useStylesContext } from "../../../context/StylesContext";
import { Message } from "../../../types/Message";
import "./BotMessage.css";

/**
 * Renders message from the bot.
 * 
 * @param message message to render
 * @param isNewSender whether this message is from a new sender
 */
const BotMessage = ({
	message,
	isNewSender,
}: {
	message: Message;
	isNewSender: boolean;
}) => {
	// handles settings
	const { settings } = useSettingsContext();

	// handles styles
	const { styles } = useStylesContext();

	// checks if content should be rendered as html
	const isStringContent = typeof message.content === "string";
	const baseContent: React.ReactNode = message.content;

	// checks if content wrapper is defined to wrap around content
	const finalContent = message.contentWrapper ? (
		<message.contentWrapper>
			{baseContent}
		</message.contentWrapper>
	) : (
		baseContent
	);

	// styles for bot bubble
	const botBubbleStyle: CSSProperties = {
		backgroundColor: settings.general?.secondaryColor,
		color: "#fff",
		maxWidth: settings.botBubble?.showAvatar ? "65%" : "70%",
		...styles.botBubbleStyle,
	};
	const botBubbleEntryStyle = settings.botBubble?.animate ? "rcb-bot-message-entry" : "";

	// determines whether it's a new sender (affects avatar display and offset)
	const showAvatar = settings.botBubble?.showAvatar && isNewSender;
	const offsetStyle = `rcb-bot-message${!isNewSender && settings.botBubble?.showAvatar
		? " rcb-bot-message-offset"
		: ""
	}`;

	// 자동 입력 및 전송 함수
	const handleOptionClick = (value: string) => {
		const input = document.querySelector<HTMLInputElement>(".rcb-input-area input");
		if (input) {
			input.value = value;
			input.dispatchEvent(new Event("input", { bubbles: true }));
		}
		const sendButton = document.querySelector<HTMLButtonElement>(".rcb-send-icon");
		sendButton?.click();
	};

	return (
		<div className="rcb-bot-message-container">
			{showAvatar && (
				<div
					style={{ backgroundImage: `url("${settings.botBubble?.avatar}")` }}
					className="rcb-message-bot-avatar"
				/>
			)}
			{isStringContent ? (
				<div style={botBubbleStyle} className={`${offsetStyle} ${botBubbleEntryStyle}`}>
					{finalContent}

					{/* ✅ 옵션 버튼이 있으면 렌더링 */}
					{message.options && (
						<div className="rcb-option-buttons">
							{message.options.map((option, index) => (
								<button
									key={index}
									className="rcb-option-button"
									onClick={() => handleOptionClick(option.value)}
								>
									{option.label}
								</button>
							))}
						</div>
					)}
				</div>
			) : (
				<>{finalContent}</>
			)}
		</div>
	);
};

export default BotMessage;
