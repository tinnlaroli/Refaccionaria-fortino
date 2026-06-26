import { Link } from "react-router-dom";
import { Chip } from "@heroui/react";
import { useShiftStatus } from "../../hooks/useShiftStatus.js";

export function PosShiftStatus() {
  const { hasShift, loading } = useShiftStatus();

  if (loading || hasShift === null) return null;

  if (hasShift) {
    return (
      <Chip color="success" size="sm" title="Turno de caja activo">
        <Chip.Label>Caja abierta</Chip.Label>
      </Chip>
    );
  }

  return (
    <Link to="/caja" className="fortino-pos-shift-link no-underline" title="Abrir turno en Caja">
      <Chip size="sm">
        <Chip.Label>Sin turno · Abrir caja</Chip.Label>
      </Chip>
    </Link>
  );
}
