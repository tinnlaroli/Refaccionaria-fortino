import { Minus, User } from "lucide-react";

type Props = {
  size?: number;
};

/** Usuario con signo menos — desactivar / quitar acceso */
export function UserMinusIcon({ size = 20 }: Props) {
  const badge = Math.max(10, Math.round(size * 0.48));
  return (
    <span className="fortino-user-minus-icon relative inline-flex" aria-hidden>
      <User size={size} />
      <Minus size={badge} className="fortino-user-minus-icon__badge absolute -bottom-0.5 -right-0.5 rounded-full bg-background" />
    </span>
  );
}
