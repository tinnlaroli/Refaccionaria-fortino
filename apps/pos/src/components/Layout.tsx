import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { ConnectionBanner } from "./ConnectionBanner.js";
import { ThemeToggle } from "./ThemeToggle.js";

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <ConnectionBanner />
      <header className="app-nav">
        <span className="app-title" style={{ marginRight: "auto", fontWeight: 700 }}>
          Fortino POS
        </span>
        <nav style={{ display: "flex", gap: "0.25rem" }}>
          <NavLink to="/" end>
            Mostrador
          </NavLink>
          <NavLink to="/inventario">Inventario</NavLink>
          <NavLink to="/caja">Caja</NavLink>
        </nav>
        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>
          {user?.fullName}
        </span>
        <ThemeToggle />
        <button type="button" className="btn-ghost" onClick={() => logout()}>
          Salir
        </button>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
