import { CSSProperties } from "react";
import { useSettingsContext } from "../../../context/SettingsContext";
import { useStylesContext } from "../../../context/StylesContext";
import { Message } from "../../../types/Message";

import "./UserMessage.css";

/**
 * Renders message from the user.
 */
const UserMessage = ({
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

  const finalContent = message.contentWrapper ? (
    <message.contentWrapper>{baseContent}</message.contentWrapper>
  ) : (
    baseContent
  );

  const userBubbleStyle: CSSProperties = {
    backgroundColor: settings.general?.primaryColor,
    color: "#fff",
    maxWidth: settings.userBubble?.showAvatar ? "65%" : "70%",
    ...styles.userBubbleStyle,
  };
  const userBubbleEntryStyle = settings.userBubble?.animate ? "rcb-user-message-entry" : "";

  const showAvatar = settings.userBubble?.showAvatar && isNewSender;
  const offsetStyle = `rcb-user-message${
    !isNewSender && settings.userBubble?.showAvatar ? " rcb-user-message-offset" : ""
  }`;

  return (
    <div className="rcb-user-message-container">
      {isStringContent ? (
        <div
          style={userBubbleStyle}
          className={`${offsetStyle} ${userBubbleEntryStyle}`}
          dir="auto"
          role="text"
        >
          {finalContent}
        </div>
      ) : (
        <>{finalContent}</>
      )}

      {showAvatar && (
        <div
          style={{ backgroundImage: `url("${settings.userBubble?.avatar}")` }}
          className="rcb-message-user-avatar"
        />
      )}
    </div>
  );
};

export default UserMessage;
