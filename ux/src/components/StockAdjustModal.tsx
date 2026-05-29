import { useState } from "react";
import type { AdminProduct } from "../api/admin-products.js";

const REASONS = [
  { value: "entrada", label: "Entrada de mercancía" },
  { value: "devolucion", label: "Devolución de cliente" },
  { value: "merma", label: "Merma / daño" },
  { value: "conteo", label: "Ajuste por conteo" },
  { value: "otro", label: "Otro" },
] as const;

export type StockAdjustPayload = {
  delta: number;
  reason: (typeof REASONS)[number]["value"];
  note?: string;
};

type Props = {
  product: AdminProduct;
  onClose: () => void;
  onSubmit: (payload: StockAdjustPayload) => Promise<void>;
};

export function StockAdjustModal({ product, onClose, onSubmit }: Props) {
  const [mode, setMode] = useState<"add" | "remove" | "set">("add");
  const [quantity, setQuantity] = useState(1);
  const [setValue, setSetValue] = useState(product.stock);
  const [reason, setReason] = useState<StockAdjustPayload["reason"]>("entrada");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewStock =
    mode === "set" ? setValue : mode === "add" ? product.stock + quantity : product.stock - quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let delta = 0;
      if (mode === "add") delta = quantity;
      else if (mode === "remove") delta = -quantity;
      else delta = setValue - product.stock;

      if (delta === 0) {
        setError("No hay cambio en el stock");
        setSaving(false);
        return;
      }
      if (previewStock < 0) {
        setError("El stock no puede quedar negativo");
        setSaving(false);
        return;
      }

      await onSubmit({ delta, reason, note: note.trim() || undefined });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo ajustar el stock");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-glass" onClick={(e) => e.stopPropagation()}>
        <h3>Ajustar inventario</h3>
        <p className="modal-subtitle">
          <span className="sku">{product.sku}</span> — {product.name}
        </p>
        <p className="modal-subtitle">
          Stock actual: <strong>{product.stock}</strong> · Mínimo: {product.minStock}
        </p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="form-span-2">
            Tipo de movimiento
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as "add" | "remove" | "set")}
            >
              <option value="add">Entrada (+)</option>
              <option value="remove">Salida (−)</option>
              <option value="set">Fijar cantidad exacta</option>
            </select>
          </label>

          {mode === "set" ? (
            <label className="form-span-2">
              Nuevo stock
              <input
                type="number"
                min={0}
                value={setValue}
                onChange={(e) => setSetValue(Number(e.target.value))}
                required
              />
            </label>
          ) : (
            <label className="form-span-2">
              Cantidad
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
              />
            </label>
          )}

          <label className="form-span-2">
            Motivo
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as StockAdjustPayload["reason"])}
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-span-2">
            Nota (opcional)
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. llegada de proveedor, conteo mensual..."
            />
          </label>

          <p className="form-span-2 stock-preview">
            Stock resultante: <strong>{previewStock}</strong>
          </p>

          {error && (
            <p className="form-span-2 error-text">{error}</p>
          )}

          <div className="form-actions form-span-2">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Guardando..." : "Confirmar ajuste"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
