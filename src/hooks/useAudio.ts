import { useCallback, useState } from "react";
import { speak as ttsSpeak, cancelTTS } from "../utils/ttsKo";

/**
 * Custom hook to control server-based TTS (edge-tts).
 */
export function useAudio() {
  const [enabled, setEnabled] = useState<boolean>(false);

  // 🔄 오디오 ON/OFF 토글
  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      if (!next) {
        // 끄기 직전 강제로 중단
        cancelTTS();
      }
      return next;
    });
  }, []);

  // 📢 말하기
  const speak = useCallback(
    async (text: string) => {
      if (!enabled) return;
      await ttsSpeak(text); // ✅ HTML 태그 제거된 텍스트만 읽음
    },
    [enabled]
  );

  // ⏹ 멈추기
  const stop = useCallback(() => {
    cancelTTS();
  }, []);

  return { enabled, toggle, speak, stop };
}

export default useAudio;
