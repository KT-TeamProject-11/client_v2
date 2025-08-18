import React, { useRef } from "react";
import { useAudioInternal } from "../../../hooks/internal/useAudioInternal";
import { useSettingsContext } from "../../../context/SettingsContext";
import { useStylesContext } from "../../../context/StylesContext";
import { cancelTTS } from "../../../utils/ttsKo";
import "./AudioButton.css";

const AudioButton: React.FC = () => {
  const { settings } = useSettingsContext();
  const { styles } = useStylesContext();
  const { audioToggledOn, toggleAudio } = useAudioInternal();
  const busyRef = useRef(false);

  const audioIconStyle: React.CSSProperties = {
    backgroundImage: `url(${settings.audio?.icon})`,
    fill: "#fcec3d",
    ...styles.audioIconStyle,
  };

  const audioIconDisabledStyle: React.CSSProperties = {
    backgroundImage: `url(${settings.audio?.iconDisabled})`,
    fill: "#e8eaed",
    ...styles.audioIconStyle,
    ...styles.audioIconDisabledStyle,
  };

  const handleToggle = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      if (audioToggledOn) cancelTTS();
      await toggleAudio();
    } finally {
      busyRef.current = false;
    }
  };

  const renderButton = () => {
    const IconComponent = audioToggledOn ? settings.audio?.icon : settings.audio?.iconDisabled;
    if (!IconComponent || typeof IconComponent === "string") {
      return (
        <span
          className="rcb-audio-icon"
          data-testid="rcb-audio-icon"
          style={audioToggledOn ? audioIconStyle : audioIconDisabledStyle}
        />
      );
    }
    return (
      <span className="rcb-audio-icon" data-testid="rcb-audio-icon">
        <IconComponent
          style={audioToggledOn ? audioIconStyle : audioIconDisabledStyle}
          data-testid="rcb-audio-icon-svg"
        />
      </span>
    );
  };

  return (
    <div
      aria-label={settings.ariaLabel?.audioButton ?? "toggle audio"}
      role="button"
      aria-pressed={audioToggledOn}
      tabIndex={0}
      onPointerDown={async (e) => {
        e.preventDefault();
        await handleToggle();
      }}
      onKeyDown={async (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          await handleToggle();
        }
      }}
      style={
        audioToggledOn
          ? { ...styles.audioButtonStyle }
          : { ...styles.audioButtonStyle, ...styles.audioButtonDisabledStyle }
      }
      data-testid="rcb-audio-button"
    >
      {renderButton()}
    </div>
  );
};

export default AudioButton;
