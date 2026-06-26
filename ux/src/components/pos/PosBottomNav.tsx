import { NavLink } from "react-router-dom";
import { Store, Package, Wallet, LayoutDashboard, RefreshCw } from "lucide-react";
import { useAuth } from "../../context/AuthContext.js";
import { usePermissions } from "../../hooks/usePermissions.js";

type TabItem = {
  to: string;
  label: string;
  icon: typeof Store;
  end?: boolean;
  badge?: number;
  badgeVariant?: "accent" | "danger";
};

export function PosBottomNav() {
  const { canAccessAdmin } = usePermissions();
  const { pendingSales, failedSales } = useAuth();
  const queueTotal = pendingSales + failedSales;

  const tabs: TabItem[] = [
    { to: "/", label: "Mostrador", icon: Store, end: true },
    { to: "/inventario", label: "Inventario", icon: Package },
    { to: "/caja", label: "Caja", icon: Wallet },
    {
      to: "/sincronizacion",
      label: "Sync",
      icon: RefreshCw,
      badge: queueTotal > 0 ? queueTotal : undefined,
      badgeVariant: failedSales > 0 ? "danger" : "accent",
    },
  ];

  return (
    <nav className="fortino-pos-bottom-nav" aria-label="Navegación del mostrador">
      {tabs.map(({ to, label, icon: Icon, end, badge, badgeVariant }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `fortino-pos-tab${isActive ? " fortino-pos-tab--active" : ""}`
          }
        >
          <span className="fortino-pos-tab-icon">
            <Icon size={22} aria-hidden />
            {badge != null && badge > 0 && (
              <span
                className={`fortino-pos-tab-badge fortino-pos-tab-badge--${badgeVariant ?? "accent"}`}
                aria-label={`${badge} pendiente(s)`}
              >
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </span>
          <span className="fortino-pos-tab-label">{label}</span>
        </NavLink>
      ))}
      {canAccessAdmin && (
        <NavLink
          to="/app"
          className={({ isActive }) =>
            `fortino-pos-tab${isActive ? " fortino-pos-tab--active" : ""}`
          }
        >
          <span className="fortino-pos-tab-icon">
            <LayoutDashboard size={22} aria-hidden />
          </span>
          <span className="fortino-pos-tab-label">Panel</span>
        </NavLink>
      )}
    </nav>
  );
}
