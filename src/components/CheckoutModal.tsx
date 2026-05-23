import { useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import { useCart } from "../context/CartContext.js";
import { getCachedShift } from "../api/cash.js";
import { createSaleOnline, queueSaleOffline } from "../api/sales.js";
import { useOnline } from "../hooks/useOnline.js";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function CheckoutModal({ open, onClose, onSuccess }: Props) {
  const { token, sync } = useAuth();
  const { lines, total, clear } = useCart();
  const online = useOnline();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleConfirm = async () => {
    if (lines.length === 0) return;
    setLoading(true);
    setError(null);

    const clientUuid = crypto.randomUUID();
    const soldAt = new Date().toISOString();
    const shift = await getCachedShift();

    try {
      if (online && token) {
        await createSaleOnline(token, {
          clientUuid,
          shiftId: shift?.shiftId ?? null,
          soldAt,
          items: lines,
        });
        await sync();
      } else {
        await queueSaleOffline({
          clientUuid,
          shiftId: shift?.shiftId ?? null,
          soldAt,
          items: lines,
        });
      }
      clear();
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cobrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-glass">
        <h2 style={{ marginTop: 0 }}>Confirmar cobro</h2>
        <p style={{ color: "var(--text-muted)" }}>
          {lines.length} artículo(s) · {!online && "Se guardará offline"}
        </p>
        <p className="checkout-total price">
          ${total.toFixed(2)} MXN
        </p>
        {error && <p className="error-text">{error}</p>}
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
          <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primary"
            style={{ flex: 1 }}
            disabled={loading || lines.length === 0}
            onClick={handleConfirm}
          >
            {loading ? "Procesando..." : "Cobrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
