import { useChatWindowInternal } from "../../hooks/internal/useChatWindowInternal";
import { useBotStatesContext } from "../../context/BotStatesContext";
import { useSettingsContext } from "../../context/SettingsContext";
import { useStylesContext } from "../../context/StylesContext";

import "./ChatBotButton.css";

/**
 * Toggles opening and closing of the chat window when general.embedded is false.
 */
const ChatBotButton = () => {
  // ✅ 디버그 토글: true면 배지를 무조건 보여줌(표시 여부 문제 확인용)
  const FORCE_BADGE_DEBUG = true;

  // handles settings
  const { settings } = useSettingsContext();

  // handles styles
  const { styles } = useStylesContext();

  // handles bot states
  const { unreadCount, hasFlowStarted } = useBotStatesContext();

  // handles chat window
  const { isChatWindowOpen, toggleChatWindow } = useChatWindowInternal();

  // styles for chat button
  const chatButtonStyle: React.CSSProperties = {
    backgroundImage: `linear-gradient(to right, ${settings.general?.secondaryColor},
      ${settings.general?.primaryColor})`,
    ...styles.chatButtonStyle
  };

  // styles for chat icon
  const chatIconStyle: React.CSSProperties = {
    backgroundImage: `url(${settings.chatButton?.icon})`,
    fill: "#fff",
    width: 75,
    height: 75,
    ...styles.chatIconStyle
  };

  /**
   * Renders button depending on whether an svg component or image url is provided.
   */
  const renderButton = () => {
    const IconComponent = settings.chatButton?.icon;
    if (!IconComponent || typeof IconComponent === "string") {
      return (
        <span
          className="rcb-toggle-icon"
          style={chatIconStyle}
        />
      )
    }
    return (
      IconComponent &&
      <span className="rcb-toggle-icon">
        <IconComponent style={chatIconStyle}/>
      </span>
    )
  }

  // 원래 배지 표시 조건
  const showBadge =
    !settings.notification?.disabled &&
    settings.notification?.showCount &&
    unreadCount > 0;
	console.log("[Badge] show?", { unreadCount /*, hasFlowStarted*/ });


	return (
  <>
    {!settings.general?.embedded &&
      <div
        aria-label={settings.ariaLabel?.chatButton ?? "open chat"}
        role="button"
        style={chatButtonStyle}
        className={`rcb-toggle-button ${isChatWindowOpen ? "rcb-button-hide" : "rcb-button-show"}`}
        onClick={() => toggleChatWindow(true)}
      >
        {renderButton()}
        {showBadge && (
          <span style={{ ...styles.notificationBadgeStyle }} className="rcb-badge">
            {unreadCount}
          </span>
        )}
      </div>
    }
  </>
);

  // 🔎 디버그 로그
  console.log("[BadgeDebug]", {
    unreadCount,
    hasFlowStarted,
    isChatWindowOpen,
    disabled: settings.notification?.disabled,
    showCount: settings.notification?.showCount,
  });

  return (
    <>
      {!settings.general?.embedded &&
        <div
          aria-label={settings.ariaLabel?.chatButton ?? "open chat"}
          role="button"
          style={chatButtonStyle}
          className={`rcb-toggle-button ${isChatWindowOpen ? "rcb-button-hide" : "rcb-button-show"}`}
          onClick={() => toggleChatWindow(true)}
        >
          {renderButton()}

          {/* ✅ 디버그: 무조건 배지 보이기 */}
          {FORCE_BADGE_DEBUG ? (
            <span
              className="rcb-badge"
              title="DEBUG badge"
              style={{
                position: "absolute",
                right: -6,
                top: -6,
                minWidth: 20,
                height: 20,
                borderRadius: 999,
                padding: "0 6px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                background: "red",
                color: "#fff",
                zIndex: 9999,
                ...styles.notificationBadgeStyle, // 여기 스타일에 display:none 등이 있는지 확인!
              }}
            >
              {unreadCount}
            </span>
          ) : (
            // ⬇️ 원래 조건으로만 보여주기
            showBadge && (
              <span style={{ ...styles.notificationBadgeStyle }} className="rcb-badge">
                {unreadCount}
              </span>
            )
          )}
        </div>
      }
    </>
  );
};

export default ChatBotButton;
