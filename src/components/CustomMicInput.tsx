// src/components/CustomMicInput.tsx
import React, {
  useState,
  ChangeEvent,
  KeyboardEvent,
  RefObject,
  MouseEvent,
  Fragment,
  useEffect,
  isValidElement,
  cloneElement,
} from "react";

import { useSubmitInputInternal } from "../hooks/internal/useSubmitInputInternal";
import { useIsDesktopInternal } from "../hooks/internal/useIsDesktopInternal";
import { useTextAreaInternal } from "../hooks/internal/useTextAreaInternal";
import { useBotStatesContext } from "../context/BotStatesContext";
import { useBotRefsContext } from "../context/BotRefsContext";
import { useSettingsContext } from "../context/SettingsContext";
import { useStylesContext } from "../context/StylesContext";

import "./ChatBotInput/ChatBotInput.css"; // 기존 입력창 CSS 재사용

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

/**
 * 커스텀 입력창
 * - 배치:  [ ...기타버튼 ]  [🎙 마이크]  [전송▶]   (전송은 항상 맨 오른쪽)
 * - 마이크 색상: 기본 흰색 / 활성 rgb(88,167,167)
 * - 아이콘: 둥근 사각형 안 마이크(SVG)
 * - ko-KR 연속 인식, interim 반영, 최종 인식 시 자동 전송
 */
