import { Button } from "@heroui/react";
import { Moon, Sun } from "lucide-react";
import { useThemeContext } from "../context/ThemeContext.js";

type Props = {
  standalone?: boolean;
};

export function ThemeToggle({ standalone: _standalone }: Props) {
  const { isDark, toggle } = useThemeContext();
  const label = isDark ? "Modo claro" : "Modo oscuro";
  const icon = isDark ? <Sun size={20} /> : <Moon size={20} />;

  return (
    <Button
      variant="ghost"
      size="sm"
      isIconOnly
      aria-label={label}
      onPress={toggle}
    >
      {icon}
    </Button>
  );
}
