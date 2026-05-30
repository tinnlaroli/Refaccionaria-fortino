import { SubtractAlt, User } from "@carbon/icons-react";

type Props = {
  size?: number;
};

/** Usuario con signo menos — desactivar / quitar acceso */
export function UserMinusIcon({ size = 20 }: Props) {
  const badge = Math.max(10, Math.round(size * 0.48));
  return (
    <span className="fortino-user-minus-icon" aria-hidden>
      <User size={size} />
      <SubtractAlt size={badge} className="fortino-user-minus-icon__badge" />
    </span>
  );
}
