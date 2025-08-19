import React, {
	useState,
	ChangeEvent,
	KeyboardEvent,
	RefObject,
	MouseEvent,
	Fragment,
  } from "react";
  
  import { useSubmitInputInternal } from "../../hooks/internal/useSubmitInputInternal";
  import { useIsDesktopInternal } from "../../hooks/internal/useIsDesktopInternal";
  import { useTextAreaInternal } from "../../hooks/internal/useTextAreaInternal";
  import { useBotStatesContext } from "../../context/BotStatesContext";
  import { useBotRefsContext } from "../../context/BotRefsContext";
  import { useSettingsContext } from "../../context/SettingsContext";
  import { useStylesContext } from "../../context/StylesContext";
  
  import useSpeechToText from "../../hooks/useSpeechToText";
  import "./ChatBotInput.css";
  
  const ChatBotInput = ({ buttons }: { buttons: JSX.Element[] }) => {
	const isDesktop = useIsDesktopInternal();
	const { settings } = useSettingsContext();
	const { styles } = useStylesContext();
  
	const {
	  textAreaDisabled,
	  textAreaSensitiveMode,
	  inputLength,
	  hasFlowStarted,
	  setHasFlowStarted,
	  setInputLength,
	} = useBotStatesContext();
  
	const { inputRef, paramsInputRef } = useBotRefsContext();
	const [isFocused, setIsFocused] = useState(false);
	const [isComposing, setIsComposing] = useState(false);
  
	const { handleSubmitText } = useSubmitInputInternal();
	const { setTextAreaValue } = useTextAreaInternal();
  
	const { isRecording, toggle } = useSpeechToText({
	  lang: "ko-KR",
	  interim: false,
	  onFinal: async (finalText: string) => {
		setTextAreaValue(finalText);
		if (inputRef.current) {
		  (inputRef.current as any).value = finalText;
		  setInputLength(finalText.length);
		  paramsInputRef.current = finalText; // ✅ STT도 저장
		}
		await handleSubmitText();
	  },
	});
  
	const handleKeyDown = async (
	  event: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement | null>
	) => {
	  if (isComposing) return;
	  if (event.key === "Enter") {
		if (event.shiftKey) {
		  if (!settings.chatInput?.allowNewline) event.preventDefault();
		  return;
		}
		event.preventDefault();
  
		if (inputRef.current) {
		  const v = (inputRef.current as any).value;
		  setTextAreaValue(v);
		  setInputLength(v.length);
		  paramsInputRef.current = v; // ✅ 첫 질문도 저장
		}
  
		await handleSubmitText();
	  }
	};
  
	const handleTextAreaValueChange = (
	  event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement | null>
	) => {
	  if (!inputRef.current) return;
	  const v = (event.target as any).value;
	  setTextAreaValue(v);
	  setInputLength(v.length);
	};
  
	const enhanceButtons = (list: JSX.Element[]) =>
	  list?.map((button, index) => {
		const aria = (button.props?.["aria-label"] || button.props?.title || "") + "";
		const isRecordBtn =
		  button.props?.["data-role"] === "record" ||
		  button.props?.["data-rcb"] === "record" ||
		  /녹음|record|mic/i.test(aria);
  
		if (!isRecordBtn) return <Fragment key={index}>{button}</Fragment>;
  
		const originalOnClick = button.props?.onClick;
		const onClick = (e: any) => {
		  originalOnClick?.(e);
		  toggle();
		};
  
		return (
		  <Fragment key={index}>
			{React.cloneElement(button, {
			  onClick,
			  "aria-pressed": isRecording,
			})}
		  </Fragment>
		);
	  });
  
	return (
	  <div
		aria-label={settings.ariaLabel?.inputTextArea ?? "input text area"}
		role="textbox"
		onMouseDown={(event: MouseEvent) => {
		  event.stopPropagation();
		  if (
			!hasFlowStarted &&
			settings.general?.flowStartTrigger === "ON_CHATBOT_INTERACT"
		  ) {
			setHasFlowStarted(true);
		  }
		}}
		style={{ ...styles.chatInputContainerStyle }}
		className="rcb-chat-input"
	  >
		{textAreaSensitiveMode && settings.sensitiveInput?.maskInTextArea ? (
		  <input
			ref={inputRef as RefObject<HTMLInputElement>}
			type="password"
			className="rcb-chat-input-textarea"
			onChange={handleTextAreaValueChange}
			onKeyDown={handleKeyDown}
		  />
		) : (
		  <textarea
			ref={inputRef as RefObject<HTMLTextAreaElement>}
			rows={1}
			className="rcb-chat-input-textarea"
			onChange={handleTextAreaValueChange}
			onKeyDown={handleKeyDown}
		  />
		)}
		<>{enhanceButtons(buttons)}</>
	  </div>
	);
  };
  
  export default ChatBotInput;
  