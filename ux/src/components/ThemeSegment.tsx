import { Moon, Sun } from "lucide-react";
import { useThemeContext, type AppTheme } from "../context/ThemeContext.js";

type Props = {
  compact?: boolean;
};

export function ThemeSegment({ compact }: Props) {
  const { theme, setTheme } = useThemeContext();

  const select = (next: AppTheme) => setTheme(next);

  return (
    <div className="fortino-theme-segment" role="group" aria-label="Apariencia">
      {!compact && <span className="fortino-theme-segment__label">Apariencia</span>}
      <div className="fortino-theme-segment__buttons">
        <button
          type="button"
          className={`fortino-theme-segment__btn${theme === "light" ? " fortino-theme-segment__btn--active" : ""}`}
          aria-pressed={theme === "light"}
          aria-label="Modo claro"
          title="Modo claro"
          onClick={() => select("light")}
        >
          <Sun size={compact ? 18 : 16} aria-hidden />
          {!compact && <span>Claro</span>}
        </button>
        <button
          type="button"
          className={`fortino-theme-segment__btn${theme === "dark" ? " fortino-theme-segment__btn--active" : ""}`}
          aria-pressed={theme === "dark"}
          aria-label="Modo oscuro"
          title="Modo oscuro"
          onClick={() => select("dark")}
        >
          <Moon size={compact ? 18 : 16} aria-hidden />
          {!compact && <span>Oscuro</span>}
        </button>
      </div>
    </div>
  );
}
