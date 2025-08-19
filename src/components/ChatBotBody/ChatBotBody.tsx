import { CSSProperties, useEffect } from "react";

import ChatMessagePrompt from "./ChatMessagePrompt/ChatMessagePrompt";
import { useChatWindowInternal } from "../../hooks/internal/useChatWindowInternal";
import { useBotStatesContext } from "../../context/BotStatesContext";
import { useBotRefsContext } from "../../context/BotRefsContext";
import { useMessagesContext } from "../../context/MessagesContext";
import { useSettingsContext } from "../../context/SettingsContext";
import { useStylesContext } from "../../context/StylesContext";
import UserMessage from "./UserMessage/UserMessage";
import BotMessage from "./BotMessage/BotMessage";
import BotTypingIndicator from "./BotTypingIndicator/BotTypingIndicator";

import "./ChatBotBody.css";

/**
 * Contains chat messages between the user and bot.
 */
const ChatBotBody = () => {
  const { settings } = useSettingsContext();
  const { styles } = useStylesContext();
  const { messages } = useMessagesContext();
  const { scrollToBottom } = useChatWindowInternal();
  const { isBotTyping, syncedIsScrollingRef } = useBotStatesContext();
  const { chatBodyRef } = useBotRefsContext();

  const bodyStyle: CSSProperties = {
    ...styles?.bodyStyle,
    scrollbarWidth: settings.chatWindow?.showScrollbar ? "auto" : "none",
  };

  useEffect(() => {
    if (!syncedIsScrollingRef.current) {
      scrollToBottom();
    }
  }, [chatBodyRef.current?.scrollHeight]); // eslint-disable-line

  const isFirstInSeries = (index: number): boolean => {
    if (index === 0) return true;
    return messages[index].sender !== messages[index - 1].sender;
  };

  return (
    <div
      style={bodyStyle}
      className="rcb-chat-body-container"
      ref={chatBodyRef as React.LegacyRef<HTMLDivElement>}
    >
      {messages.map((message, index) => {
        const isNewSender = isFirstInSeries(index);

        if (message.sender.toUpperCase() === "USER") {
          return <UserMessage key={index} message={message} isNewSender={isNewSender} />;
        }

        if (message.sender.toUpperCase() === "BOT") {
          return <BotMessage key={index} message={message} isNewSender={isNewSender} />;
        }

        return <div key={index}>{message.content}</div>;
      })}
      {isBotTyping && settings.chatWindow?.showTypingIndicator && <BotTypingIndicator />}
      <ChatMessagePrompt />
    </div>
  );
};

export default ChatBotBody;
