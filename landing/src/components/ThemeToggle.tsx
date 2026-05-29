type Props = {
  theme: "light" | "dark";
  onToggle: () => void;
};

export function ThemeToggle({ theme, onToggle }: Props) {
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={theme === "dark" ? "Activar tema claro" : "Activar tema oscuro"}
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
