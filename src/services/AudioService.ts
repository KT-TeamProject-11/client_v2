// src/services/AudioService.ts
import { Settings } from "../types/Settings";
import { speakSmart, cancelTTS } from "../utils/ttsKo";

/**
 * Handles reading out of messages sent by the bot.
 *
 * NOTE:
 *  - language, voiceNames 파라미터는 무시하고, B안의 자동 감지를 사용합니다.
 *  - rate, volume만 그대로 반영합니다.
 */
export const speak = (
  message: string,
  _language: string,
  _voiceNames: string[],
  rate: number,
  volume: number
) => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.info("Speech Synthesis API is not supported in this environment.");
    return;
  }
  // 겹쳐 읽기 방지
  cancelTTS();
  // B안: 문장 분할 + 자동 감지 + 언어별 보이스로 연속 재생
  speakSmart(message, { rate, volume, preferred: "auto" });
};

/**
 * Handles logic for reading out a bot message.
 */
export const processAudio = (settings: Settings, textToRead: string) => {
  const rate = settings.audio?.rate ?? 1;
  const volume = settings.audio?.volume ?? 1;

  cancelTTS();
  speakSmart(textToRead, { rate, volume, preferred: "auto" });
};

/** 외부에서 재생을 중단하고 싶을 때 사용할 수 있는 stop 함수 */
export const stop = () => {
  cancelTTS();
};