import { Button } from "@heroui/react";
import { HelpCircle } from "lucide-react";
import { useHelp } from "../../context/HelpContext.js";

type Props = {
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "secondary" | "tertiary";
  className?: string;
  /** Etiqueta visible junto al icono */
  showLabel?: boolean;
};

export function HelpButton({
  size = "sm",
  variant = "secondary",
  className,
  showLabel = true,
}: Props) {
  const { walkthrough, openHelp } = useHelp();

  return (
    <Button
      variant={variant}
      size={size}
      className={`fortino-help-btn ${className ?? ""}`.trim()}
      aria-label={`Abrir guía: ${walkthrough.title}`}
      title={`Ayuda: ${walkthrough.title}`}
      onPress={openHelp}
    >
      <HelpCircle size={size === "lg" ? 20 : 16} aria-hidden />
      {showLabel && <span>Ayuda</span>}
    </Button>
  );
}
