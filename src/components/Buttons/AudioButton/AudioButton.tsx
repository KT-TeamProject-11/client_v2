import { MouseEvent } from "react";

import { useAudioInternal } from "../../../hooks/internal/useAudioInternal";
import { useSettingsContext } from "../../../context/SettingsContext";
import { useStylesContext } from "../../../context/StylesContext";
import { cancelTTS } from "../../../utils/ttsKo"; // ← 추가

import "./AudioButton.css";

/**
 * Handles toggling of the audio feature.
 */
const AudioButton = () => {
  // handles settings
  const { settings } = useSettingsContext();

  // handles styles
  const { styles } = useStylesContext();

  // handles audio
  const { audioToggledOn, toggleAudio } = useAudioInternal();

  // styles for audio icon
  const audioIconStyle: React.CSSProperties = {
    backgroundImage: `url(${settings.audio?.icon})`,
    fill: "#fcec3d",
    ...styles.audioIconStyle
  };

  // styles for audio disabled icon
  const audioIconDisabledStyle: React.CSSProperties = {
    backgroundImage: `url(${settings.audio?.iconDisabled})`,
    fill: "#e8eaed",
    ...styles.audioIconStyle, // by default inherit the base style
    ...styles.audioIconDisabledStyle
  };

  /**
   * Renders button depending on whether an svg component or image url is provided.
   */
  const renderButton = () => {
    const IconComponent = audioToggledOn ? settings.audio?.icon : settings.audio?.iconDisabled;
    if (!IconComponent || typeof IconComponent === "string") {
      return (
        <span
          className="rcb-audio-icon"
          data-testid="rcb-audio-icon"
          style={audioToggledOn ? audioIconStyle : audioIconDisabledStyle}
        />
      )
    }
    return (
      IconComponent &&
      <span className="rcb-audio-icon" data-testid="rcb-audio-icon">
        <IconComponent
          style={audioToggledOn ? audioIconStyle : audioIconDisabledStyle}
          data-testid="rcb-audio-icon-svg"
        />
      </span>
    )
  }

  return (
    <div
      aria-label={settings.ariaLabel?.audioButton ?? "toggle audio"}
      role="button"
      aria-pressed={audioToggledOn}   // ← 접근성 속성 추가
      tabIndex={0}                    // ← 키보드 포커스 가능
      onMouseDown={async (event: MouseEvent) => {
        event.preventDefault();
        if (audioToggledOn) cancelTTS(); //  토글 OFF 직전 즉시 중단
        await toggleAudio();
      }}
      onKeyDown={async (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (audioToggledOn) cancelTTS();
          await toggleAudio();
        }
      }}
      style={audioToggledOn
        ? { ...styles.audioButtonStyle }
        : { ...styles.audioButtonStyle, ...styles.audioButtonDisabledStyle }
      }
    >
      {renderButton()}
    </div>
  );
};

export default AudioButton;
