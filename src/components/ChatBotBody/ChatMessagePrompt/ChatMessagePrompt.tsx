import { useState, MouseEvent } from "react";

import { useBotRefsContext } from "../../../context/BotRefsContext";
import { useBotStatesContext } from "../../../context/BotStatesContext";
import { useSettingsContext } from "../../../context/SettingsContext";
import { useStylesContext } from "../../../context/StylesContext";
import { useChatWindowInternal } from "../../../hooks/internal/useChatWindowInternal";

import "./ChatMessagePrompt.css";

/**
 * Provides scroll to bottom option for users when there are unread messages.
 */
const ChatMessagePrompt = () => {
  const { settings } = useSettingsContext();
  const { styles } = useStylesContext();
  const { unreadCount, isScrolling } = useBotStatesContext();
  const { chatBodyRef } = useBotRefsContext();
  const { scrollToBottom } = useChatWindowInternal();

  const [isHovered, setIsHovered] = useState<boolean>(false);

  const chatMessagePromptHoveredStyle: React.CSSProperties = {
    color: settings.general?.primaryColor,
    borderColor: settings.general?.primaryColor,
    ...styles.chatMessagePromptHoveredStyle
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const getMessagePromptVisibility = () => {
    const shouldShowPrompt =
      chatBodyRef.current &&
      settings.chatWindow?.showMessagePrompt &&
      isScrolling &&
      unreadCount > 0;
    return shouldShowPrompt ? "visible" : "hidden";
  };

  return (
    <div className={`rcb-message-prompt-container ${getMessagePromptVisibility()}`}>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={isHovered ? chatMessagePromptHoveredStyle : { ...styles.chatMessagePromptStyle }}
        onMouseDown={(event: MouseEvent) => {
          event.preventDefault();
          scrollToBottom(600);
        }}
        className="rcb-message-prompt-text"
      >
        {settings.chatWindow?.messagePromptText}
      </div>
    </div>
  );
};

export default ChatMessagePrompt;
