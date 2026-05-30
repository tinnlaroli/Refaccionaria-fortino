import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BRAND = "Refaccionaria Fortino";
const MARGIN = 14;

function fmtDateTime(value: Date | string) {
  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function fmtMoney(value: number | string) {
  return `$${Number(value).toFixed(2)}`;
}

function stockStatus(stock: number, minStock: number) {
  if (stock <= 0) return "Sin stock";
  if (stock <= minStock) return "Stock bajo";
  return "OK";
}

function addHeader(doc: jsPDF, title: string, subtitleLines: string[] = []) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(BRAND, MARGIN, 16);

  doc.setFontSize(12);
  doc.text(title, MARGIN, 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80);
  let y = 30;
  for (const line of subtitleLines) {
    doc.text(line, MARGIN, y);
    y += 5;
  }
  doc.setTextColor(0);

  const ruleY = y + 1;
  doc.setDrawColor(180);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, ruleY, pageWidth - MARGIN, ruleY);

  return ruleY + 6;
}

function addFooters(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  const generated = fmtDateTime(new Date());

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(110);
    doc.text(`Generado: ${generated}`, MARGIN, pageHeight - 8);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth(doc) - MARGIN, pageHeight - 8, {
      align: "right",
    });
    doc.setTextColor(0);
  }
}

function pageWidth(doc: jsPDF) {
  return doc.internal.pageSize.getWidth();
}

function downloadPdf(doc: jsPDF, filename: string) {
  addFooters(doc);
  doc.save(filename);
}

const PAYMENT_LABELS = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
} as const;

export type SalesPdfRow = {
  id: string;
  total: string;
  soldAt: string;
  paymentMethod: keyof typeof PAYMENT_LABELS;
  status: "completed" | "cancelled";
  cashier?: { fullName: string };
  items: Array<{
    sku: string;
    productName: string;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
  }>;
};

export function exportSalesPdf(
  sales: SalesPdfRow[],
  meta: { periodLabel: string; statusLabel?: string; search?: string },
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const completed = sales.filter((s) => s.status === "completed");
  const totalAmount = completed.reduce((sum, s) => sum + Number(s.total), 0);

  const subtitle = [
    meta.periodLabel,
    meta.statusLabel ? `Estado: ${meta.statusLabel}` : "",
    meta.search ? `Búsqueda: ${meta.search}` : "",
    `${completed.length} venta(s) completada(s) · Total: ${fmtMoney(totalAmount)} MXN`,
  ].filter(Boolean);

  let startY = addHeader(doc, "Reporte de ventas", subtitle);

  autoTable(doc, {
    startY,
    head: [["Fecha", "Total", "Pago", "Estado", "Cajero", "SKU", "Producto", "Cant.", "P. unit.", "Importe"]],
    body: sales.flatMap((sale) =>
      sale.items.map((item, idx) => [
        idx === 0 ? fmtDateTime(sale.soldAt) : "",
        idx === 0 ? fmtMoney(sale.total) : "",
        idx === 0 ? PAYMENT_LABELS[sale.paymentMethod] : "",
        idx === 0 ? (sale.status === "cancelled" ? "Cancelada" : "Completada") : "",
        idx === 0 ? sale.cashier?.fullName ?? "—" : "",
        item.sku,
        item.productName,
        String(item.quantity),
        fmtMoney(item.unitPrice),
        fmtMoney(item.lineTotal),
      ]),
    ),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [22, 22, 22], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: MARGIN, right: MARGIN },
  });

  downloadPdf(doc, `ventas-fortino-${fileStamp()}.pdf`);
}

export type InventoryPdfRow = {
  sku: string;
  name: string;
  category?: string;
  stock: number;
  minStock: number;
  salePrice?: string | number;
};

export function exportInventoryPdf(
  products: InventoryPdfRow[],
  meta: { filterLabel: string; search?: string },
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const low = products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length;
  const out = products.filter((p) => p.stock <= 0).length;

  const subtitle = [
    meta.filterLabel,
    meta.search ? `Búsqueda: ${meta.search}` : "",
    `${products.length} producto(s) · ${low} stock bajo · ${out} sin stock`,
  ].filter(Boolean);

  const startY = addHeader(doc, "Reporte de inventario", subtitle);

  autoTable(doc, {
    startY,
    head: [["SKU", "Producto", "Categoría", "Stock", "Mínimo", "Precio venta", "Estado"]],
    body: products.map((p) => [
      p.sku,
      p.name,
      p.category ?? "—",
      String(p.stock),
      String(p.minStock),
      p.salePrice != null ? fmtMoney(p.salePrice) : "—",
      stockStatus(p.stock, p.minStock),
    ]),
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [22, 22, 22], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: {
      0: { cellWidth: 28, fontStyle: "bold" },
      3: { halign: "center" },
      4: { halign: "center" },
      5: { halign: "right" },
      6: { halign: "center" },
    },
    margin: { left: MARGIN, right: MARGIN },
  });

  downloadPdf(doc, `inventario-fortino-${fileStamp()}.pdf`);
}

function fileStamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}
