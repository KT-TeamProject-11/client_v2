// src/utils/ttsKo.ts
// B안: 문장 분할 + 언어 자동 감지 + 언어별 보이스로 "연속 재생"
// 개선사항: 보이스 로딩 타임아웃, 재생 취소 토큰, rate/volume 가드, Safari 호환 보강

export type SpeakOptions = {
  rate?: number;    // 기본 1 (0.1~2 권장)
  volume?: number;  // 기본 1 (0~1)
  preferred?: "auto" | "ko-KR" | "en-US"; // 기본 auto
  pitch?: number;   // 기본 1 (0~2), 옵션
};

let cachedVoices: SpeechSynthesisVoice[] | null = null;

// 재생 세대 토큰: cancelTTS() 호출 시 증가 → 진행 중 루프가 중단되도록
let playGen = 0;

// --- 공통 유틸 ---
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function cancelTTS() {
  try {
    window.speechSynthesis?.cancel();
  } catch {}
  // 새 세대를 시작하게 만들어 진행 중 재생 루프를 중단
  playGen++;
}

/**
 * 브라우저별 보이스 로딩 타이밍 이슈 대응:
 * - 즉시 보이스가 있으면 반환
 * - 없으면 voiceschanged 이벤트 대기 + 타임아웃(1200ms) 세이프가드
 * - 일부 브라우저는 getVoices()를 먼저 호출해야 이벤트가 뜸
 */
function waitVoices(timeoutMs = 1200): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    if (!synth?.getVoices) return resolve([]);

    // 트리거용 선 호출
    const first = synth.getVoices();
    if (first && first.length) {
      cachedVoices = first;
      return resolve(first);
    }

    let settled = false;
    const handler = () => {
      const v = synth.getVoices() || [];
      if (!settled && v.length) {
        settled = true;
        synth.removeEventListener("voiceschanged", handler);
        cachedVoices = v;
        resolve(v);
      }
    };

    synth.addEventListener("voiceschanged", handler);

    // 타임아웃: 보이스가 없어도 현재 상태 반환(최소 한 번 시도)
    setTimeout(() => {
      if (!settled) {
        settled = true;
        synth.removeEventListener("voiceschanged", handler);
        const v = synth.getVoices() || [];
        cachedVoices = v;
        resolve(v);
      }
    }, timeoutMs);
  });
}

async function getVoices(): Promise<SpeechSynthesisVoice[]> {
  if (cachedVoices && cachedVoices.length) return cachedVoices;
  return await waitVoices();
}

// 아주 단순한 언어 감지: 한글 문자가 하나라도 있으면 ko-KR, 아니면 en-US
function detectLang(text: string): "ko-KR" | "en-US" {
  return /[가-힣]/.test(text) ? "ko-KR" : "en-US";
}

// Safari/OS별 lang 표기 변형까지 일부 흡수
function sameLang(a?: string, b?: string) {
  if (!a || !b) return false;
  const na = a.replace("_", "-").toLowerCase();
  const nb = b.replace("_", "-").toLowerCase();
  return na === nb;
}

async function pickVoiceByLang(lang: "ko-KR" | "en-US") {
  const voices = await getVoices();

  // 1) lang 완전 일치(ko-KR/en-US)
  let v = voices.find(vi => sameLang(vi.lang, lang));
  if (v) return v;

  // 2) 하위태그 없는 기본 언어 일치(ko, en)
  const hint = lang.split("-")[0]; // "ko" | "en"
  v = voices.find(vi => (vi.lang || "").toLowerCase().startsWith(hint));
  if (v) return v;

  // 3) name/lang 내에 힌트 글자 포함
  const re = new RegExp(`\\b${hint}\\b`, "i");
  v = voices.find(vi => re.test(`${vi.name} ${vi.lang}`));
  return v || null;
}

// 너무 긴 텍스트를 적당히 끊기 (문장/구두점/줄바꿈 기준 → 길면 추가 분할)
function splitToChunks(text: string): string[] {
  if (!text) return [];

  // 1차: 문장 구분 (…, !, ?, ., 한중일 구두점, 줄바꿈)
  const raw = text
    .split(/([.!?…。！？\n])/)
    .reduce<string[]>((acc, part, idx, arr) => {
      if (idx % 2 === 0) {
        const end = arr[idx + 1] ?? "";
        const joined = (part + end).trim();
        if (joined) acc.push(joined);
      }
      return acc;
    }, []);

  // 2차: 너무 긴 문장 추가 분할 (대략 250자 기준)
  const chunks: string[] = [];
  for (const s of raw.length ? raw : [text]) {
    if (s.length <= 250) {
      chunks.push(s);
      continue;
    }
    let buf = s;
    while (buf.length > 250) {
      // 공백 기준 분할 우선, 없으면 하드컷
      const cut = buf.lastIndexOf(" ", 240);
      const idx = cut > 150 ? cut : 240;
      chunks.push(buf.slice(0, idx).trim());
      buf = buf.slice(idx).trim();
    }
    if (buf) chunks.push(buf);
  }
  return chunks;
}

function speakOnce(utter: SpeechSynthesisUtterance) {
  return new Promise<void>((resolve, reject) => {
    utter.onend = () => resolve();
    utter.onerror = () => reject(new Error("speech synthesis error"));
    try {
      window.speechSynthesis.speak(utter);
    } catch (e) {
      // speak 호출 자체가 실패할 수 있는 환경 대비
      resolve();
    }
  });
}

// --- 공개 API ---
// 1) 한국어 고정 (A안 호환용: 남겨둠)
export async function speakKo(text: string, rate = 1, volume = 1) {
  await speakSmart(text, { rate, volume, preferred: "ko-KR" });
}

// 2) B안: 문장 분할 + 자동 감지 + 언어별 보이스 연속 재생
export async function speakSmart(text: string, opts: SpeakOptions = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const synth = window.speechSynthesis;
  if (!text?.trim()) return;

  // 새로운 재생 세대 시작: 이전 재생 취소 + 내 세대 토큰 확보
  cancelTTS();
  const myGen = playGen;

  const rate = clamp(opts.rate ?? 1, 0.1, 2);
  const volume = clamp(opts.volume ?? 1, 0, 1);
  const pitch = clamp(opts.pitch ?? 1, 0, 2);
  const preferred = opts.preferred ?? "auto";

  // 보이스 목록 미리 로드(타임아웃 포함)
  await getVoices();
  if (myGen !== playGen) return; // 중간에 cancel되면 중단

  const chunks = splitToChunks(text);

  for (const part of chunks) {
    if (myGen !== playGen) break; // 재생 중단 요청됨

    const lang = preferred === "auto" ? detectLang(part) : preferred;
    const voice = await pickVoiceByLang(lang);

    if (myGen !== playGen) break;

    const utter = new window.SpeechSynthesisUtterance(part);
    utter.lang = voice?.lang || lang;
    if (voice) utter.voice = voice;
    utter.rate = rate;
    utter.volume = volume;
    utter.pitch = pitch;

    // iOS/Safari에서 간헐적으로 큐가 비정상 쌓이는 것을 방지
    try {
      if (synth.speaking) synth.cancel();
    } catch {}

    try {
      await speakOnce(utter);
    } catch {
      // 에러가 나도 다음 chunk 시도
      continue;
    }
  }
}