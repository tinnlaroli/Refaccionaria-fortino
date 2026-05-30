import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Header,
  HeaderGlobalBar,
  HeaderMenuItem,
  HeaderName,
  HeaderNavigation,
  SkipToContent,
} from "@carbon/react";
import { usePermissions } from "../hooks/usePermissions.js";
import { useMobileLayout } from "../hooks/useMediaQuery.js";
import { ConnectionBanner } from "./ConnectionBanner.js";
import { HelpButton } from "./help/HelpButton.js";
import { PosBottomNav } from "./pos/PosBottomNav.js";
import { PosHeaderAccount } from "./pos/PosHeaderAccount.js";
import { PosShiftStatus } from "./pos/PosShiftStatus.js";
import { PosShiftBanner } from "./pos/PosShiftBanner.js";

export function Layout() {
  const { canAccessAdmin } = usePermissions();
  const location = useLocation();
  const isMobile = useMobileLayout();

  return (
    <div
      className="fortino-pos-shell"
      data-mobile-bottom-nav={isMobile ? "true" : undefined}
    >
      <Header aria-label="Fortino POS" className="fortino-pos-header">
        <SkipToContent />
        <HeaderName prefix="" href="/pos/">
          Fortino POS
        </HeaderName>
        {!isMobile && (
          <HeaderNavigation aria-label="Secciones del mostrador">
            <HeaderMenuItem as={NavLink} to="/" end>
              Mostrador
            </HeaderMenuItem>
            <HeaderMenuItem as={NavLink} to="/inventario">
              Inventario
            </HeaderMenuItem>
            <HeaderMenuItem as={NavLink} to="/caja">
              Caja
            </HeaderMenuItem>
            {canAccessAdmin && (
              <HeaderMenuItem as={NavLink} to="/app">
                Panel
              </HeaderMenuItem>
            )}
          </HeaderNavigation>
        )}
        <HeaderGlobalBar>
          <PosShiftStatus />
          <HelpButton className="fortino-help-btn" />
          <PosHeaderAccount />
        </HeaderGlobalBar>
      </Header>
      <div className="fortino-pos-header-spacer" aria-hidden="true" />
      <div className="fortino-pos-body">
        <ConnectionBanner />
        <PosShiftBanner />
        <main id="main-content" className="fortino-pos-content" key={location.pathname}>
          <Outlet />
        </main>
      </div>
      {isMobile && <PosBottomNav />}
    </div>
  );
}
