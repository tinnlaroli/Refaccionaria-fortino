import { Button } from "@carbon/react";
import { Logout } from "@carbon/icons-react";
import { useAuth } from "../../context/AuthContext.js";
import { useMobileLayout } from "../../hooks/useMediaQuery.js";
import { getUserInitials } from "../../lib/userDisplay.js";
import { ThemeSegment } from "../ThemeSegment.js";

export function PosHeaderAccount() {
  const { user, logout } = useAuth();
  const isMobile = useMobileLayout();
  const initials = getUserInitials(user?.fullName ?? "?");

  return (
    <div className="fortino-pos-account-bar">
      <div className="fortino-pos-account-user" title={user?.fullName}>
        <span className="fortino-user-avatar fortino-user-avatar--sm" aria-hidden>
          {initials}
        </span>
        {!isMobile && (
          <span className="fortino-pos-account-name">{user?.fullName}</span>
        )}
      </div>
      <ThemeSegment compact />
      <Button
        kind="ghost"
        size="sm"
        hasIconOnly={isMobile}
        renderIcon={Logout}
        iconDescription="Cerrar sesión"
        className="fortino-pos-logout"
        onClick={() => logout()}
      >
        {isMobile ? undefined : "Salir"}
      </Button>
    </div>
  );
}
