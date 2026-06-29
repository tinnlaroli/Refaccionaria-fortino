import { SITE } from "../config/site";
import { ThemeToggle } from "./ThemeToggle";

type Props = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
};

export function Header({ theme, onToggleTheme }: Props) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <a href="/" className="brand">
          <span className="brand-mark">F</span>
          <span className="brand-text">{SITE.name}</span>
        </a>
        <div className="header-actions">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <a href={SITE.posUrl} className="btn btn-primary btn-sm">
            Punto de venta
          </a>
        </div>
      </div>
    </header>
  );
}
