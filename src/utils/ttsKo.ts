function resolveBaseUrl(): string {
  const g: any = typeof globalThis !== "undefined" ? globalThis : window;
  if (g && g.__API_BASE_URL__) {
    return String(g.__API_BASE_URL__).replace(/\/+$/, "");
  }
  if (typeof document !== "undefined") {
    const meta = document.querySelector('meta[name="api-base-url"]') as HTMLMetaElement | null;
    const v = meta?.getAttribute("content");
    if (v) return v.replace(/\/+$/, "");
  }
  return "http://222.116.135.71:8555";
}
const BASE_URL = resolveBaseUrl();

let currentAudio: HTMLAudioElement | null = null;
let currentBlobUrl: string | null = null;

function ensureAudio(): HTMLAudioElement {
  if (currentAudio) return currentAudio;
  const a = new Audio();
  a.preload = "auto";
  currentAudio = a;
  return a;
}

export function isSpeaking(): boolean {
  const a = currentAudio;
  return !!a && !a.paused && !a.ended;
}

export function cancelTTS() {
  try {
    const a = currentAudio;
    if (!a) return;
    a.pause();
    if (currentBlobUrl && a.src === currentBlobUrl) {
      URL.revokeObjectURL(currentBlobUrl);
      currentBlobUrl = null;
    }
    a.src = "";
    a.load?.();
  } catch {}
}

/**
 * HTML 태그 제거 함수
 */
function stripHtml(html: string): string {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

/**
 * 서버 기반 TTS 호출
 */
export async function speak(text: string): Promise<void> {
  const t = stripHtml((text || "").trim());  // ✅ HTML 제거
  if (!t) return;

  cancelTTS();
  const a = ensureAudio();

  try {
    const res = await fetch(`${BASE_URL}/api/tts/speak`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: t }),
    });
    if (!res.ok) throw new Error(`TTS request failed: ${res.status}`);

    const blob = await res.blob();

    if (currentBlobUrl) {
      URL.revokeObjectURL(currentBlobUrl);
      currentBlobUrl = null;
    }
    currentBlobUrl = URL.createObjectURL(blob);
    a.src = currentBlobUrl;
    await a.play().catch(() => {});
  } catch {
    // 실패는 무시
  }
}

export default { speak, cancelTTS, isSpeaking };
