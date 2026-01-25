import { useState, useEffect, type ReactNode } from "react";
import { ThemeContext } from "./themeContextValue";

type Theme = "light" | "dark";

const getInitialTheme = (): Theme => {
  if (typeof window !== "undefined" && window.localStorage) {
    const stored = window.localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
  }
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
};

const applyTheme = (theme: Theme) => {
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(theme);
  document.documentElement.style.colorScheme = theme;
  document.documentElement.style.backgroundColor =
    theme === "dark" ? "#111113" : "#fcfcfc";
  localStorage.setItem("theme", theme);
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
