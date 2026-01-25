import { IconButton } from "@radix-ui/themes";
import { SunIcon, MoonIcon } from "@radix-ui/react-icons";
import { useTheme } from "../hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <IconButton
      variant="ghost"
      size="2"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? <MoonIcon /> : <SunIcon />}
    </IconButton>
  );
}
