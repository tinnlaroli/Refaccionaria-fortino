import { useEffect, useMemo, useState } from "react";
import { Button, Chip, Label, Table } from "@heroui/react";
import { Plus, Trash2 } from "lucide-react";
import { fetchAdminProducts, type AdminProduct } from "../../api/admin-products.js";
import {
  createPurchase,
  fetchPurchases,
  type PurchaseSummary,
} from "../../api/admin-purchases.js";
import { fetchSuppliers, type Supplier } from "../../api/admin-suppliers.js";
import { EmptyState } from "../../components/EmptyState.js";
import { ErrorBanner, TableSkeleton } from "../../components/ui/PageFeedback.js";
import { DataPanel } from "../../components/ui/DataPanel.js";
import { PageToolbar, PageToolbarGroup } from "../../components/ui/PageToolbar.js";
import { EX } from "../../config/fieldExamples.js";
import { FortinoDecimalField } from "../../components/ui/FortinoDecimalField.js";
import { FortinoTextField } from "../../components/ui/FortinoTextField.js";
import { useAuth } from "../../context/AuthContext.js";
import { useToast } from "../../context/ToastContext.js";
import { usePermissions } from "../../hooks/usePermissions.js";
import { getErrorMessage } from "../../lib/errors.js";
import { positiveInt, price, required } from "../../lib/validation.js";

const SELECT_CLASS =
  "w-full rounded-lg border border-default-200 bg-background px-3 py-2 text-sm";

const STATUS_LABELS: Record<PurchaseSummary["status"], string> = {
  draft: "Borrador",
  completed: "Completada",
  cancelled: "Cancelada",
};

const STATUS_COLORS: Record<PurchaseSummary["status"], "default" | "success" | "danger"> = {
  draft: "default",
  completed: "success",
  cancelled: "danger",
};

type PurchaseLine = {
  key: string;
  productId: string;
  quantity: string;
  unitCost: string;
};

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function newLine(): PurchaseLine {
  return {
    key: crypto.randomUUID(),
    productId: "",
    quantity: "1",
    unitCost: "",
  };
}