export default function CustomMicInput({
  buttons,
  onFinalAutoSend = true,
}: {
  buttons: JSX.Element[];
  onFinalAutoSend?: boolean;
}) {
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

  const { inputRef } = useBotRefsContext();
  const { handleSubmitText } = useSubmitInputInternal();
  const { setTextAreaValue } = useTextAreaInternal();

  const [isFocused, setIsFocused] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  // 🎙️ STT 상태
  const [listening, setListening] = useState(false);
  const [recognizer, setRecognizer] = useState<any>(null);

  // ===== 스타일 =====
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
    ...styles.characterLimitStyle,
  };
  const characterLimitReachedStyle: React.CSSProperties = {
    color: "#ff0000",
    ...styles.characterLimitReachedStyle,
  };
  const placeholder = textAreaDisabled
    ? settings.chatInput?.disabledPlaceholderText
    : settings.chatInput?.enabledPlaceholderText;

  // ===== 입력창 핸들러 =====
  const handleFocus = () => {
    if (textAreaDisabled) return;
    setIsFocused(true);
  };
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
    if (inputRef.current) {
      setTextAreaValue(event.target.value);
      setInputLength(inputRef.current.value.length);
    }
  };

  // ===== STT 초기화 =====
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "ko-KR";
    rec.interimResults = true;
    rec.continuous = true;
    if ("maxAlternatives" in rec) rec.maxAlternatives = 1;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    rec.onresult = (evt: any) => {
      let interim = "";
      let finalText = "";

      for (let i = evt.resultIndex; i < evt.results.length; i++) {
        const transcript = evt.results[i][0].transcript;
        if (evt.results[i].isFinal) finalText += transcript;
        else interim += transcript;
      }

      const combined = (finalText || interim || "").trim();

      if (inputRef.current) {
        setTextAreaValue(combined);
        setInputLength(combined.length);
      }

      if (finalText && onFinalAutoSend) {
        setTimeout(async () => {
          await handleSubmitText();
        }, 80);
      }
    };

    setRecognizer(rec);
  }, []);

  const toggleMic = async () => {
    if (!hasFlowStarted && settings.general?.flowStartTrigger === "ON_CHATBOT_INTERACT") {
      setHasFlowStarted(true);
    }
    if (!recognizer) {
      alert("이 브라우저는 음성 인식을 지원하지 않습니다.\nChrome 최신 버전 또는 HTTPS(혹은 localhost) 환경을 권장합니다.");
      return;
    }
    try {
      if (!listening) recognizer.start();
      else recognizer.stop();
    } catch (e) {
      console.warn(e);
    }
  };

  // ===== 전송 버튼을 맨 오른쪽으로 분리 =====
  const sendButtons: JSX.Element[] = [];
  const otherButtons: JSX.Element[] = [];
  (buttons || []).forEach((btn) => {
    if (isValidElement(btn)) {
      const cls = (btn.props?.className || "") as string;
      if (cls.includes("rcb-send-icon")) {
        // 오른쪽 끝 영역에서 자연스럽게 배치
        sendButtons.push(cloneElement(btn, { style: { ...(btn.props?.style || {}), marginLeft: 8 } }));
      } else {
        otherButtons.push(btn);
      }
    } else {
      otherButtons.push(btn);
    }
  });

  // 🎨 마이크 버튼 스타일 (요청 스펙)
  const ACTIVE_BG = "rgb(88,167,167)";
  const micBtnStyle: React.CSSProperties = {
    padding: 0,
    width: 44,
    height: 44,
    borderRadius: 12,
    border: "1px solid #e2e2e2",
    background: listening ? ACTIVE_BG : "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "transform .06s ease, filter .2s ease, background .2s ease",
  };

  // 마이크 아이콘(SVG) — 둥근 사각형 안 마이크
  const MicSVG = ({ active }: { active: boolean }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      {/* 바깥 라운드 사각형 */}
      <rect x="1.5" y="1.5" width="21" height="21" rx="5"
        fill="none" stroke={active ? "#ffffff" : "#9aa0a6"} strokeWidth="1.5" />
      {/* 마이크 바디 */}
      <rect x="10" y="6" width="4" height="8" rx="2"
        fill={active ? "#ffffff" : "#9aa0a6"} />
      {/* 마이크 스탠드 */}
      <path
        d="M7 11.5a5 5 0 0 0 10 0M12 16.5v3M9.5 19.5h5"
        stroke={active ? "#ffffff" : "#9aa0a6"}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );

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
      {/* 텍스트 입력 영역 */}
      {textAreaSensitiveMode && settings.sensitiveInput?.maskInTextArea ? (
        <input
          ref={inputRef as RefObject<HTMLInputElement>}
          type="password"
          className="rcb-chat-input-textarea"
          style={textAreaDisabled ? textAreaDisabledStyle : isFocused ? textAreaFocusedStyle : textAreaStyle}
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
          rows={1}
          className="rcb-chat-input-textarea"
          style={textAreaDisabled ? textAreaDisabledStyle : isFocused ? textAreaFocusedStyle : textAreaStyle}
          placeholder={placeholder}
          onChange={handleTextAreaValueChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
        />
      )}

      {/* 기타 버튼(있으면) */}
      {otherButtons.map((button, i) => (
        <Fragment key={`other-${i}`}>{button}</Fragment>
      ))}

      {/* 오른쪽 액션 영역: [마이크] [전송] */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
        {/* 🎙 마이크 토글 */}
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggleMic}
          aria-label={listening ? "음성 인식 중지" : "음성 인식 시작"}
          title={listening ? "음성 인식 중지" : "음성 인식 시작"}
          style={micBtnStyle}
          onMouseEnter={(e) => ((e.currentTarget.style.filter = "brightness(0.97)"))}
          onMouseLeave={(e) => ((e.currentTarget.style.filter = "none"))}
          onMouseDown={(e) => ((e.currentTarget.style.transform = "scale(0.98)"))}
          onMouseUp={(e) => ((e.currentTarget.style.transform = "scale(1)"))}
        >
          <MicSVG active={listening} />
        </button>

        {/* ▶ 전송 버튼(항상 맨 오른쪽) */}
        {sendButtons.map((btn, i) => (
          <Fragment key={`send-${i}`}>{btn}</Fragment>
        ))}
      </div>

      {/* 글자수 카운터(옵션) */}
      {settings.chatInput?.showCharacterCount &&
        settings.chatInput?.characterLimit != null &&
        settings.chatInput?.characterLimit > 0 && (
          <div
            className="rcb-chat-input-char-counter"
            style={
              inputLength >= (settings.chatInput?.characterLimit ?? 0)
                ? characterLimitReachedStyle
                : characterLimitStyle
            }
          >
            {inputLength}/{settings.chatInput?.characterLimit}
          </div>
        )}
    </div>
  );
}
