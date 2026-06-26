import { Button } from "@heroui/react";
import { LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext.js";
import { useMobileLayout } from "../../hooks/useMediaQuery.js";
import { getUserInitials } from "../../lib/userDisplay.js";
import { ThemeSegment } from "../ThemeSegment.js";

export function PosHeaderAccount() {
  const { user, logout } = useAuth();
  const isMobile = useMobileLayout();
  const initials = getUserInitials(user?.fullName ?? "?");

  return (
    <div className="fortino-pos-account-bar flex items-center gap-2">
      <div className="fortino-pos-account-user flex items-center gap-2" title={user?.fullName}>
        <span className="fortino-user-avatar fortino-user-avatar--sm size-7 text-[0.65rem]" aria-hidden>
          {initials}
        </span>
        {!isMobile && (
          <span className="fortino-pos-account-name max-w-[8rem] truncate text-sm">{user?.fullName}</span>
        )}
      </div>
      <ThemeSegment compact />
      <Button
        variant="ghost"
        size="sm"
        isIconOnly={isMobile}
        aria-label="Cerrar sesión"
        className="fortino-pos-logout"
        onPress={() => logout()}
      >
        <LogOut size={16} />
        {!isMobile && <span>Salir</span>}
      </Button>
    </div>
  );
}
