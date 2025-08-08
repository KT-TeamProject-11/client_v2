import {
  createContext,
  MutableRefObject,
  useContext,
  useEffect,
  useRef,
  useState
} from "react";

import { parseConfig } from "../utils/configParser";
import { BotRefsProvider } from "./BotRefsContext";
import { BotStatesProvider } from "./BotStatesContext";
import { MessagesProvider } from "./MessagesContext";
import { PathsProvider } from "./PathsContext";
import { SettingsProvider } from "./SettingsContext";
import { StylesProvider } from "./StylesContext";
import { ToastsProvider } from "./ToastsContext";
import { Flow } from "../types/Flow";
import { Settings } from "../types/Settings";
import { Styles } from "../types/Styles";
import { Theme } from "../types/Theme";

// 화면 상태 타입
type ViewMode = "welcome" | "chat";

type ChatBotProviderContextType = {
  loadConfig: (
    id: string,
    flow: Flow,
    settings: Settings,
    styles: Styles,
    themes: Theme | Theme[] | undefined,
    styleRootRef: MutableRefObject<HTMLStyleElement | null>
  ) => Promise<void>;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
};

const ChatBotContext = createContext<ChatBotProviderContextType | undefined>(undefined);

export const useChatBotContext = () => {
  const context = useContext(ChatBotContext);
  if (!context) {
    throw new Error("useChatBotContext must be used within ChatBotProvider");
  }
  return context;
};

const ChatBotProvider = ({ children }: { children: React.ReactNode }) => {
  const botIdRef = useRef<string>("");
  const botFlowRef = useRef<Flow>({});
  const [botSettings, setBotSettings] = useState<Settings>({});
  const [botStyles, setBotStyles] = useState<Styles>({});
  const [isDomLoaded, setIsDomLoaded] = useState<boolean>(false);

  const [viewMode, setViewMode] = useState<ViewMode>("welcome");

  useEffect(() => {
    setIsDomLoaded(true);
  }, []);

  const loadConfig = async (
    botId: string,
    flow: Flow,
    settings: Settings,
    styles: Styles,
    themes: Theme | Theme[] | undefined,
    styleRootRef: MutableRefObject<HTMLStyleElement | null>
  ) => {
    botIdRef.current = botId;
    botFlowRef.current = flow;
    const combinedConfig = await parseConfig(botId, settings, styles, themes);

    if (styleRootRef.current) {
      styleRootRef.current.textContent = combinedConfig.cssStylesText;
    }

    setBotSettings(combinedConfig.settings);
    setBotStyles(combinedConfig.inlineStyles);
  };

  if (!isDomLoaded) return null;

  return (
    <div style={{ fontFamily: botSettings.general?.fontFamily }}>
      <ChatBotContext.Provider value={{ loadConfig, viewMode, setViewMode }}>
        <SettingsProvider settings={botSettings} setSettings={setBotSettings}>
          <StylesProvider styles={botStyles} setStyles={setBotStyles}>
            <ToastsProvider>
              <BotRefsProvider botIdRef={botIdRef} flowRef={botFlowRef}>
                <PathsProvider>
                  <BotStatesProvider settings={botSettings}>
                    <MessagesProvider>
                      {children}
                    </MessagesProvider>
                  </BotStatesProvider>
                </PathsProvider>
              </BotRefsProvider>
            </ToastsProvider>
          </StylesProvider>
        </SettingsProvider>
      </ChatBotContext.Provider>
    </div>
  );
};

export { ChatBotProvider };
