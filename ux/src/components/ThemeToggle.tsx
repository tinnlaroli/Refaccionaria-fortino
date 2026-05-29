import { useTheme } from "../hooks/useTheme.js";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      className="btn-ghost"
      onClick={toggle}
      title={theme === "dark" ? "Modo claro" : "Modo oscuro"}
      aria-label="Cambiar tema"
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
