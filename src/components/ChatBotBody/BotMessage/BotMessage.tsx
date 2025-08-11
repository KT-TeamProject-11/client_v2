import { CSSProperties, useEffect, useRef } from "react"; // ⬅️ useEffect/useRef 추가
import { useSettingsContext } from "../../../context/SettingsContext";
import { useStylesContext } from "../../../context/StylesContext";
import { Message } from "../../../types/Message";
import "./BotMessage.css";

const BotMessage = ({
  message,
  isNewSender,
}: {
  message: Message;
  isNewSender: boolean;
}) => {
  const { settings } = useSettingsContext();
  const { styles } = useStylesContext();

  // 문자열인지 체크
  const isStringContent = typeof message.content === "string";
  const baseContent: React.ReactNode = message.content;

  // wrapper 유무 (아래에서 HTML을 이 wrapper 안에 넣어줄 거라서 변수만 유지)
  const ContentWrapper = message.contentWrapper ?? (({ children }: { children: React.ReactNode }) => <>{children}</>);

  // 링크 보강용 ref
  const htmlRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 새 탭 링크 보안 속성 부여
    const root = htmlRef.current;
    if (!root) return;
    root.querySelectorAll('a[target="_blank"]').forEach((a) => {
      a.setAttribute("rel", "noopener noreferrer");
    });
  }, [message?.content]);

  const botBubbleStyle: CSSProperties = {
    backgroundColor: settings.general?.secondaryColor,
    color: "#fff",
    maxWidth: settings.botBubble?.showAvatar ? "65%" : "70%",
    ...styles.botBubbleStyle,
  };
  const botBubbleEntryStyle = settings.botBubble?.animate ? "rcb-bot-message-entry" : "";

  const showAvatar = settings.botBubble?.showAvatar && isNewSender;
  const offsetStyle = `rcb-bot-message${
    !isNewSender && settings.botBubble?.showAvatar ? " rcb-bot-message-offset" : ""
  }`;

  const handleOptionClick = (value: string) => {
    const input = document.querySelector<HTMLInputElement>(".rcb-input-area input");
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
    const sendButton = document.querySelector<HTMLButtonElement>(".rcb-send-icon");
    sendButton?.click();
  };

  return (
    <div className="rcb-bot-message-container">
      {showAvatar && (
        <div
          style={{ backgroundImage: `url("${settings.botBubble?.avatar}")` }}
          className="rcb-message-bot-avatar"
        />
      )}

      {isStringContent ? (
        <div style={botBubbleStyle} className={`${offsetStyle} ${botBubbleEntryStyle}`}>
          {/* ✅ 문자열이면 HTML로 렌더 */}
          <ContentWrapper>
            <div
              ref={htmlRef}
              className="message-content"
              dangerouslySetInnerHTML={{ __html: String(message.content ?? "") }}
            />
          </ContentWrapper>

          {/* 옵션 버튼 */}
          {message.options && (
            <div className="rcb-option-buttons">
              {message.options.map((option, index) => (
                <button
                  key={index}
                  className="rcb-option-button"
                  onClick={() => handleOptionClick(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        // 문자열이 아닌 React 노드 콘텐츠는 기존 방식 유지
        <>{baseContent}</>
      )}
    </div>
  );
};

export default BotMessage;