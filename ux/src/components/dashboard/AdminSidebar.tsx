import { NavLink, useLocation } from "react-router-dom";
import { IconButton } from "@carbon/react";
import { ChevronLeft, ChevronRight, Store } from "@carbon/icons-react";
import { NAV_GROUPS, type AdminModule } from "../../config/modules.js";
import { usePermissions } from "../../hooks/usePermissions.js";
import { carbonNavIcon } from "../carbon/CarbonNavIcons.js";
import { SidebarAccount } from "./SidebarAccount.js";

const SIDEBAR_KEY = "fortino-sidebar-collapsed";

export function readSidebarCollapsed() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeSidebarCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0");
  } catch {
    /* ignore */
  }
}

function isModuleActive(pathname: string, path: string) {
  if (path === "/app") return pathname === "/app" || pathname === "/app/";
  return pathname === path || pathname.startsWith(`${path}/`);
}

type AdminSidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  showCollapseToggle: boolean;
  onToggleCollapse: () => void;
  onNavigate: () => void;
};

function NavItem({
  mod,
  collapsed,
  onNavigate,
}: {
  mod: AdminModule;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const Icon = carbonNavIcon(mod.icon);
  const location = useLocation();
  const active = isModuleActive(location.pathname, mod.path);

  return (
    <NavLink
      to={mod.path}
      end={mod.path === "/app"}
      title={collapsed ? mod.label : undefined}
      className={`fortino-nav-item${active ? " fortino-nav-item--active" : ""}`}
      onClick={onNavigate}
    >
      <span className="fortino-nav-item__icon" aria-hidden>
        <Icon size={20} />
      </span>
      <span className="fortino-nav-item__label">{mod.label}</span>
    </NavLink>
  );
}

export function AdminSidebar({
  collapsed,
  mobileOpen,
  showCollapseToggle,
  onToggleCollapse,
  onNavigate,
}: AdminSidebarProps) {
  const { hasPermission, hasAnyPermission } = usePermissions();
  const location = useLocation();

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((mod) => {
      if (!mod.permission) return true;
      const keys = Array.isArray(mod.permission) ? mod.permission : [mod.permission];
      return keys.length === 1 ? hasPermission(keys[0]) : hasAnyPermission(...keys);
    }),
  })).filter((g) => g.items.length > 0);

  const posActive = location.pathname === "/" || location.pathname === "/pos";

  return (
    <aside
      className={`fortino-sidebar${collapsed ? " fortino-sidebar--collapsed" : ""}${
        mobileOpen ? " fortino-sidebar--mobile-open" : ""
      }`}
      aria-label="Navegación administrativa"
    >
      <div className="fortino-sidebar__head">
        {!collapsed && <p className="fortino-sidebar__title">Administración</p>}
        {showCollapseToggle && (
          <IconButton
            kind="ghost"
            size="sm"
            align="right"
            label={collapsed ? "Expandir menú" : "Contraer menú"}
            onClick={onToggleCollapse}
            className="fortino-sidebar__toggle"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </IconButton>
        )}
      </div>

      <nav className="fortino-sidebar__nav">
        {visibleGroups.map((group) => (
          <div key={group.id} className="fortino-nav-group">
            {!collapsed && group.items.length > 1 && (
              <p className="fortino-nav-group__label">{group.label}</p>
            )}
            {group.items.map((mod) => (
              <NavItem
                key={mod.path}
                mod={mod}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ))}

        <div className="fortino-nav-group fortino-nav-group--footer">
          <NavLink
            to="/"
            title={collapsed ? "Ir al mostrador" : undefined}
            className={`fortino-nav-item${posActive ? " fortino-nav-item--active" : ""}`}
            onClick={onNavigate}
          >
            <span className="fortino-nav-item__icon" aria-hidden>
              <Store size={20} />
            </span>
            <span className="fortino-nav-item__label">Ir al mostrador</span>
          </NavLink>
        </div>
      </nav>

      <div className="fortino-sidebar__foot">
        <SidebarAccount collapsed={collapsed} />
      </div>
    </aside>
  );
}
