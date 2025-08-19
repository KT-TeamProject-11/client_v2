import { CSSProperties, useEffect, useRef, useState } from "react";
import { useSettingsContext } from "../../../context/SettingsContext";
import { useStylesContext } from "../../../context/StylesContext";
import { Message } from "../../../types/Message";
import "./BotMessage.css";
import DOMPurify from "dompurify";

const BotMessage = ({ message, isNewSender }: { message: Message; isNewSender: boolean }) => {
  const { settings } = useSettingsContext();
  const { styles } = useStylesContext();

  const isStringContent = typeof message.content === "string";
  const baseContent: React.ReactNode = message.content;

  const ContentWrapper =
    message.contentWrapper ?? (({ children }: { children: React.ReactNode }) => <>{children}</>);

  // 말풍선 안쪽(콘텐츠) & 바깥 버튼 컨테이너 refs
  const htmlRef = useRef<HTMLDivElement>(null);
  const outsideLinksRef = useRef<HTMLDivElement>(null);
  const [hasExtractedLinks, setHasExtractedLinks] = useState(false);

  // a 보안 속성 보강
  useEffect(() => {
    const root = htmlRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLAnchorElement>("a").forEach((a) => {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    });
  }, [message?.content]);

  // 말풍선 안의 .rcb-link-buttons 를 "복제"해서 바깥 컨테이너에 채움(안쪽은 숨김)
  useEffect(() => {
    const root = htmlRef.current;
    const dest = outsideLinksRef.current;
    if (!root || !dest) return;

    dest.innerHTML = "";
    let found = false;
    root.querySelectorAll<HTMLElement>(".rcb-link-buttons").forEach((group) => {
      dest.innerHTML += group.innerHTML;          // 바깥으로 복제
      (group as HTMLElement).style.display = "none"; // 안쪽은 숨김 (CSS에서도 숨기지만 안전망)
      found = true;
    });
    setHasExtractedLinks(found);
  }, [message?.content]);

  // 새 탭 열기 보강
  const handleLinkOpenInNewTabCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    const a = target?.closest("a") as HTMLAnchorElement | null;
    if (!a || !a.href) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button === 1) return;
    e.preventDefault();
    e.stopPropagation();
    window.open(a.href, "_blank", "noopener,noreferrer");
  };

  // 폭 정렬(버블=65/70%)
  const bubbleMaxPercent = settings.botBubble?.showAvatar ? "65%" : "70%";
  const botBubbleStyle: CSSProperties = {
    backgroundColor: settings.general?.secondaryColor,
    color: "#fff",
    maxWidth: bubbleMaxPercent,
    ...styles.botBubbleStyle,
  };
  // 래퍼는 행 전체 기준 (퍼센트 기준이 행 기준이 되도록)
  const stackStyle: CSSProperties = { width: "100%" };

  const botBubbleEntryStyle = settings.botBubble?.animate ? "rcb-bot-message-entry" : "";
  const showAvatar = settings.botBubble?.showAvatar && isNewSender;
  const offsetStyle = `rcb-bot-message${
    !isNewSender && settings.botBubble?.showAvatar ? " rcb-bot-message-offset" : ""
  }`;
  const outsideButtonsOffset =
    !isNewSender && settings.botBubble?.showAvatar ? " rcb-link-buttons-outside--offset" : "";

  const handleOptionClick = (value: string) => {
    const input = document.querySelector<HTMLInputElement>(".rcb-input-area input");
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
    document.querySelector<HTMLButtonElement>(".rcb-send-icon")?.click();
  };

  return (
    <div className="rcb-bot-message-container">
      {showAvatar && (
        <div
          style={{ backgroundImage: `url("${settings.botBubble?.avatar}")` }}
          className="rcb-message-bot-avatar"
        />
      )}

      {/* 래퍼: 행 전체 기준 */}
      <div className="rcb-bot-stack" style={stackStyle}>
        {/* 말풍선 */}
        <div style={botBubbleStyle} className={`${offsetStyle} ${botBubbleEntryStyle}`}>
          <ContentWrapper>
            <div
              ref={htmlRef}
              className="message-content"
              onClickCapture={handleLinkOpenInNewTabCapture}
              {...(isStringContent
                ? {
                    dangerouslySetInnerHTML: {
                      __html: DOMPurify.sanitize(String(message.content ?? "")),
                    },
                  }
                : {})}
            >
              {!isStringContent ? baseContent : null}
            </div>
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

        {/* ① message.buttons 로 들어온 경우도 바깥에 렌더 */}
        {Array.isArray(message.buttons) && message.buttons.length > 0 && (
          <div
            className={`rcb-link-buttons rcb-link-buttons-outside${outsideButtonsOffset}`}
            style={{ maxWidth: bubbleMaxPercent }}
            onClickCapture={handleLinkOpenInNewTabCapture}
          >
            {message.buttons.map((btn, i) => (
              <a
                key={i}
                className="rcb-link-button"
                href={btn.url}
                target={btn.target ?? "_blank"}
                rel="noopener noreferrer"
              >
                {btn.label}
              </a>
            ))}
          </div>
        )}

        {/* ② 인사말 콘텐츠 안에서 복제해 온 버튼 표시 */}
        <div
          ref={outsideLinksRef}
          className={`rcb-link-buttons rcb-link-buttons-outside${outsideButtonsOffset}`}
          style={{ display: hasExtractedLinks ? undefined : "none", maxWidth: bubbleMaxPercent }}
          onClickCapture={handleLinkOpenInNewTabCapture}
        />
      </div>
    </div>
  );
};

export default BotMessage;
