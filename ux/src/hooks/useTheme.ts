import { useThemeContext } from "../context/ThemeContext.js";

/** @deprecated Prefer useThemeContext from ThemeContext */
export function useTheme() {
  return useThemeContext();
}
