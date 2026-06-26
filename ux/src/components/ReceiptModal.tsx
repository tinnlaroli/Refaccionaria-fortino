import { useMemo } from "react";
import { Button, Table } from "@heroui/react";
import { Printer } from "lucide-react";
import type { CartLine } from "../types/index.js";
import { AppModal } from "./ui/AppModal.js";

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

  return (
    <AppModal
      open
      title="Comprobante de venta"
      subtitle="Refaccionaria Fortino · Veracruz, México"
      size="md"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onPress={onClose}>
            Cerrar
          </Button>
          <Button variant="primary" onPress={() => window.print()}>
            <Printer size={16} />
            Imprimir
          </Button>
        </>
      }
    >
      <div className="receipt-print-area">
        <div className="flex flex-col gap-4">
          <p className="text-sm mono m-0 text-muted">
            {new Date(receipt.soldAt).toLocaleString("es-MX")}
            {receipt.id && ` · Folio ${receipt.id.slice(0, 8)}`}
          </p>

          <Table aria-label="Artículos del comprobante">
            <Table.ScrollContainer>
              <Table.Content>
                <Table.Header>
                  <Table.Column isRowHeader>Cantidad</Table.Column>
                  <Table.Column>Descripción del producto</Table.Column>
                  <Table.Column>Importe línea</Table.Column>
                </Table.Header>
                <Table.Body>
                  {receipt.items.map((line) => (
                    <Table.Row key={line.sku} id={line.sku}>
                      <Table.Cell>{line.quantity}</Table.Cell>
                      <Table.Cell>{`${line.sku} — ${line.productName}`}</Table.Cell>
                      <Table.Cell className="mono">
                        ${(line.unitPrice * line.quantity).toFixed(2)}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <span>Total</span>
              <strong className="price">${receipt.total.toFixed(2)} MXN</strong>
            </div>
            <div className="flex justify-between">
              <span>Pago</span>
              <strong>{PAYMENT_LABELS[receipt.paymentMethod]}</strong>
            </div>
            {receipt.amountReceived != null && (
              <>
                <div className="flex justify-between">
                  <span>Recibido</span>
                  <strong>${receipt.amountReceived.toFixed(2)}</strong>
                </div>
                {change != null && (
                  <div className="flex justify-between">
                    <span>Cambio</span>
                    <strong>${change.toFixed(2)}</strong>
                  </div>
                )}
              </>
            )}
          </div>

          <p className="text-sm text-center text-muted m-0">
            Gracias por su compra
          </p>
        </div>
      </div>
    </AppModal>
  );
}
