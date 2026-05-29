import { NavLink } from "react-router-dom";
import { SITE } from "../config/site";
import { ThemeToggle } from "./ThemeToggle";

type Props = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
};

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? "nav-link active" : "nav-link";

export function Header({ theme, onToggleTheme }: Props) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <NavLink to="/" className="brand" end>
          <span className="brand-mark">F</span>
          <span className="brand-text">{SITE.name}</span>
        </NavLink>
        <nav className="main-nav" aria-label="Principal">
          <NavLink to="/" className={navClass} end>
            Inicio
          </NavLink>
          <NavLink to="/catalogo" className={navClass}>
            Catálogo
          </NavLink>
          <NavLink to="/contacto" className={navClass}>
            Contacto
          </NavLink>
        </nav>
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
