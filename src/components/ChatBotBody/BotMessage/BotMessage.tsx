import { CSSProperties, useEffect, useRef } from "react";
import { useSettingsContext } from "../../../context/SettingsContext";
import { useStylesContext } from "../../../context/StylesContext";
import { Message } from "../../../types/Message";
import "./BotMessage.css";
import DOMPurify from "dompurify";

const BotMessage = ({
  message,
  isNewSender,
}: {
  message: Message;
  isNewSender: boolean;
}) => {
  const { settings } = useSettingsContext();
  const { styles } = useStylesContext();

  const isStringContent = typeof message.content === "string";
  const baseContent: React.ReactNode = message.content;

  const ContentWrapper =
    message.contentWrapper ?? (({ children }: { children: React.ReactNode }) => <>{children}</>);

  const htmlRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 링크에 target/rel이 없더라도 보강 (백엔드가 해주지만 이중 안전)
    const root = htmlRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLAnchorElement>("a").forEach((a) => {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    });
  }, [message?.content]);

  // ← 여기가 포인트!
  // 컨테이너에서 캡처 단계로 클릭을 가로채서 항상 새 탭으로 연다.
  const handleLinkOpenInNewTabCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const a = target.closest("a") as HTMLAnchorElement | null;
    if (!a || !a.href) return;

    // meta/ctrl 클릭 등 브라우저 기본 단축키는 존중
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button === 1) {
      return; // 기본 동작 유지(이미 새 탭/새 창)
    }

    // 기본 이동 막고 수동으로 새 탭 열기
    e.preventDefault();
    e.stopPropagation();
    window.open(a.href, "_blank", "noopener,noreferrer");
  };

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
          <ContentWrapper>
            <div
              ref={htmlRef}
              className="message-content"
              onClickCapture={handleLinkOpenInNewTabCapture}  // ★ 추가
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(String(message.content ?? "")),
              }}
            />
          </ContentWrapper>

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
        <>{baseContent}</>
      )}
    </div>
  );
};

export default BotMessage;