function formatMoney(value: string | number) {
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(num)) return value;
  return num.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export function PurchasesPage() {
  const { token } = useAuth();
  const { hasPermission } = usePermissions();
  const { success } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [purchases, setPurchases] = useState<PurchaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [purchasedAt, setPurchasedAt] = useState(todayIsoDate);
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<PurchaseLine[]>([newLine()]);
  const [formError, setFormError] = useState<string | null>(null);

  const canCreate = hasPermission("purchases.create");

  const activeSuppliers = useMemo(
    () => suppliers.filter((s) => s.isActive),
    [suppliers],
  );

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [supplierList, productList, purchaseList] = await Promise.all([
        fetchSuppliers(token),
        fetchAdminProducts(token),
        fetchPurchases(token),
      ]);
      setSuppliers(supplierList);
      setProducts(productList.filter((p) => p.isActive));
      setPurchases(purchaseList);
      if (!supplierId && supplierList.length > 0) {
        const firstActive = supplierList.find((s) => s.isActive);
        if (firstActive) setSupplierId(firstActive.id);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Error al cargar datos"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateLine = (key: string, patch: Partial<PurchaseLine>) => {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  };

  const addLine = () => setLines((prev) => [...prev, newLine()]);

  const removeLine = (key: string) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((line) => line.key !== key)));
  };

  const handleProductChange = (key: string, productId: string) => {
    const product = products.find((p) => p.id === productId);
    updateLine(key, {
      productId,
      unitCost: product?.purchasePrice ?? "",
    });
  };

  const validateForm = () => {
    const supplierErr = required(supplierId, "El proveedor");
    if (supplierErr) return supplierErr;
    if (!purchasedAt.trim()) return "La fecha es obligatoria";

    const validLines = lines.filter((line) => line.productId);
    if (validLines.length === 0) return "Agrega al menos un producto";

    for (let i = 0; i < validLines.length; i += 1) {
      const line = validLines[i];
      const qtyErr = positiveInt(line.quantity, "Cantidad");
      if (qtyErr) return `Línea ${i + 1}: ${qtyErr}`;
      const costErr = price(line.unitCost, "Costo unitario");
      if (costErr) return `Línea ${i + 1}: ${costErr}`;
    }

    return null;
  };

  const resetForm = () => {
    setReferenceNumber("");
    setPurchasedAt(todayIsoDate());
    setNotes("");
    setLines([newLine()]);
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (!token || !canCreate) return;
    const validation = validateForm();
    if (validation) {
      setFormError(validation);
      return;
    }
    setSaving(true);
    setFormError(null);
    setError(null);
    try {
      await createPurchase(token, {
        supplierId,
        referenceNumber: referenceNumber.trim() || null,
        purchasedAt: new Date(`${purchasedAt}T12:00:00`).toISOString(),
        notes: notes.trim() || null,
        items: lines
          .filter((line) => line.productId)
          .map((line) => ({
            productId: line.productId,
            quantity: Number(line.quantity),
            unitCost: line.unitCost,
          })),
      });
      success("Compra registrada");
      resetForm();
      const purchaseList = await fetchPurchases(token);
      setPurchases(purchaseList);
    } catch (err) {
      setFormError(getErrorMessage(err, "No se pudo registrar la compra"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fortino-admin-page">
      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {canCreate && (
        <DataPanel
          title="Registrar compra"
          description="Entrada de mercancía desde un proveedor"
          compact
        >
          <div className="flex flex-col gap-5 p-4 md:p-5">
            {formError && (
              <p className="m-0 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
                {formError}
              </p>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="purchase-supplier">Proveedor</Label>
                <select
                  id="purchase-supplier"
                  className={SELECT_CLASS}
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  required
                >
                  <option value="">Selecciona proveedor…</option>
                  {activeSuppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>
              <FortinoTextField
                id="purchase-reference"
                label="Folio de factura o remisión"
                placeholder={EX.purchaseRef}
                value={referenceNumber}
                onChange={setReferenceNumber}
                helperText="Opcional · referencia del documento del proveedor"
              />
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="purchase-date">Fecha de compra</Label>
                <input
                  id="purchase-date"
                  type="date"
                  className={SELECT_CLASS}
                  value={purchasedAt}
                  onChange={(e) => setPurchasedAt(e.target.value)}
                  required
                />
              </div>
              <FortinoTextField
                id="purchase-notes"
                label="Notas de la compra"
                placeholder={EX.purchaseNotes}
                value={notes}
                onChange={setNotes}
              />
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <p className="m-0 text-sm font-semibold text-foreground">Productos</p>
                <Button variant="secondary" size="sm" onPress={addLine}>
                  <Plus size={14} />
                  Agregar línea
                </Button>
              </div>

              {lines.map((line, index) => (
                <div
                  key={line.key}
                  className="fortino-purchase-line grid gap-3 rounded-xl border border-border bg-surface-secondary p-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
                >
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`purchase-product-${line.key}`}>Producto {index + 1}</Label>
                    <select
                      id={`purchase-product-${line.key}`}
                      className={SELECT_CLASS}
                      value={line.productId}
                      onChange={(e) => handleProductChange(line.key, e.target.value)}
                    >
                      <option value="">Selecciona producto…</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.sku} — {product.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <FortinoDecimalField
                    id={`purchase-qty-${line.key}`}
                    label="Cantidad recibida"
                    format="integer"
                    placeholder={EX.purchaseQty}
                    className="fortino-purchase-line__qty"
                    value={line.quantity}
                    onChange={(next) => updateLine(line.key, { quantity: next })}
                  />
                  <FortinoDecimalField
                    id={`purchase-cost-${line.key}`}
                    label="Costo unitario (MXN)"
                    placeholder={EX.purchaseCost}
                    className="fortino-purchase-line__cost"
                    value={line.unitCost}
                    onChange={(next) => updateLine(line.key, { unitCost: next })}
                  />
                  <div className="flex items-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      isIconOnly
                      aria-label="Eliminar línea"
                      isDisabled={lines.length <= 1}
                      onPress={() => removeLine(line.key)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button variant="primary" isDisabled={saving} onPress={handleSubmit}>
                {saving ? "Registrando…" : "Registrar compra"}
              </Button>
            </div>
          </div>
        </DataPanel>
      )}

      <PageToolbar>
        <PageToolbarGroup grow>
          <p className="m-0 text-sm text-muted">{purchases.length} compra(s) registrada(s)</p>
        </PageToolbarGroup>
      </PageToolbar>

      {loading ? (
        <TableSkeleton />
      ) : purchases.length === 0 ? (
        <EmptyState
          title="Sin compras"
          description={
            canCreate
              ? "Registra la primera compra para actualizar inventario y costos."
              : "Aún no hay compras registradas."
          }
        />
      ) : (
        <DataPanel title="Compras recientes" description="Entradas de mercancía registradas" compact>
          <div className="fortino-interactive-table">
            <Table aria-label="Compras">
              <Table.ScrollContainer>
                <Table.Content>
                  <Table.Header>
                    <Table.Column isRowHeader>Fecha</Table.Column>
                    <Table.Column>Proveedor</Table.Column>
                    <Table.Column>Referencia</Table.Column>
                    <Table.Column>Registró</Table.Column>
                    <Table.Column>Estado</Table.Column>
                    <Table.Column>Total</Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {purchases.map((purchase) => (
                      <Table.Row key={purchase.id} id={purchase.id}>
                        <Table.Cell>
                          {new Date(purchase.purchasedAt).toLocaleString("es-MX")}
                        </Table.Cell>
                        <Table.Cell>{purchase.supplierName}</Table.Cell>
                        <Table.Cell>{purchase.referenceNumber ?? "—"}</Table.Cell>
                        <Table.Cell>{purchase.receiverName}</Table.Cell>
                        <Table.Cell>
                          <Chip color={STATUS_COLORS[purchase.status]} size="sm">
                            <Chip.Label>{STATUS_LABELS[purchase.status]}</Chip.Label>
                          </Chip>
                        </Table.Cell>
                        <Table.Cell className="price">{formatMoney(purchase.totalCost)}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </div>
        </DataPanel>
      )}
    </div>
  );
}
