import { useState } from "react";

const host = import.meta.env.VITE_APP_SNAPSERVER_HOST || window.location.host;

const keys = {
  snapserver_host: "snapserver.host",
  theme: "theme",
  showoffline: "showoffline",
};

enum Theme {
  System = "system",
  Light = "light",
  Dark = "dark",
}

function setPersistentValue(key: string, value: string) {
  if (window.localStorage) {
    window.localStorage.setItem(key, value);
  }
}

function getPersistentValue(key: string, defaultValue: string = ""): string {
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

const config = {
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
    return getPersistentValue(keys.theme, Theme.System.toString()) as Theme;
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
};

export function useConfig<Key extends keyof typeof config>(key: Key) {
  const [value, _setValue] = useState(config[key]);

  function setValue(value: (typeof config)[Key]) {
    config[key] = value;
    _setValue(value);
  }

  return [value, setValue] as const;
}

export { config, getPersistentValue, setPersistentValue, Theme };
