import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { ModuleWalkthroughModal } from "../components/help/ModuleWalkthroughModal.js";
import { shouldAutoShowHelp } from "../lib/helpStorage.js";
import { getWalkthrough, type ModuleWalkthrough } from "../config/walkthroughs.js";

const AUTO_SHOW_DELAY_MS = 500;
const AUTO_SHOW_ROUTES = new Set(["/login"]);

type HelpContextValue = {
  walkthrough: ModuleWalkthrough;
  open: boolean;
  openHelp: () => void;
  closeHelp: () => void;
};

const HelpContext = createContext<HelpContextValue | null>(null);

export function HelpProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const walkthrough = useMemo(() => getWalkthrough(pathname), [pathname]);

  const closeHelp = useCallback(() => setOpen(false), []);
  const openHelp = useCallback(() => setOpen(true), []);

  useEffect(() => {
    setOpen(false);
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }

    if (AUTO_SHOW_ROUTES.has(pathname)) return;
    if (!shouldAutoShowHelp(walkthrough.id)) return;

    autoTimerRef.current = setTimeout(() => {
      setOpen(true);
      autoTimerRef.current = null;
    }, AUTO_SHOW_DELAY_MS);

    return () => {
      if (autoTimerRef.current) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
    };
  }, [pathname, walkthrough.id]);

  const value = useMemo(
    () => ({ walkthrough, open, openHelp, closeHelp }),
    [walkthrough, open, openHelp, closeHelp],
  );

  return (
    <HelpContext.Provider value={value}>
      {children}
      <ModuleWalkthroughModal open={open} walkthrough={walkthrough} onClose={closeHelp} />
    </HelpContext.Provider>
  );
}

export function useHelp() {
  const ctx = useContext(HelpContext);
  if (!ctx) {
    throw new Error("useHelp debe usarse dentro de HelpProvider");
  }
  return ctx;
}
