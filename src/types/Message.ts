// types/Message.ts
export type Message = {
  id: string;
  content: string | JSX.Element;
  sender: string;     // "user" | "bot" 가정
  type: string;
  timestamp: string;
  tags?: Array<string>;
  contentWrapper?: React.ComponentType<{ children: React.ReactNode }>;
  // 밑에 추가
  isHistory?: boolean; // 과거 로드된 메시지
  isRead?: boolean;    // 읽음 여부
}
