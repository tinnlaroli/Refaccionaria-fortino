import { ThemeSegment } from "./ThemeSegment.js";

type Props = {
  /** Etiqueta visible junto al interruptor */
  showLabel?: boolean;
  /** Versión compacta para espacios reducidos */
  compact?: boolean;
};

/** @deprecated Prefer ThemeSegment — mantiene compatibilidad con login */
export function ThemeSwitcher({ compact }: Props) {
  return <ThemeSegment compact={compact} />;
}
