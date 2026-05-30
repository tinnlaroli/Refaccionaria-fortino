import { useMemo } from "react";
import {
  Button,
  DataTable,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Stack,
} from "@carbon/react";
import { Printer } from "@carbon/icons-react";
import type { CartLine } from "../types/index.js";
import { AppModal } from "./carbon/AppModal.js";

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

  const headers = [
    { key: "qty", header: "Cant." },
    { key: "desc", header: "Descripción" },
    { key: "amount", header: "Importe" },
  ];

  const rows = receipt.items.map((line) => ({
    id: line.sku,
    qty: String(line.quantity),
    desc: `${line.sku} — ${line.productName}`,
    amount: `$${(line.unitPrice * line.quantity).toFixed(2)}`,
  }));

  return (
    <AppModal
      open
      title="Comprobante de venta"
      subtitle="Refaccionaria Fortino · Veracruz, México"
      onClose={onClose}
      hideFooter
      size="sm"
    >
      <div className="receipt-print-area">
        <Stack gap={4}>
          <p className="cds--body-compact-01 mono" style={{ margin: 0, color: "var(--cds-text-secondary)" }}>
            {new Date(receipt.soldAt).toLocaleString("es-MX")}
            {receipt.id && ` · Folio ${receipt.id.slice(0, 8)}`}
          </p>

          <DataTable rows={rows} headers={headers} size="sm">
            {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
              <Table {...getTableProps()} size="sm">
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHeader {...getHeaderProps({ header })} key={header.key}>
                        {header.header}
                      </TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow {...getRowProps({ row })} key={row.id}>
                      {row.cells.map((cell) => (
                        <TableCell key={cell.id}>{cell.value}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DataTable>

          <Stack gap={2}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Total</span>
              <strong className="price">${receipt.total.toFixed(2)} MXN</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Pago</span>
              <strong>{PAYMENT_LABELS[receipt.paymentMethod]}</strong>
            </div>
            {receipt.amountReceived != null && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Recibido</span>
                  <strong>${receipt.amountReceived.toFixed(2)}</strong>
                </div>
                {change != null && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Cambio</span>
                    <strong>${change.toFixed(2)}</strong>
                  </div>
                )}
              </>
            )}
          </Stack>

          <p className="cds--body-compact-01" style={{ textAlign: "center", color: "var(--cds-text-secondary)" }}>
            Gracias por su compra
          </p>
        </Stack>
      </div>

      <Stack orientation="horizontal" gap={3} className="receipt-no-print" style={{ marginTop: "1.5rem" }}>
        <Button kind="secondary" onClick={onClose}>
          Cerrar
        </Button>
        <Button kind="primary" renderIcon={Printer} onClick={() => window.print()}>
          Imprimir
        </Button>
      </Stack>
    </AppModal>
  );
}
