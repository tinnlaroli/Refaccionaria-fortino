import { useMemo } from "react";
import type { CartLine } from "../types/index.js";

export type ReceiptData = {
  id?: string;
  clientUuid: string;
  soldAt: string;
  paymentMethod: "cash" | "card" | "transfer";
  amountReceived?: number;
  items: CartLine[];
  total: number;
};

const PAYMENT_LABELS = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
} as const;

type Props = {
  receipt: ReceiptData;
  onClose: () => void;
};

export function ReceiptModal({ receipt, onClose }: Props) {
  const change = useMemo(() => {
    if (receipt.paymentMethod !== "cash" || receipt.amountReceived == null) {
      return null;
    }
    return Math.max(0, receipt.amountReceived - receipt.total);
  }, [receipt]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay receipt-overlay" role="dialog" aria-modal="true">
      <div className="modal-glass receipt-modal">
        <div className="receipt-print-area">
          <div className="receipt-header">
            <strong>Refaccionaria Fortino</strong>
            <span>Veracruz, México</span>
            <span className="mono">{new Date(receipt.soldAt).toLocaleString("es-MX")}</span>
            {receipt.id && <span className="mono">Folio: {receipt.id.slice(0, 8)}</span>}
          </div>

          <table className="receipt-table">
            <thead>
              <tr>
                <th>Cant.</th>
                <th>Descripción</th>
                <th>Importe</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((line) => (
                <tr key={line.sku}>
                  <td>{line.quantity}</td>
                  <td>
                    <span className="sku">{line.sku}</span>
                    <br />
                    {line.productName}
                  </td>
                  <td className="price">
                    ${(line.unitPrice * line.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="receipt-totals">
            <div>
              <span>Total</span>
              <strong className="price">${receipt.total.toFixed(2)} MXN</strong>
            </div>
            <div>
              <span>Pago</span>
              <strong>{PAYMENT_LABELS[receipt.paymentMethod]}</strong>
            </div>
            {receipt.amountReceived != null && (
              <>
                <div>
                  <span>Recibido</span>
                  <strong>${receipt.amountReceived.toFixed(2)}</strong>
                </div>
                {change != null && (
                  <div>
                    <span>Cambio</span>
                    <strong>${change.toFixed(2)}</strong>
                  </div>
                )}
              </>
            )}
          </div>

          <p className="receipt-footer">Gracias por su compra</p>
        </div>

        <div className="receipt-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cerrar
          </button>
          <button type="button" className="btn-primary" onClick={handlePrint}>
            Imprimir ticket
          </button>
        </div>
      </div>
    </div>
  );
}
