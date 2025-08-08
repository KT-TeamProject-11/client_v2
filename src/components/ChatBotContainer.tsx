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

/**
 * Integrates, loads plugins and contains the various components that makeup the chatbot.
 * 
 * @param plugins plugins to initialize
 * @param slots slots to inject custom headers, footers etc
 */
const ChatBotContainer = ({
	plugins,
	slots,
}: {
	plugins?: Array<Plugin>;
	slots?: Slots;
}) => {
	// handles platform
	const isDesktop = useIsDesktopInternal();

	// handles settings
	const { settings } = useSettingsContext();

	// handles styles
	const { styles } = useStylesContext();

	// handles bot states
	const { hasFlowStarted, setHasFlowStarted } = useBotStatesContext();

	// handles bot refs
	const { inputRef } = useBotRefsContext();

	// handles chat window
	const {
		viewportHeight,
		viewportWidth,
		isChatWindowOpen,
	} = useChatWindowInternal();

	// handles paths
	const { goToPath } = usePathsInternal();

	// buttons to show in header, chat input and footer
	const { headerButtons, chatInputButtons, footerButtons } = useButtonInternal();

	// loads all use effects
	useBotEffectsInternal();

	// loads plugins
	usePluginsInternal(plugins);

	// adds start path when flow is started
	useEffect(() => {
		if (hasFlowStarted || settings.general?.flowStartTrigger === "ON_LOAD") {
			goToPath("start");
		}
	}, [hasFlowStarted, settings.general?.flowStartTrigger]);

	/**
	 * Retrieves class name for window state.
	 */
	const windowStateClass = useMemo(() => {
		const windowClass = "rcb-chatbot-global ";
		if (settings.general?.embedded) {
			return windowClass + "rcb-window-embedded";
		} else if (isChatWindowOpen) {
			return windowClass + "rcb-window-open";
		}
		return windowClass + "rcb-window-close";
	}, [settings, isChatWindowOpen]);

	/**
	 * Retrieves styles for chat window.
	 */
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
			}
		}

		// if not embedded, add z-index
		if (!settings.general?.embedded) {
			return {
				...styles.chatWindowStyle,
				zIndex: 10000,
			};
		}

		return {...styles.chatWindowStyle};
	}

	/**
	 * Checks if chatbot should be shown depending on platform.
	 */
	const shouldShowChatBot = () => {
		return (isDesktop && settings.device?.desktopEnabled)
			|| (!isDesktop && settings.device?.mobileEnabled);
	}

	return (
		<>
			{shouldShowChatBot() &&
				<div 
					onMouseDown={(event: MouseEvent) => {
						// checks if user is interacting with chatbot for the first time
						if (!hasFlowStarted && settings.general?.flowStartTrigger === "ON_CHATBOT_INTERACT") {
							setHasFlowStarted(true);
						}

						// if not on mobile, should remove focus
						isDesktop ? inputRef.current?.blur() : event?.preventDefault();
					}}
					className={windowStateClass}
				>
					<ChatBotTooltip/>
					<ChatBotButton/>
					{/* styles and prevents background from scrolling on mobile when chat window is open */}
					{isChatWindowOpen && !isDesktop && !settings.general?.embedded &&
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
									zIndex: 9999
								}}
							>	
							</div>
						</>
					}
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
			}
		</>
	);
};

export default ChatBotContainer;
