import { Button } from "@heroui/react";
import { LogOut } from "lucide-react";
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
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          aria-label="Cerrar sesión"
          onPress={() => logout()}
        >
          <LogOut size={18} />
        </Button>
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
        variant="danger"
        size="sm"
        className="fortino-sidebar-logout w-full"
        onPress={() => logout()}
      >
        <LogOut size={16} />
        <span>Cerrar sesión</span>
      </Button>
    </div>
  );
}
