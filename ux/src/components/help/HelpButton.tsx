import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@carbon/react";
import { Help } from "@carbon/icons-react";
import {
  MODULE_WALKTHROUGHS,
  resolveWalkthroughKey,
} from "../../config/walkthroughs.js";
import { ModuleWalkthroughModal } from "./ModuleWalkthroughModal.js";

type Props = {
  size?: "sm" | "md" | "lg";
  kind?: "ghost" | "tertiary" | "secondary";
  className?: string;
};

export function HelpButton({ size = "sm", kind = "ghost", className }: Props) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const walkthroughKey = useMemo(() => resolveWalkthroughKey(pathname), [pathname]);
  const walkthrough = MODULE_WALKTHROUGHS[walkthroughKey];

  if (!walkthrough) return null;

  return (
    <>
      <Button
        kind={kind}
        size={size}
        className={className}
        renderIcon={Help}
        iconDescription="Abrir guía del módulo"
        onClick={() => setOpen(true)}
      >
        Ayuda
      </Button>
      <ModuleWalkthroughModal
        open={open}
        walkthrough={walkthrough}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
