import { Button, HeaderGlobalAction } from "@carbon/react";
import { Light, Asleep } from "@carbon/icons-react";
import { useThemeContext } from "../context/ThemeContext.js";

type Props = {
  /** En login u otras vistas fuera del header Carbon */
  standalone?: boolean;
};

export function ThemeToggle({ standalone }: Props) {
  const { isDark, toggle } = useThemeContext();
  const label = isDark ? "Modo claro" : "Modo oscuro";
  const icon = isDark ? <Light size={20} /> : <Asleep size={20} />;

  if (standalone) {
    return (
      <Button
        kind="ghost"
        size="sm"
        hasIconOnly
        iconDescription={label}
        aria-label={label}
        onClick={toggle}
      >
        {icon}
      </Button>
    );
  }

  return (
    <HeaderGlobalAction aria-label={label} onClick={toggle} tooltipAlignment="end">
      {icon}
    </HeaderGlobalAction>
  );
}
