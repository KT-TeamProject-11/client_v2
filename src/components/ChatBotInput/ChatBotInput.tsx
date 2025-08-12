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
  
  import useSpeechToText from "../../hooks/useSpeechToText"; // ✅ 추가
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
	  setInputLength
	} = useBotStatesContext();
  
	const { inputRef } = useBotRefsContext();
  
	const [isFocused, setIsFocused] = useState<boolean>(false);
	const [isComposing, setIsComposing] = useState<boolean>(false);
  
	const { handleSubmitText } = useSubmitInputInternal();
	const { setTextAreaValue } = useTextAreaInternal();
  
	// ✅ STT: 최종 인식 텍스트를 입력창에 넣고 즉시 전송
	const { isRecording, toggle } = useSpeechToText({
	  lang: "ko-KR",
	  interim: false,
	  onFinal: async (finalText: string) => {
		setTextAreaValue(finalText);
		if (inputRef.current) {
		  (inputRef.current as any).value = finalText;
		  setInputLength(finalText.length);
		}
		await handleSubmitText();
	  },
	});
  
	const textAreaStyle: React.CSSProperties = {
	  boxSizing: isDesktop ? "content-box" : "border-box",
	  ...styles.chatInputAreaStyle,
	};
	const textAreaFocusedStyle: React.CSSProperties = {
	  outline: !textAreaDisabled ? "none" : "",
	  boxShadow: !textAreaDisabled ? `0 0 5px ${settings.general?.primaryColor}` : "",
	  boxSizing: isDesktop ? "content-box" : "border-box",
	  ...styles.chatInputAreaStyle,
	  ...styles.chatInputAreaFocusedStyle,
	};
	const textAreaDisabledStyle: React.CSSProperties = {
	  cursor: `url("${settings.general?.actionDisabledIcon}"), auto`,
	  caretColor: "transparent",
	  boxSizing: isDesktop ? "content-box" : "border-box",
	  ...styles.chatInputAreaStyle,
	  ...styles.chatInputAreaDisabledStyle,
	};
	const characterLimitStyle: React.CSSProperties = {
	  color: "#989898",
	  ...styles.characterLimitStyle
	};
	const characterLimitReachedStyle: React.CSSProperties = {
	  color: "#ff0000",
	  ...styles.characterLimitReachedStyle
	};
	const placeholder = textAreaDisabled
	  ? settings.chatInput?.disabledPlaceholderText
	  : settings.chatInput?.enabledPlaceholderText;
  
	const handleFocus = () => { if (!textAreaDisabled) setIsFocused(true); };
	const handleBlur = () => setIsFocused(false);
	const handleCompositionStart = () => setIsComposing(true);
	const handleCompositionEnd = () => setIsComposing(false);
  
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
  
	// ✅ 기존 buttons 중 "녹음" 버튼을 찾아 STT 토글을 주입
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
		  // 기존 로직 먼저 유지
		  originalOnClick?.(e);
		  // STT 토글 (사용자 클릭 이벤트 컨텍스트에서 호출)
		  toggle();
		};
  
		// 시각 디자인은 절대 바꾸지 않음: 클래스/스타일 그대로 유지
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
		  if (!hasFlowStarted && settings.general?.flowStartTrigger === "ON_CHATBOT_INTERACT") {
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
			style={textAreaDisabled ? textAreaDisabledStyle : (isFocused ? textAreaFocusedStyle : textAreaStyle)}
			placeholder={placeholder}
			onChange={handleTextAreaValueChange}
			onKeyDown={handleKeyDown}
			onFocus={handleFocus}
			onBlur={handleBlur}
			onCompositionStart={handleCompositionStart}
			onCompositionEnd={handleCompositionEnd}
		  />
		) : (
		  <textarea
			ref={inputRef as RefObject<HTMLTextAreaElement>}
			style={textAreaDisabled ? textAreaDisabledStyle : (isFocused ? textAreaFocusedStyle : textAreaStyle)}
			rows={1}
			className="rcb-chat-input-textarea"
			placeholder={placeholder}
			onChange={handleTextAreaValueChange}
			onKeyDown={handleKeyDown}
			onFocus={handleFocus}
			onBlur={handleBlur}
			onCompositionStart={handleCompositionStart}
			onCompositionEnd={handleCompositionEnd}
		  />
		)}
  
		<>
		  {/* ✅ 새 버튼 추가 금지: 기존 버튼들만 렌더링하되, 녹음 버튼에는 STT 토글만 주입 */}
		  {enhanceButtons(buttons)}
  
		  {settings.chatInput?.showCharacterCount &&
			settings.chatInput?.characterLimit != null &&
			settings.chatInput?.characterLimit > 0 && (
			  <div
				className="rcb-chat-input-char-counter"
				style={
				  inputLength >= settings.chatInput?.characterLimit
					? characterLimitReachedStyle
					: characterLimitStyle
				}
			  >
				{inputLength}/{settings.chatInput?.characterLimit}
			  </div>
			)}
		</>
	  </div>
	);
  };
  
  export default ChatBotInput;
  