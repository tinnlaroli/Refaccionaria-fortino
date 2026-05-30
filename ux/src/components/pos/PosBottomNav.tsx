import { NavLink } from "react-router-dom";
import { Store, InventoryManagement, Wallet, Dashboard } from "@carbon/icons-react";
import { usePermissions } from "../../hooks/usePermissions.js";

type TabItem = {
  to: string;
  label: string;
  icon: typeof Store;
  end?: boolean;
};

const TABS: TabItem[] = [
  { to: "/", label: "Mostrador", icon: Store, end: true },
  { to: "/inventario", label: "Inventario", icon: InventoryManagement },
  { to: "/caja", label: "Caja", icon: Wallet },
];

export function PosBottomNav() {
  const { canAccessAdmin } = usePermissions();

  return (
    <nav className="fortino-pos-bottom-nav" aria-label="Navegación del mostrador">
      {TABS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `fortino-pos-tab${isActive ? " fortino-pos-tab--active" : ""}`
          }
        >
          <Icon size={22} aria-hidden />
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
          <Dashboard size={22} aria-hidden />
          <span className="fortino-pos-tab-label">Panel</span>
        </NavLink>
      )}
    </nav>
  );
}
