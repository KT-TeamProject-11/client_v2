import { Settings } from "../types/Settings";
import { speak, cancelTTS } from "../utils/ttsKo";

/**
 * Handles reading out of messages sent by the bot.
 */
export const speakMessage = (
  message: string,
  _language: string,
  _voiceNames: string[],
  rate: number,
  volume: number
) => {
  // 서버 TTS를 쓰므로 SpeechSynthesis API 체크 불필요
  cancelTTS();
  speak(message);
};

/**
 * Handles logic for reading out a bot message.
 */
export const processAudio = (settings: Settings, textToRead: string) => {
  const rate = settings.audio?.rate ?? 1;
  const volume = settings.audio?.volume ?? 1;

  cancelTTS();
  speak(textToRead);
};

/** 외부에서 재생을 중단하고 싶을 때 사용할 수 있는 stop 함수 */
export const stop = () => {
  cancelTTS();
};
