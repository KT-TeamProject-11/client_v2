// src/components/Buttons/VoiceButton/VoiceButton.tsx
import { useEffect, useRef, useState, MouseEvent } from "react";

import { useSettingsContext } from "../../../context/SettingsContext";
import { useStylesContext } from "../../../context/StylesContext";
import { useBotRefsContext } from "../../../context/BotRefsContext";
import { useTextAreaInternal } from "../../../hooks/internal/useTextAreaInternal";
import { useVoiceInternal } from "../../../hooks/internal/useVoiceInternal";
import { useMessagesInternal } from "../../../hooks/internal/useMessagesInternal";
import { useBotStatesContext } from "../../../context/BotStatesContext";

import "./VoiceButton.css";

// ✅ PNG만 사용
import idlePng from "../../../assets/voice_icon_disabled.png";              // 처음 화면(검은 마이크)
import disabledPng from "../../../assets/voice_icon.png"; // 누르면(녹음 중) 이 이미지

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

const BUTTON_SIZE = 60; // 버튼 크기
const ICON_SCALE = 0.8; // 버튼 안 아이콘 비율

const VoiceButton = () => {
  const { settings } = useSettingsContext();
  const { styles } = useStylesContext();
  const { inputRef } = useBotRefsContext();

  const { setTextAreaValue } = useTextAreaInternal();
  const { voiceToggledOn, setVoiceToggledOn } = useVoiceInternal();
  const { addToast } = useMessagesInternal();
  const {
    textAreaDisabled,
    textAreaSensitiveMode,
    hasFlowStarted,
    setHasFlowStarted,
    setInputLength,
  } = useBotStatesContext();

  // --- STT ---
  const recRef = useRef<any>(null);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      recRef.current = null;
      return;
    }
    const rec = new SR();
    rec.lang = (settings.voice?.speechRecognitionLang as string) || "ko-KR";
    rec.interimResults = true;
    (rec as any).continuous = true;
    if ("maxAlternatives" in rec) (rec as any).maxAlternatives = 1;

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    rec.onresult = (evt: any) => {
      let interim = "";
      let finalText = "";
      for (let i = evt.resultIndex; i < evt.results.length; i++) {
        const transcript: string = evt.results[i][0].transcript;
        if (evt.results[i].isFinal) finalText += transcript;
        else interim += transcript;
      }
      const combined = (finalText || interim || "").trim();
      if (!textAreaSensitiveMode && inputRef?.current) {
        setTextAreaValue(combined);
        setInputLength(combined.length);
      }
    };

    recRef.current = rec;
    return () => {
      try { rec.stop(); } catch {}
      recRef.current = null;
    };
  }, [
    settings.voice?.speechRecognitionLang,
    inputRef,
    setTextAreaValue,
    setInputLength,
    textAreaSensitiveMode,
  ]);

  // --- 토글 ---
  const toggleVoice = (e?: MouseEvent<HTMLDivElement>) => {
    e?.preventDefault();

    if (textAreaDisabled) {
      addToast?.("지금은 음성 입력을 사용할 수 없어요.");
      return;
    }

    if (!hasFlowStarted && settings.general?.flowStartTrigger === "ON_CHATBOT_INTERACT") {
      setHasFlowStarted(true);
    }

    if (!recRef.current) {
      const msg =
        "이 브라우저는 음성 인식을 지원하지 않습니다.\nChrome 최신 버전 또는 HTTPS(혹은 localhost) 환경을 권장합니다.";
      addToast ? addToast(msg) : alert(msg);
      return;
    }

    try {
      if (!listening) {
        recRef.current.start();
        setVoiceToggledOn(true);
      } else {
        recRef.current.stop();
        setVoiceToggledOn(false);
      }
    } catch {
      // 빠른 연타 예외 무시
    }
  };

  // --- 렌더 ---
  const renderButton = () => {
    // 처음(대기) = idlePng, 누르면(녹음 중) = disabledPng
    const iconSrc = (textAreaDisabled || !recRef.current || listening) ? disabledPng : idlePng;

    return (
      <div
        title={!listening ? (settings.voice?.buttonOnText || "마이크 켜기") : (settings.voice?.buttonOffText || "마이크 끄기")}
        className={`rcb-voice-icon ${listening ? "on" : ""}`}
        style={{
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          borderRadius: 12,
          display: "grid",
          placeItems: "center",
          ...(styles.voiceIconStyle || {}),
        }}
      >
        <img
          src={iconSrc}
          alt=""
          aria-hidden
          draggable={false}
          style={{
            width: `${ICON_SCALE * 100}%`,
            height: `${ICON_SCALE * 100}%`,
            objectFit: "contain",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
      </div>
    );
  };

  return (
    <div
      onClick={toggleVoice}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") toggleVoice();
      }}
      role="button"
      aria-pressed={listening}
      tabIndex={0}
      style={
        voiceToggledOn && !textAreaDisabled
          ? { ...(styles.voiceButtonStyle || {}) }
          : { ...(styles.voiceButtonStyle || {}), ...(styles.voiceButtonDisabledStyle || {}) }
      }
      className={voiceToggledOn && !textAreaDisabled ? "rcb-voice-button-enabled" : "rcb-voice-button-disabled"}
    >
      {renderButton()}
    </div>
  );
};

export default VoiceButton;
