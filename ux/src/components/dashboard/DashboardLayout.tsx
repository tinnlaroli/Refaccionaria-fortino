import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Button } from "@heroui/react";
import { Menu } from "lucide-react";
import { useAdminPageMeta } from "../../hooks/useAdminPageMeta.js";
import { useDesktopNav } from "../../hooks/useMediaQuery.js";
import { ConnectionBanner } from "../ConnectionBanner.js";
import { HelpButton } from "../help/HelpButton.js";
import {
  AdminSidebar,
  readSidebarCollapsed,
  writeSidebarCollapsed,
} from "./AdminSidebar.js";

export function DashboardLayout() {
  const pageMeta = useAdminPageMeta();
  const location = useLocation();
  const isDesktop = useDesktopNav();
  const [collapsed, setCollapsed] = useState(readSidebarCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (isDesktop) setMobileOpen(false);
  }, [isDesktop]);

  useEffect(() => {
    if (!isDesktop) return;
    writeSidebarCollapsed(collapsed);
  }, [collapsed, isDesktop]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => !current);
  }, []);

  const toggleMobile = useCallback(() => {
    setMobileOpen((open) => !open);
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
  }, []);

  const isHome = location.pathname === "/app" || location.pathname === "/app/";

  return (
    <div
      className="fortino-admin-shell"
      data-sidebar-collapsed={isDesktop && collapsed ? "true" : "false"}
      data-mobile-nav-open={!isDesktop && mobileOpen ? "true" : "false"}
    >
      {!isDesktop && (
        <Button
          variant="secondary"
          size="sm"
          isIconOnly
          className="fortino-admin-mobile-menu"
          aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={mobileOpen}
          onPress={toggleMobile}
        >
          <Menu size={20} />
        </Button>
      )}

      {!isDesktop && mobileOpen && (
        <button
          type="button"
          className="fortino-sidebar-backdrop"
          aria-label="Cerrar menú"
          onClick={closeMobile}
        />
      )}

      <AdminSidebar
        collapsed={isDesktop && collapsed}
        mobileOpen={!isDesktop && mobileOpen}
        showCollapseToggle={isDesktop}
        onToggleCollapse={toggleCollapsed}
        onNavigate={closeMobile}
      />

      <main id="main-content" className="fortino-admin-main">
        <div className="fortino-admin-inner">
          <ConnectionBanner />
          {!isHome && (
            <header className="fortino-page-header">
              <div className="fortino-page-header-row">
                <div className="fortino-page-header-text">
                  {pageMeta.step && <p className="fortino-page-step">{pageMeta.step}</p>}
                  <h1 className="fortino-page-title">{pageMeta.title}</h1>
                  {pageMeta.description && (
                    <p className="fortino-page-desc">{pageMeta.description}</p>
                  )}
                </div>
                <HelpButton className="fortino-help-btn" showLabel />
              </div>
            </header>
          )}
          <div key={location.pathname} className="fortino-page-body">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
