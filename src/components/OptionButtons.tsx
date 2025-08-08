import React from "react";
import "./BotMessage.css"; // 혹은 OptionButtons.css

type Props = {
  onSelect: (text: string) => void;
};

const OptionButtons: React.FC<Props> = ({ onSelect }) => {
  const options = [
    { label: "소개", message: "센터 소개를 알려줘" },
    { label: "오시는 길 & 연락처", message: "오시는 길을 알려줘" },
    { label: "투어 안내", message: "투어 정보를 알려줘" },
    { label: "아카데미 모집", message: "아카데미 모집에 대해 알려줘" },
  ];

  return (
    <div className="rcb-bot-message"> {/* ✅ 챗봇 메시지로 렌더링 */}
      <div className="rcb-message-content">
        <p style={{ marginBottom: "8px" }}>
          안녕하세요!  챗봇입니다.
          <br />
          궁금한 내용을 아래 버튼으로 선택해 주세요.
        </p>
        <div className="rcb-option-buttons">
          {options.map((item) => (
            <button
              key={item.label}
              className="rcb-option-button"
              onClick={() => onSelect(item.message)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OptionButtons;
