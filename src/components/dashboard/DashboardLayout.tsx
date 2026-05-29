import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { NAV_GROUPS } from "../../config/modules.js";
import { useAuth } from "../../context/AuthContext.js";
import { useAdminPageMeta } from "../../hooks/useAdminPageMeta.js";
import { usePermissions } from "../../hooks/usePermissions.js";
import { ConnectionBanner } from "../ConnectionBanner.js";
import { ThemeToggle } from "../ThemeToggle.js";
import { NavIcon } from "./NavIcon.js";

const SIDEBAR_KEY = "fortino-sidebar-collapsed";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function readCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === "1";
  } catch {
    return false;
  }
}

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { hasPermission, hasAnyPermission } = usePermissions();
  const pageMeta = useAdminPageMeta();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((mod) => {
      if (!mod.permission) return true;
      const keys = Array.isArray(mod.permission) ? mod.permission : [mod.permission];
      return keys.length === 1
        ? hasPermission(keys[0])
        : hasAnyPermission(...keys);
    }),
  })).filter((g) => g.items.length > 0);

  const closeMobile = () => setMobileOpen(false);
  const toggleCollapsed = () => setCollapsed((c) => !c);

  return (
    <div
      className={[
        "dashboard-shell",
        collapsed ? "sidebar-collapsed" : "",
        mobileOpen ? "sidebar-open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <ConnectionBanner />
      {mobileOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Cerrar menú"
          onClick={closeMobile}
        />
      )}

      <aside className="dashboard-sidebar">
        <div className="sidebar-top">
          <div className="dashboard-brand">
            <div className="brand-mark">F</div>
            <div className="sidebar-expandable dashboard-brand-text">
              <strong>Fortino</strong>
              <span>Panel administrativo</span>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
            title={collapsed ? "Expandir menú" : "Contraer menú"}
          >
            <NavIcon
              name="chevron-left"
              size={18}
              className={collapsed ? "collapse-icon-flip" : ""}
            />
          </button>
        </div>

        <nav className="dashboard-nav" aria-label="Navegación principal">
          {visibleGroups.map((group) => (
            <div key={group.id} className="nav-group" data-tone={group.tone}>
              <span className="nav-group-label sidebar-expandable">{group.label}</span>
              {group.items.map((mod) => (
                <NavLink
                  key={mod.path}
                  to={mod.path}
                  end={mod.path === "/app"}
                  className="dashboard-nav-link"
                  data-tone={group.tone}
                  title={collapsed ? mod.label : undefined}
                  onClick={closeMobile}
                >
                  <span className="nav-icon-wrap">
                    <NavIcon name={mod.icon} className="nav-link-icon" size={20} />
                  </span>
                  <span className="nav-link-text sidebar-expandable">
                    <span>{mod.label}</span>
                    <small>{mod.description}</small>
                  </span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <NavLink
            to="/"
            className="btn-pos-shortcut"
            title={collapsed ? "Ir al mostrador" : undefined}
            onClick={closeMobile}
          >
            <NavIcon name="pos" size={18} />
            <span className="sidebar-expandable btn-pos-label">Ir al mostrador</span>
          </NavLink>
          <div className="sidebar-user" title={collapsed ? user?.fullName : undefined}>
            <span className="user-avatar" aria-hidden>
              {initials(user?.fullName ?? "U")}
            </span>
            <div className="user-meta sidebar-expandable">
              <strong>{user?.fullName}</strong>
              <span>{user?.role}</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-header">
          <div className="dashboard-header-start">
            <button
              type="button"
              className="btn-icon sidebar-toggle"
              aria-label="Abrir menú"
              onClick={() => setMobileOpen(true)}
            >
              <span className="menu-bars" />
            </button>
            <button
              type="button"
              className="btn-icon sidebar-collapse-header"
              aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
              onClick={toggleCollapsed}
            >
              <NavIcon
                name="chevron-left"
                size={18}
                className={collapsed ? "collapse-icon-flip" : ""}
              />
            </button>
            <div>
              {pageMeta.step && (
                <span className="header-step">{pageMeta.step}</span>
              )}
              <h1 className="dashboard-heading">{pageMeta.title}</h1>
              <p className="dashboard-subheading">{pageMeta.description}</p>
            </div>
          </div>
          <div className="dashboard-header-actions">
            <ThemeToggle />
            <button type="button" className="btn-ghost" onClick={() => logout()}>
              Salir
            </button>
          </div>
        </header>

        <div className="dashboard-content" key={location.pathname}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
