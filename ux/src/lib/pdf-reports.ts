import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BRAND = "Refaccionaria Fortino";
const BRAND_TAGLINE = "Veracruz, México · Control de inventario y ventas";
const MARGIN = 14;

const COLORS = {
  brand: [196, 30, 58] as [number, number, number],
  ink: [24, 24, 27] as [number, number, number],
  muted: [113, 113, 122] as [number, number, number],
  headerBg: [24, 24, 27] as [number, number, number],
  altRow: [250, 250, 250] as [number, number, number],
  panel: [244, 244, 245] as [number, number, number],
  ok: [22, 120, 60] as [number, number, number],
  warn: [161, 98, 7] as [number, number, number],
  danger: [196, 30, 58] as [number, number, number],
  border: [212, 212, 216] as [number, number, number],
};

function fmtDateTime(value: Date | string) {
  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function fmtMoney(value: number | string) {
  const num = Number(value);
  return `$${num.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function stockStatus(stock: number, minStock: number) {
  if (stock <= 0) return "Sin stock";
  if (stock <= minStock) return "Stock bajo";
  return "Disponible";
}

function pageWidth(doc: jsPDF) {
  return doc.internal.pageSize.getWidth();
}

function pageHeight(doc: jsPDF) {
  return doc.internal.pageSize.getHeight();
}

function fileStamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function addBrandBar(doc: jsPDF) {
  const w = pageWidth(doc);
  doc.setFillColor(...COLORS.brand);
  doc.rect(0, 0, w, 4, "F");
}

function addHeader(doc: jsPDF, title: string, subtitleLines: string[] = []) {
  addBrandBar(doc);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.brand);
  doc.text(BRAND, MARGIN, 14);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.muted);
  doc.text(BRAND_TAGLINE, MARGIN, 19);

  doc.setTextColor(...COLORS.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, MARGIN, 28);

  let y = 34;
  if (subtitleLines.length > 0) {
    const panelW = pageWidth(doc) - MARGIN * 2;
    const panelH = subtitleLines.length * 5 + 6;
    doc.setFillColor(...COLORS.panel);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.roundedRect(MARGIN, y - 4, panelW, panelH, 2, 2, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.muted);
    for (const line of subtitleLines) {
      doc.text(line, MARGIN + 4, y);
      y += 5;
    }
    y += 4;
  }

  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y, pageWidth(doc) - MARGIN, y);

  doc.setTextColor(...COLORS.ink);
  return y + 6;
}

function addSummaryCards(doc: jsPDF, startY: number, cards: Array<{ label: string; value: string }>) {
  if (cards.length === 0) return startY;

  const gap = 4;
  const totalW = pageWidth(doc) - MARGIN * 2;
  const cardW = (totalW - gap * (cards.length - 1)) / cards.length;
  let x = MARGIN;

  for (const card of cards) {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(x, startY, cardW, 16, 2, 2, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(card.label, x + 3, startY + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.ink);
    doc.text(card.value, x + 3, startY + 12);

    x += cardW + gap;
  }

  return startY + 22;
}

function addFooters(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const generated = fmtDateTime(new Date());

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const h = pageHeight(doc);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, h - 14, pageWidth(doc) - MARGIN, h - 14);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(`Documento generado el ${generated}`, MARGIN, h - 8);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth(doc) - MARGIN, h - 8, { align: "right" });
    doc.setTextColor(...COLORS.ink);
  }
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

const TABLE_BASE = {
  styles: {
    fontSize: 8.5,
    cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
    lineColor: COLORS.border,
    lineWidth: 0.1,
    textColor: COLORS.ink,
  },
  headStyles: {
    fillColor: COLORS.headerBg,
    textColor: [255, 255, 255] as [number, number, number],
    fontStyle: "bold" as const,
    halign: "left" as const,
  },
  alternateRowStyles: { fillColor: COLORS.altRow },
  margin: { left: MARGIN, right: MARGIN },
};

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
  const cancelled = sales.filter((s) => s.status === "cancelled");
  const totalAmount = completed.reduce((sum, s) => sum + Number(s.total), 0);
  const itemCount = sales.reduce((sum, s) => sum + s.items.length, 0);

  const subtitle = [
    `Periodo: ${meta.periodLabel}`,
    meta.statusLabel ? `Filtro de estado: ${meta.statusLabel}` : "",
    meta.search ? `Búsqueda aplicada: «${meta.search}»` : "",
  ].filter(Boolean);

  let startY = addHeader(doc, "Reporte de ventas", subtitle);
  startY = addSummaryCards(doc, startY, [
    { label: "Ventas completadas", value: String(completed.length) },
    { label: "Ventas canceladas", value: String(cancelled.length) },
    { label: "Total cobrado (MXN)", value: fmtMoney(totalAmount) },
    { label: "Líneas de producto", value: String(itemCount) },
  ]);

  if (sales.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.muted);
    doc.text("No hay ventas que coincidan con los filtros seleccionados.", MARGIN, startY + 4);
    downloadPdf(doc, `ventas-fortino-${fileStamp()}.pdf`);
    return;
  }

  autoTable(doc, {
    ...TABLE_BASE,
    startY,
    head: [
      [
        "Fecha y hora",
        "Total venta",
        "Forma de pago",
        "Estado",
        "Cajero",
        "Código SKU",
        "Nombre del producto",
        "Cantidad",
        "Precio unitario",
        "Importe línea",
      ],
    ],
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
    columnStyles: {
      0: { cellWidth: 28 },
      1: { halign: "right", cellWidth: 22 },
      7: { halign: "center", cellWidth: 16 },
      8: { halign: "right", cellWidth: 22 },
      9: { halign: "right", cellWidth: 22 },
    },
    didParseCell: (data) => {
      if (data.section !== "body" || data.column.index !== 3) return;
      const status = String(data.cell.raw);
      if (status === "Cancelada") data.cell.styles.textColor = COLORS.danger;
      else if (status === "Completada") data.cell.styles.textColor = COLORS.ok;
    },
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
  const ok = products.length - low - out;

  const subtitle = [
    `Filtro: ${meta.filterLabel}`,
    meta.search ? `Búsqueda aplicada: «${meta.search}»` : "",
  ].filter(Boolean);

  let startY = addHeader(doc, "Reporte de inventario", subtitle);
  startY = addSummaryCards(doc, startY, [
    { label: "Productos listados", value: String(products.length) },
    { label: "Disponibles", value: String(ok) },
    { label: "Stock bajo", value: String(low) },
    { label: "Sin stock", value: String(out) },
  ]);

  if (products.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.muted);
    doc.text("No hay productos que coincidan con los filtros seleccionados.", MARGIN, startY + 4);
    downloadPdf(doc, `inventario-fortino-${fileStamp()}.pdf`);
    return;
  }

  autoTable(doc, {
    ...TABLE_BASE,
    startY,
    styles: { ...TABLE_BASE.styles, fontSize: 9 },
    head: [
      [
        "Código SKU",
        "Nombre del producto",
        "Categoría",
        "Existencia",
        "Stock mínimo",
        "Precio de venta",
        "Estado",
      ],
    ],
    body: products.map((p) => [
      p.sku,
      p.name,
      p.category ?? "Sin categoría",
      String(p.stock),
      String(p.minStock),
      p.salePrice != null ? fmtMoney(p.salePrice) : "—",
      stockStatus(p.stock, p.minStock),
    ]),
    columnStyles: {
      0: { cellWidth: 26, fontStyle: "bold" },
      3: { halign: "center", cellWidth: 18 },
      4: { halign: "center", cellWidth: 20 },
      5: { halign: "right", cellWidth: 24 },
      6: { halign: "center", cellWidth: 22 },
    },
    didParseCell: (data) => {
      if (data.section !== "body" || data.column.index !== 6) return;
      const status = String(data.cell.raw);
      if (status === "Sin stock") data.cell.styles.textColor = COLORS.danger;
      else if (status === "Stock bajo") data.cell.styles.textColor = COLORS.warn;
      else if (status === "Disponible") data.cell.styles.textColor = COLORS.ok;
    },
  });

  downloadPdf(doc, `inventario-fortino-${fileStamp()}.pdf`);
}

export type CashShiftPdfData = {
  openedAt: string;
  closedAt?: string | null;
  openingCash: string | number;
  closingCashDeclared: string | number;
  closingCashExpected: string | number;
  difference: number;
  salesCount: number;
  salesTotal: number;
  cashSalesTotal: number;
  cardSalesTotal: number;
  transferSalesTotal: number;
  incomeTotal: number;
  expenseTotal: number;
  movementNet: number;
  expectedCash: number;
  cashierName?: string;
};

export function exportCashShiftPdf(data: CashShiftPdfData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const subtitle = [
    `Apertura del turno: ${fmtDateTime(data.openedAt)}`,
    data.closedAt ? `Cierre del turno: ${fmtDateTime(data.closedAt)}` : "Turno en curso",
    data.cashierName ? `Responsable: ${data.cashierName}` : "",
  ].filter(Boolean);

  let y = addHeader(doc, "Corte de caja", subtitle);

  y = addSummaryCards(doc, y, [
    { label: "Ventas registradas", value: String(data.salesCount) },
    { label: "Total vendido", value: fmtMoney(data.salesTotal) },
    { label: "Efectivo esperado", value: fmtMoney(data.expectedCash) },
    {
      label: "Diferencia de arqueo",
      value: `${data.difference >= 0 ? "+" : ""}${fmtMoney(data.difference)}`,
    },
  ]);

  const sections: Array<{ title: string; rows: Array<[string, string]> }> = [
    {
      title: "Apertura",
      rows: [["Efectivo inicial en caja", fmtMoney(data.openingCash)]],
    },
    {
      title: "Ventas del turno",
      rows: [
        ["Número de ventas", String(data.salesCount)],
        ["Monto total vendido", fmtMoney(data.salesTotal)],
        ["Ventas en efectivo", fmtMoney(data.cashSalesTotal)],
        ["Ventas con tarjeta", fmtMoney(data.cardSalesTotal)],
        ["Ventas por transferencia", fmtMoney(data.transferSalesTotal)],
      ],
    },
    {
      title: "Movimientos manuales",
      rows: [
        ["Ingresos registrados", fmtMoney(data.incomeTotal)],
        ["Egresos registrados", fmtMoney(data.expenseTotal)],
        ["Balance de movimientos", fmtMoney(data.movementNet)],
      ],
    },
    {
      title: "Arqueo de cierre",
      rows: [
        ["Efectivo esperado en caja", fmtMoney(data.expectedCash)],
        ["Efectivo contado físicamente", fmtMoney(data.closingCashDeclared)],
        [
          "Diferencia (contado − esperado)",
          `${data.difference >= 0 ? "+" : ""}${fmtMoney(data.difference)}`,
        ],
      ],
    },
  ];

  for (const section of sections) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.ink);
    doc.text(section.title, MARGIN, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      body: section.rows,
      theme: "plain",
      styles: {
        fontSize: 9.5,
        cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
        textColor: COLORS.ink,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 78, textColor: COLORS.muted },
        1: { halign: "right", fontStyle: "bold" },
      },
      margin: { left: MARGIN, right: MARGIN },
      didParseCell: (cellData) => {
        if (cellData.section !== "body") return;
        const isDiffRow = String(cellData.row.raw).includes("Diferencia");
        if (isDiffRow && cellData.column.index === 1) {
          if (data.difference < 0) cellData.cell.styles.textColor = COLORS.danger;
          else if (data.difference === 0) cellData.cell.styles.textColor = COLORS.ok;
          else cellData.cell.styles.textColor = COLORS.warn;
        }
      },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text(
    "Cálculo: efectivo esperado = apertura + ventas en efectivo + ingresos − egresos",
    MARGIN,
    y,
  );

  downloadPdf(doc, `corte-caja-fortino-${fileStamp()}.pdf`);
}
