import { createContext, use, useState } from "react";

// Local storage helpers

function setPersistentValue(key: string, value: string) {
  if (window.localStorage) {
    window.localStorage.setItem(key, value);
  }
}

export function getPersistentValue(
  key: string,
  defaultValue: string = "",
): string {
  if (window.localStorage) {
    const value = window.localStorage.getItem(key);
    if (value !== null) {
      return value;
    }
    window.localStorage.setItem(key, defaultValue);
    return defaultValue;
  }
  return defaultValue;
}

// Configs

const keys = {
  snapserver_host: "snapserver.host",
  theme: "theme",
  showoffline: "showoffline",
  appmode: "appmode",
};

export type Theme = "system" | "light" | "dark";

const host = import.meta.env.VITE_APP_SNAPSERVER_HOST || window.location.host;
export const config = {
  get baseUrl() {
    return getPersistentValue(
      keys.snapserver_host,
      (window.location.protocol === "https:" ? "wss://" : "ws://") + host,
    );
  },
  set baseUrl(value) {
    setPersistentValue(keys.snapserver_host, value);
  },
  get theme() {
    return getPersistentValue(keys.theme, "system") as Theme;
  },
  set theme(value: Theme) {
    setPersistentValue(keys.theme, value);
  },
  get showOffline() {
    return getPersistentValue(keys.showoffline, String(false)) === String(true);
  },
  set showOffline(value: boolean) {
    setPersistentValue(keys.showoffline, String(value));
  },
  get appMode() {
    // TODO: change default to group
    return getPersistentValue(keys.appmode, "stream") as "group" | "stream";
  },
  set appMode(value: "group" | "stream") {
    setPersistentValue(keys.showoffline, value);
  },
};

// React context

function setConfigState<Key extends keyof typeof config>(key: Key) {
  const [value, _setValue] = useState(config[key]);

  function setValue(value: (typeof config)[Key]) {
    config[key] = value;
    _setValue(value);
  }

  return [value, setValue] as const;
}

type config = typeof config;
type ContextType = config & {
  [k in keyof config as `set${k}`]: (_: config[k]) => void;
};

const ConfigContext = createContext<ContextType | null>(null);
export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [baseUrl, setbaseUrl] = setConfigState("baseUrl");
  const [theme, settheme] = setConfigState("theme");
  const [showOffline, setshowOffline] = setConfigState("showOffline");
  const [appMode, setappMode] = setConfigState("appMode");

  return (
    <ConfigContext.Provider
      value={{
        baseUrl,
        setbaseUrl,
        theme,
        settheme,
        showOffline,
        setshowOffline,
        appMode,
        setappMode,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig(): ContextType {
  return use(ConfigContext);
}
