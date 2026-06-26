import { Outlet, useLocation } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions.js";
import { ConnectionBanner } from "./ConnectionBanner.js";
import { HelpButton } from "./help/HelpButton.js";
import { PosBottomNav } from "./pos/PosBottomNav.js";
import { PosHeaderAccount } from "./pos/PosHeaderAccount.js";
import { PosShiftStatus } from "./pos/PosShiftStatus.js";
import { PosShiftBanner } from "./pos/PosShiftBanner.js";

export function Layout() {
  const location = useLocation();

  return (
    <div className="fortino-pos-shell" data-bottom-nav="true">
      <div className="fortino-pos-body">
        <div className="fortino-pos-util">
          <PosShiftStatus />
          <div className="fortino-pos-util-actions">
            <HelpButton className="fortino-help-btn" />
            <PosHeaderAccount />
          </div>
        </div>
        <ConnectionBanner />
        <PosShiftBanner />
        <main id="main-content" className="fortino-pos-content" key={location.pathname}>
          <Outlet />
        </main>
      </div>
      <PosBottomNav />
    </div>
  );
}
