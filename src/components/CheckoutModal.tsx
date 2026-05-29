import { useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import { useCart } from "../context/CartContext.js";
import { getCachedShift } from "../api/cash.js";
import { createSaleOnline, queueSaleOffline } from "../api/sales.js";
import { useOnline } from "../hooks/useOnline.js";
import { ReceiptModal, type ReceiptData } from "./ReceiptModal.js";

type PaymentMethod = "cash" | "card" | "transfer";

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [amountReceived, setAmountReceived] = useState("");
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const change = useMemo(() => {
    if (paymentMethod !== "cash") return null;
    const received = Number(amountReceived);
    if (!received || Number.isNaN(received)) return null;
    return Math.max(0, received - total);
  }, [paymentMethod, amountReceived, total]);

  const canConfirm =
    lines.length > 0 &&
    (paymentMethod !== "cash" ||
      (Number(amountReceived) >= total && !Number.isNaN(Number(amountReceived))));

  if (!open && !receipt) return null;

  const handleConfirm = async () => {
    if (lines.length === 0 || !canConfirm) return;
    setLoading(true);
    setError(null);

    const clientUuid = crypto.randomUUID();
    const soldAt = new Date().toISOString();
    const shift = await getCachedShift();
    const snapshotItems = [...lines];
    const received =
      paymentMethod === "cash" ? Number(amountReceived) : undefined;

    try {
      let saleId: string | undefined;
      if (online && token) {
        const result = await createSaleOnline(token, {
          clientUuid,
          shiftId: shift?.shiftId ?? null,
          soldAt,
          paymentMethod,
          amountReceived: received,
          items: snapshotItems,
        });
        saleId = result.id;
        await sync();
      } else {
        await queueSaleOffline({
          clientUuid,
          shiftId: shift?.shiftId ?? null,
          soldAt,
          paymentMethod,
          amountReceived: received,
          items: snapshotItems,
        });
      }

      clear();
      onSuccess();
      onClose();
      setAmountReceived("");
      setPaymentMethod("cash");
      setReceipt({
        id: saleId,
        clientUuid,
        soldAt,
        paymentMethod,
        amountReceived: received,
        items: snapshotItems,
        total,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cobrar");
    } finally {
      setLoading(false);
    }
  };

  if (receipt) {
    return (
      <ReceiptModal
        receipt={receipt}
        onClose={() => {
          setReceipt(null);
        }}
      />
    );
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-glass">
        <h2 style={{ marginTop: 0 }}>Confirmar cobro</h2>
        <p style={{ color: "var(--text-muted)" }}>
          {lines.length} artículo(s) · {!online && "Se guardará offline"}
        </p>
        <p className="checkout-total price">${total.toFixed(2)} MXN</p>

        <div className="payment-methods">
          {(
            [
              ["cash", "Efectivo"],
              ["card", "Tarjeta"],
              ["transfer", "Transferencia"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`chip ${paymentMethod === value ? "chip-active" : ""}`}
              onClick={() => setPaymentMethod(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {paymentMethod === "cash" && (
          <label className="checkout-field">
            Monto recibido
            <input
              type="number"
              min={total}
              step="0.01"
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              placeholder={total.toFixed(2)}
              autoFocus
            />
            {change != null && amountReceived && (
              <span className="change-hint">
                Cambio: <strong>${change.toFixed(2)}</strong>
              </span>
            )}
          </label>
        )}

        {error && <p className="error-text">{error}</p>}
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
          <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primary"
            style={{ flex: 1 }}
            disabled={loading || !canConfirm}
            onClick={handleConfirm}
          >
            {loading ? "Procesando..." : "Cobrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
