import { Button, IconButton } from "@carbon/react";
import { Logout } from "@carbon/icons-react";
import { useAuth } from "../../context/AuthContext.js";
import { usePermissions } from "../../hooks/usePermissions.js";
import { getUserInitials } from "../../lib/userDisplay.js";
import { ThemeSegment } from "../ThemeSegment.js";

type Props = {
  collapsed: boolean;
};

export function SidebarAccount({ collapsed }: Props) {
  const { user, logout } = useAuth();
  const { roleLabel } = usePermissions();
  const initials = getUserInitials(user?.fullName ?? "?");
  const name = user?.fullName ?? "Usuario";

  if (collapsed) {
    return (
      <div className="fortino-sidebar-account fortino-sidebar-account--collapsed">
        <span className="fortino-user-avatar" title={name} aria-hidden>
          {initials}
        </span>
        <ThemeSegment compact />
        <IconButton
          kind="ghost"
          size="md"
          label="Cerrar sesión"
          onClick={() => logout()}
        >
          <Logout size={18} />
        </IconButton>
      </div>
    );
  }

  return (
    <div className="fortino-sidebar-account">
      <div className="fortino-sidebar-account__user">
        <span className="fortino-user-avatar fortino-user-avatar--lg" aria-hidden>
          {initials}
        </span>
        <div className="fortino-sidebar-account__meta">
          <strong className="fortino-sidebar-account__name">{name}</strong>
          <span className="fortino-sidebar-account__role">{roleLabel}</span>
        </div>
      </div>

      <ThemeSegment />

      <Button
        kind="danger--ghost"
        size="sm"
        renderIcon={Logout}
        className="fortino-sidebar-logout"
        onClick={() => logout()}
      >
        Cerrar sesión
      </Button>
    </div>
  );
}
