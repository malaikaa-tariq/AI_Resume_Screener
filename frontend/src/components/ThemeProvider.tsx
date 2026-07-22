"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export const themeOptions = [
  {
    id: "peach-light",
    label: "Light Peach",
    swatch: "#ef7c68",
  },
  {
    id: "beige-light",
    label: "Light Beige",
    swatch: "#b77c52",
  },
  {
    id: "rose-light",
    label: "Light Rose",
    swatch: "#d96d87",
  },
  {
    id: "violet-light",
    label: "Light Violet",
    swatch: "#8064d8",
  },
  {
    id: "blue-light",
    label: "Light Blue",
    swatch: "#3f85d5",
  },
  {
    id: "green-light",
    label: "Light Green",
    swatch: "#2d9f77",
  },
  {
    id: "night",
    label: "Night Mode",
    swatch: "#f3a28f",
  },
] as const;

export type ThemeId =
  (typeof themeOptions)[number]["id"];

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
};

const ThemeContext =
  createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "career-canvas-theme";

const LEGACY_THEME_MAP: Record<string, ThemeId> = {
  "peach-dark": "rose-light",
  "violet-dark": "violet-light",
  "blue-dark": "blue-light",
  "green-dark": "green-light",
};

function isTheme(
  value: string | null,
): value is ThemeId {
  return themeOptions.some(
    (option) => option.id === value,
  );
}

function resolveTheme(
  value: string | null,
): ThemeId {
  if (isTheme(value)) {
    return value;
  }

  if (value && LEGACY_THEME_MAP[value]) {
    return LEGACY_THEME_MAP[value];
  }

  return "peach-light";
}

export default function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [theme, setThemeState] =
    useState<ThemeId>("peach-light");

  useEffect(() => {
    const saved =
      window.localStorage.getItem(STORAGE_KEY);
    const resolved = resolveTheme(saved);

    setThemeState(resolved);
    document.documentElement.dataset.theme =
      resolved;
    window.localStorage.setItem(
      STORAGE_KEY,
      resolved,
    );
  }, []);

  function setTheme(nextTheme: ThemeId) {
    setThemeState(nextTheme);
    document.documentElement.dataset.theme =
      nextTheme;
    window.localStorage.setItem(
      STORAGE_KEY,
      nextTheme,
    );
  }

  const value = useMemo(
    () => ({ theme, setTheme }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error(
      "useTheme must be used inside ThemeProvider.",
    );
  }

  return value;
}
