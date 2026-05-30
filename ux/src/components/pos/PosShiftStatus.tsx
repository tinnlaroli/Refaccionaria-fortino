import { Link } from "react-router-dom";
import { Tag } from "@carbon/react";
import { useShiftStatus } from "../../hooks/useShiftStatus.js";

export function PosShiftStatus() {
  const { hasShift, loading } = useShiftStatus();

  if (loading || hasShift === null) return null;

  if (hasShift) {
    return (
      <Tag type="green" size="sm" title="Turno de caja activo">
        Caja abierta
      </Tag>
    );
  }

  return (
    <Link to="/caja" className="fortino-pos-shift-link" title="Abrir turno en Caja">
      <Tag type="gray" size="sm">
        Sin turno · Abrir caja
      </Tag>
    </Link>
  );
}
