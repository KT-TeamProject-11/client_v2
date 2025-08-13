import {
  useContext,
  createContext,
  Dispatch,
  SetStateAction,
  MutableRefObject,
  useEffect,
  useRef,
} from "react";
import { Message } from "../types/Message";
import { useBotStatesContext } from "./BotStatesContext";
import { useSyncedRefState } from "../hooks/internal/useSyncedRefState";

type MessagesContextType = {
  messages: Message[];
  setSyncedMessages: Dispatch<SetStateAction<Message[]>>;
  syncedMessagesRef: MutableRefObject<Message[]>;
};

const MessagesContext = createContext<MessagesContextType>({
  messages: [],
  setSyncedMessages: () => {},
  syncedMessagesRef: { current: [] },
});

const useMessagesContext = () => useContext(MessagesContext);

const MessagesProvider = ({ children }: { children: React.ReactNode }) => {
  const [messages, setSyncedMessages, syncedMessagesRef] =
    useSyncedRefState<Message[]>([]);

  const {
    setUnreadCount,
    bootTimeRef,
    hasFlowStarted,
    setHasFlowStarted,
    // isChatWindowOpen, // 배지 증가에서 창 열림 여부는 일단 제외(레이스 방지)
  } = useBotStatesContext();

  // 이전 메시지 개수 기억 (초기 배치 판별용)
  const prevLenRef = useRef(0);

  useEffect(() => {
    const curr = messages ?? [];
    const prevLen = prevLenRef.current;

    if (curr.length > prevLen) {
      const newlyAdded = curr.slice(prevLen);

      // ✅ 1) "초기 배치(첫 마운트 때 들어온 히스토리/웰컴)"는 절대 카운트하지 않음
      const isInitialBatch = prevLen === 0;
      if (isInitialBatch) {
        setUnreadCount(0);
        prevLenRef.current = curr.length;
        syncedMessagesRef.current = curr;
        return;
      }

      // ✅ 2) 이번 배치에 사용자 메시지가 하나라도 있으면 그 순간 대화 시작으로 간주
      const flowStartedNow =
        hasFlowStarted || newlyAdded.some((m) => (m.sender ?? "") === "user");
      if (!hasFlowStarted && flowStartedNow) setHasFlowStarted(true);

      // 대화 시작 전이면 카운트 중지
      if (!flowStartedNow) {
        prevLenRef.current = curr.length;
        syncedMessagesRef.current = curr;
        return;
      }

      // ✅ 3) 부트 이후 들어온 봇/시스템 메시지들만 카운트 (+ 창 열림 여부는 배지 증가에 영향 주지 않음)
      let delta = 0;
      for (const m of newlyAdded) {
        const ts = Date.parse(m.timestamp ?? "");
        const hasValidTs = Number.isFinite(ts);
        const isAfterBoot = hasValidTs ? ts >= bootTimeRef.current : flowStartedNow;

        if (
          isAfterBoot &&
          (m.sender ?? "") !== "user" &&
          !m.isHistory &&
          !m.isRead
        ) {
          delta++;
        }
      }

      if (delta > 0) setUnreadCount((c) => c + delta);
    }

    // 다음 비교를 위해 저장
    prevLenRef.current = curr.length;
    syncedMessagesRef.current = curr;
  }, [
    messages,
    setUnreadCount,
    bootTimeRef,
    hasFlowStarted,
    setHasFlowStarted,
    syncedMessagesRef,
  ]);

  return (
    <MessagesContext.Provider value={{ messages, setSyncedMessages, syncedMessagesRef }}>
      {children}
    </MessagesContext.Provider>
  );
};

export { useMessagesContext, MessagesProvider };
