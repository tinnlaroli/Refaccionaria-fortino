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

const STORAGE_KEY = "refaccionaria-theme";

/** Colores de barra del navegador / PWA alineados con tokens Fortino */
const META_THEME: Record<AppTheme, string> = {
  light: "#eef1f5",
  dark: "#121212",
};

type ThemeContextValue = {
  theme: AppTheme;
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

/** Aplica tema claro/oscuro en html para HeroUI y Tailwind */
export function applyTheme(appTheme: AppTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", appTheme === "dark");
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

/** @deprecated Use applyTheme */
export const applyCarbonTheme = applyTheme;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(getInitialTheme);
  const isDark = theme === "dark";

  useEffect(() => {
    applyTheme(theme);
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
    () => ({ theme, isDark, toggle, setTheme }),
    [theme, isDark, toggle, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <div className="fortino-app-root min-h-dvh">{children}</div>
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeContext debe usarse dentro de ThemeProvider");
  return ctx;
}
