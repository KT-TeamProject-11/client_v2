import { MouseEvent, useEffect, useMemo } from "react";

import ChatBotHeader from "./ChatBotHeader/ChatBotHeader";
import ChatBotBody from "./ChatBotBody/ChatBotBody";
import ChatBotInput from "./ChatBotInput/ChatBotInput";
import ChatBotFooter from "./ChatBotFooter/ChatBotFooter";
import ChatBotButton from "./ChatBotButton/ChatBotButton";
import ChatBotTooltip from "./ChatBotTooltip/ChatBotTooltip";
import ToastContainer from "./ChatBotToast/ToastContainer/ToastContainer";
import { useButtonInternal } from "../hooks/internal/useButtonsInternal";
import { useChatWindowInternal } from "../hooks/internal/useChatWindowInternal";
import { usePathsInternal } from "../hooks/internal/usePathsInternal";
import { useBotEffectsInternal } from "../hooks/internal/useBotEffectsInternal";
import { useIsDesktopInternal } from "../hooks/internal/useIsDesktopInternal";
import { usePluginsInternal } from "../hooks/internal/usePluginsInternal";
import { useBotRefsContext } from "../context/BotRefsContext";
import { useBotStatesContext } from "../context/BotStatesContext";
import { useSettingsContext } from "../context/SettingsContext";
import { useStylesContext } from "../context/StylesContext";
import { Plugin } from "../types/Plugin";
import { Slots } from "../types/Slots";

import "./ChatBotContainer.css";

const ChatBotContainer = ({
  plugins,
  slots,
}: {
  plugins?: Array<Plugin>;
  slots?: Slots;
}) => {
  const isDesktop = useIsDesktopInternal();
  const { settings } = useSettingsContext();
  const { styles } = useStylesContext();
  const { hasFlowStarted, setHasFlowStarted } = useBotStatesContext();
  const { inputRef } = useBotRefsContext();
  const { viewportHeight, viewportWidth, isChatWindowOpen } = useChatWindowInternal();
  const { goToPath } = usePathsInternal();
  const { headerButtons, chatInputButtons, footerButtons } = useButtonInternal();

  useBotEffectsInternal();
  usePluginsInternal(plugins);

  // 최초 로드시 start 실행
  useEffect(() => {
    if (!hasFlowStarted && settings.general?.flowStartTrigger === "ON_LOAD") {
      setHasFlowStarted(true);
      goToPath(settings.general?.startPath || "start");
    }
  }, [hasFlowStarted, settings.general?.flowStartTrigger, settings.general?.startPath]);

  const windowStateClass = useMemo(() => {
    const windowClass = "rcb-chatbot-global ";
    if (settings.general?.embedded) return windowClass + "rcb-window-embedded";
    if (isChatWindowOpen) return windowClass + "rcb-window-open";
    return windowClass + "rcb-window-close";
  }, [settings, isChatWindowOpen]);

  const getChatWindowStyle = () => {
    if (!isDesktop && !settings.general?.embedded) {
      return {
        ...styles.chatWindowStyle,
        borderRadius: "0px",
        left: "0px",
        right: "auto",
        top: "0px",
        bottom: "auto",
        width: `${viewportWidth}px`,
        height: `${viewportHeight}px`,
        zIndex: 10000,
      };
    }
    if (!settings.general?.embedded) {
      return { ...styles.chatWindowStyle, zIndex: 10000 };
    }
    return { ...styles.chatWindowStyle };
  };

  const shouldShowChatBot = () =>
    (isDesktop && settings.device?.desktopEnabled) ||
    (!isDesktop && settings.device?.mobileEnabled);

  return (
    <>
      {shouldShowChatBot() && (
        <div
          onMouseDown={(event: MouseEvent) => {
            if (
              !hasFlowStarted &&
              settings.general?.flowStartTrigger === "ON_CHATBOT_INTERACT"
            ) {
              setHasFlowStarted(true);
              goToPath(settings.general?.startPath || "start");
            }
            isDesktop ? inputRef.current?.blur() : event?.preventDefault();
          }}
          className={windowStateClass}
        >
          {/* 안전망: 가로 스크롤 차단 + 타이포그래피 보정 */}
          <style id="rcb-typography-fix">
            {`
              .rcb-chat-window,
              .rcb-chat-window .rcb-body,
              .rcb-chat-window .rcb-messages { overflow-x: hidden !important; }

              .rcb-chat-window,
              .rcb-chat-window * {
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                box-sizing: border-box;
              }
            `}
          </style>

          <ChatBotTooltip />
          <ChatBotButton />

          {/* Mobile background lock */}
          {isChatWindowOpen && !isDesktop && !settings.general?.embedded && (
            <>
              <style>
                {`
                  html {
                    overflow: hidden !important;
                    touch-action: none !important;
                    scroll-behavior: auto !important;
                  }
                `}
              </style>
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  backgroundColor: "#fff",
                  zIndex: 9999,
                }}
              />
            </>
          )}

          <div style={getChatWindowStyle()} className="rcb-chat-window">
            {(() => {
              const HeaderComponent = slots?.chatBotHeader || ChatBotHeader;
              const BodyComponent = slots?.chatBotBody || ChatBotBody;
              const InputComponent = slots?.chatBotInput || ChatBotInput;
              const FooterComponent = slots?.chatBotFooter || ChatBotFooter;

              return (
                <>
                  {settings.general?.showHeader && <HeaderComponent buttons={headerButtons} />}
                  <BodyComponent />
                  <ToastContainer />
                  {settings.general?.showInputRow && <InputComponent buttons={chatInputButtons} />}
                  {settings.general?.showFooter && <FooterComponent buttons={footerButtons} />}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBotContainer;
