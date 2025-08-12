import { useCallback, useEffect, useRef, useState } from "react";

type UseSTTOptions = {
  lang?: string;
  interim?: boolean;
  onFinal?: (text: string) => void;
};

export default function useSpeechToText(opts: UseSTTOptions = {}) {
  const { lang = "ko-KR", interim = false, onFinal } = opts;
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognition | null>(null);
  const finalRef = useRef("");

  useEffect(() => {
    const SR: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError("이 브라우저는 음성 인식을 지원하지 않아요.");
      return;
    }
    const rec: SpeechRecognition = new SR();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = interim;

    rec.onstart = () => {
      setIsRecording(true);
      setError(null);
      finalRef.current = "";
    };
    rec.onerror = (e: any) => setError(e?.error || "음성 인식 오류");
    rec.onresult = (ev: SpeechRecognitionEvent) => {
      let t = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        t += ev.results[i][0].transcript;
      }
      finalRef.current = (t || "").trim();
    };
    rec.onend = () => {
      setIsRecording(false);
      if (finalRef.current && onFinal) onFinal(finalRef.current);
    };

    recRef.current = rec;
    return () => {
      try { rec.stop(); } catch {}
      recRef.current = null;
    };
  }, [lang, interim, onFinal]);

  const start = useCallback(() => {
    if (!recRef.current) {
      setError("이 브라우저는 음성 인식을 지원하지 않아요.");
      return;
    }
    try { recRef.current.start(); } catch {}
  }, []);
  const stop = useCallback(() => { try { recRef.current?.stop(); } catch {} }, []);
  const toggle = useCallback(() => { if (isRecording) stop(); else start(); }, [isRecording, start, stop]);

  return { isRecording, start, stop, toggle, error };
}
