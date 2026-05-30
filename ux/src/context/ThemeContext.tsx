import { Theme } from "@carbon/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AppTheme = "light" | "dark";
export type CarbonTheme = "g10" | "g100";

const STORAGE_KEY = "refaccionaria-theme";
const CARBON_THEMES: CarbonTheme[] = ["g10", "g100"];

/** Colores de barra del navegador / PWA alineados con tokens Fortino */
const META_THEME: Record<AppTheme, string> = {
  light: "#eef1f5",
  dark: "#121212",
};

type ThemeContextValue = {
  theme: AppTheme;
  carbonTheme: CarbonTheme;
  isDark: boolean;
  toggle: () => void;
  setTheme: (theme: AppTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): AppTheme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as AppTheme | null;
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* ignore */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function toCarbonTheme(appTheme: AppTheme): CarbonTheme {
  return appTheme === "dark" ? "g100" : "g10";
}

/** Aplica tokens Carbon en html/body para que modales (portal) hereden el tema */
export function applyCarbonTheme(appTheme: AppTheme) {
  const carbon = toCarbonTheme(appTheme);
  const root = document.documentElement;
  const { body } = document;

  for (const t of CARBON_THEMES) {
    root.classList.remove(`cds--${t}`);
    body.classList.remove(`cds--${t}`);
  }

  root.classList.add(`cds--${carbon}`);
  body.classList.add(`cds--${carbon}`);

  root.setAttribute("data-theme", appTheme);
  root.style.colorScheme = appTheme;

  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", META_THEME[appTheme]);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(getInitialTheme);
  const carbonTheme = toCarbonTheme(theme);
  const isDark = theme === "dark";

  useEffect(() => {
    applyCarbonTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const setTheme = useCallback((next: AppTheme) => setThemeState(next), []);
  const toggle = useCallback(
    () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
    [],
  );

  const value = useMemo(
    () => ({ theme, carbonTheme, isDark, toggle, setTheme }),
    [theme, carbonTheme, isDark, toggle, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <Theme theme={carbonTheme} className="fortino-app-root">
        {children}
      </Theme>
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeContext debe usarse dentro de ThemeProvider");
  return ctx;
}
