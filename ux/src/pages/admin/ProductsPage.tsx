import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Button,
  Checkbox,
  DataTable,
  NumberInput,
  Search,
  Select,
  SelectItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
  TextInput,
  Toggle,
} from "@carbon/react";
import { Add, Edit, InventoryManagement } from "@carbon/icons-react";
import {
  createProduct,
  fetchAdminProducts,
  updateProduct,
  adjustProductStock,
  type AdminProduct,
  type ProductInput,
} from "../../api/admin-products.js";
import { fetchCategories, type Category } from "../../api/admin-categories.js";
import { AppModal } from "../../components/carbon/AppModal.js";
import {
  InteractiveTableRow,
  TABLE_ACTIONS_RAIL,
} from "../../components/carbon/InteractiveTableRow.js";
import { ErrorBanner, TableSkeleton } from "../../components/carbon/PageFeedback.js";
import { EmptyState } from "../../components/EmptyState.js";
import { StockAdjustModal } from "../../components/StockAdjustModal.js";
import { StockBadge } from "../../components/StockBadge.js";
import { useAuth } from "../../context/AuthContext.js";
import { useToast } from "../../context/ToastContext.js";
import { usePermissions } from "../../hooks/usePermissions.js";
import { getErrorMessage } from "../../lib/errors.js";
import {
  blockDigitsInName,
  combine,
  description,
  nameField,
  nonNegativeInt,
  password,
  price,
  salePriceAboveCost,
  sku as validateSku,
} from "../../lib/validation.js";

const emptyForm: ProductInput = {
  sku: "",
  name: "",
  description: "",
  categoryId: null,
  purchasePrice: "",
  salePrice: "",
  stock: 0,
  minStock: 0,
  isActive: true,
};

type FormFields = "sku" | "name" | "description" | "salePrice" | "purchasePrice" | "stock" | "minStock";

function fieldRules(
  form: ProductInput,
  editing: AdminProduct | null,
  canViewCosts: boolean,
): Partial<Record<FormFields, string | undefined>> {
  return {
    sku: editing ? undefined : validateSku(form.sku),
    name: nameField(form.name, "Nombre del producto"),
    description: description(form.description ?? ""),
    salePrice: combine(
      price(form.salePrice, "Precio de venta"),
      canViewCosts ? salePriceAboveCost(form.salePrice, form.purchasePrice) : undefined,
    ),
    purchasePrice: canViewCosts ? price(form.purchasePrice ?? "", "Precio de compra") : undefined,
    stock: nonNegativeInt(form.stock ?? 0, "Stock"),
    minStock: nonNegativeInt(form.minStock ?? 0, "Stock mínimo"),
  };
}

export function ProductsPage() {
  const { token } = useAuth();
  const { hasPermission } = usePermissions();
  const { success, error: toastError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState<ProductInput>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FormFields, string>>>({});
  const [saving, setSaving] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<AdminProduct | null>(null);

  const canCreate = hasPermission("products.create");
  const canEdit = hasPermission("products.edit");
  const canViewCosts = hasPermission("products.view_costs");

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [list, cats] = await Promise.all([
        fetchAdminProducts(token, { q: filter || undefined, lowStock: lowStockOnly }),
        fetchCategories(token),
      ]);
      setProducts(list);
      setCategories(cats);
    } catch (err) {
      setError(getErrorMessage(err, "Error al cargar productos"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (searchParams.get("nuevo") === "1" && canCreate) {
      openCreate();
      searchParams.delete("nuevo");
      setSearchParams(searchParams, { replace: true });
    }
    if (searchParams.get("bajo") === "1") {
      setLowStockOnly(true);
      searchParams.delete("bajo");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, canCreate]); // eslint-disable-line react-hooks/exhaustive-deps

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFieldErrors({});
    setModalOpen(true);
  };

  const openEdit = (product: AdminProduct) => {
    setEditing(product);
    setForm({
      sku: product.sku,
      name: product.name,
      description: product.description ?? "",
      categoryId: product.categoryId ?? null,
      purchasePrice: product.purchasePrice ?? "",
      salePrice: product.salePrice,
      stock: product.stock,
      minStock: product.minStock,
      isActive: product.isActive,
    });
    setFieldErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setFieldErrors({});
  };

  const validateForm = () => {
    const next = fieldRules(form, editing, canViewCosts);
    const filtered = Object.fromEntries(
      Object.entries(next).filter(([, v]) => v),
    ) as Partial<Record<FormFields, string>>;
    setFieldErrors(filtered);
    return Object.keys(filtered).length === 0;
  };

  const touchField = (field: FormFields) => {
    const msg = fieldRules(form, editing, canViewCosts)[field];
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (msg) next[field] = msg;
      else delete next[field];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!token || !validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        purchasePrice: canViewCosts ? form.purchasePrice : form.purchasePrice || form.salePrice,
      };
      if (editing) {
        await updateProduct(token, editing.id, payload);
        success("Producto actualizado");
      } else {
        await createProduct(token, payload);
        success("Producto creado");
      }
      closeModal();
      await load();
    } catch (err) {
      setFieldErrors({ name: getErrorMessage(err, "No se pudo guardar") });
    } finally {
      setSaving(false);
    }
  };

  const headers = [
    { key: "sku", header: "SKU" },
    { key: "name", header: "Nombre" },
    { key: "category", header: "Categoría" },
    ...(canViewCosts ? [{ key: "cost", header: "Costo" }] : []),
    { key: "sale", header: "Venta" },
    { key: "stock", header: "Stock" },
    { key: "status", header: "Estado" },
    ...(canEdit ? [TABLE_ACTIONS_RAIL] : []),
  ];

  const rows = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.categoryId ? categoryMap.get(p.categoryId) ?? "—" : "—",
    cost: p.purchasePrice ? `$${Number(p.purchasePrice).toFixed(2)}` : "—",
    sale: `$${Number(p.salePrice).toFixed(2)}`,
    stock: String(p.stock),
    status: p.id,
    _product: p,
  }));

  return (
    <div className="fortino-admin-page">
      <div className="fortino-page-actions">
        {canCreate && (
          <Button kind="primary" renderIcon={Add} onClick={openCreate}>
            Agregar producto
          </Button>
        )}
      </div>

      <div className="fortino-toolbar">
        <div className="fortino-toolbar-grow">
          <Search
            id="products-filter"
            labelText="Buscar productos"
            placeholder="SKU o nombre…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
        </div>
        <Checkbox
          id="low-stock-filter"
          labelText="Solo stock bajo"
          checked={lowStockOnly}
          onChange={(_, { checked }) => setLowStockOnly(checked)}
        />
        <Button kind="secondary" onClick={() => load()}>
          Buscar
        </Button>
      </div>

      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      {loading ? (
        <TableSkeleton />
      ) : products.length === 0 ? (
        <EmptyState
          title="Sin productos"
          description={
            lowStockOnly
              ? "No hay piezas con stock bajo en este momento."
              : "Agrega la primera refacción al catálogo."
          }
          actionLabel={canCreate ? "Agregar producto" : undefined}
          onAction={canCreate ? openCreate : undefined}
        />
      ) : (
        <div className="fortino-interactive-table">
        <DataTable rows={rows} headers={headers} size="md">
          {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {headers.map((h) => (
                    <TableHeader
                      {...getHeaderProps({ header: h })}
                      key={h.key}
                      className={h.key === "_rail" ? "fortino-row-actions-cell" : undefined}
                    >
                      {h.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => {
                  const product = products.find((p) => p.id === row.id)!;
                  const rowActions = canEdit
                    ? [
                        {
                          label: "Editar producto",
                          icon: Edit,
                          onClick: () => openEdit(product),
                        },
                        {
                          label: "Ajustar stock",
                          icon: InventoryManagement,
                          onClick: () => setAdjustProduct(product),
                        },
                      ]
                    : [];
                  return (
                    <InteractiveTableRow
                      key={row.id}
                      rowProps={getRowProps({ row })}
                      onOpen={canEdit ? () => openEdit(product) : undefined}
                      actions={rowActions}
                      ariaLabel={`Producto ${product.name}`}
                    >
                      {row.cells.map((cell) => {
                        if (cell.info.header === "status") {
                          return (
                            <TableCell key={cell.id}>
                              <Stack orientation="horizontal" gap={2}>
                                <StockBadge stock={product.stock} minStock={product.minStock} />
                                {!product.isActive && <Tag type="gray" size="sm">Inactivo</Tag>}
                              </Stack>
                            </TableCell>
                          );
                        }
                        if (cell.info.header === "_rail") return null;
                        if (cell.info.header === "sku" || cell.info.header === "sale" || cell.info.header === "cost") {
                          return (
                            <TableCell key={cell.id} className="mono">
                              {cell.value}
                            </TableCell>
                          );
                        }
                        if (cell.info.header === "stock") {
                          const low = product.stock <= product.minStock;
                          const out = product.stock <= 0;
                          return (
                            <TableCell key={cell.id}>
                              <span style={{ color: out ? "var(--cds-support-error)" : low ? "var(--cds-support-warning)" : undefined }}>
                                {cell.value}
                              </span>
                            </TableCell>
                          );
                        }
                        return <TableCell key={cell.id}>{cell.value}</TableCell>;
                      })}
                    </InteractiveTableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </DataTable>
        </div>
      )}

      {adjustProduct && (
        <StockAdjustModal
          product={adjustProduct}
          onClose={() => setAdjustProduct(null)}
          onSubmit={async (payload) => {
            try {
              await adjustProductStock(token!, adjustProduct.id, payload);
              success(`Stock actualizado: ${adjustProduct.sku}`);
              setAdjustProduct(null);
              await load();
            } catch (err) {
              toastError(getErrorMessage(err));
              throw err;
            }
          }}
        />
      )}

      <AppModal
        open={modalOpen}
        title={editing ? "Editar producto" : "Nuevo producto"}
        subtitle={editing ? `SKU ${editing.sku}` : "Completa los datos del catálogo"}
        size="lg"
        onClose={closeModal}
        onSubmit={handleSubmit}
        loading={saving}
      >
        <Stack gap={5}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <TextInput
              id="product-sku"
              labelText="SKU"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase().replace(/[^A-Z0-9._-]/g, "") })}
              onBlur={() => touchField("sku")}
              disabled={!!editing}
              invalid={Boolean(fieldErrors.sku)}
              invalidText={fieldErrors.sku}
              helperText="Letras, números, puntos y guiones"
              required
            />
            <TextInput
              id="product-name"
              labelText="Nombre"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: blockDigitsInName(e.target.value) })}
              onBlur={() => touchField("name")}
              invalid={Boolean(fieldErrors.name)}
              invalidText={fieldErrors.name}
              helperText="Solo letras, sin números"
              required
            />
          </div>
          <TextInput
            id="product-desc"
            labelText="Descripción"
            value={form.description ?? ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            onBlur={() => touchField("description")}
            invalid={Boolean(fieldErrors.description)}
            invalidText={fieldErrors.description}
            helperText="Opcional · máximo 500 caracteres"
          />
          <Select
            id="product-category"
            labelText="Categoría"
            value={form.categoryId ?? ""}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value || null })}
          >
            <SelectItem value="" text="Sin categoría" />
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id} text={c.name} />
            ))}
          </Select>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <NumberInput
              id="product-sale"
              label="Precio de venta"
              min={0}
              step={0.01}
              value={form.salePrice}
              onChange={(_, { value }) => setForm({ ...form, salePrice: String(value) })}
              onBlur={() => touchField("salePrice")}
              invalid={Boolean(fieldErrors.salePrice)}
              invalidText={fieldErrors.salePrice}
              required
            />
            {canViewCosts && (
              <NumberInput
                id="product-cost"
                label="Precio de compra"
                min={0}
                step={0.01}
                value={form.purchasePrice ?? ""}
                onChange={(_, { value }) => setForm({ ...form, purchasePrice: String(value) })}
                onBlur={() => touchField("purchasePrice")}
                invalid={Boolean(fieldErrors.purchasePrice)}
                invalidText={fieldErrors.purchasePrice}
              />
            )}
            <NumberInput
              id="product-stock"
              label="Stock actual"
              min={0}
              step={1}
              value={form.stock ?? 0}
              onChange={(_, { value }) => setForm({ ...form, stock: Number(value) })}
              onBlur={() => touchField("stock")}
              invalid={Boolean(fieldErrors.stock)}
              invalidText={fieldErrors.stock}
            />
            <NumberInput
              id="product-min"
              label="Stock mínimo"
              min={0}
              step={1}
              value={form.minStock ?? 0}
              onChange={(_, { value }) => setForm({ ...form, minStock: Number(value) })}
              onBlur={() => touchField("minStock")}
              invalid={Boolean(fieldErrors.minStock)}
              invalidText={fieldErrors.minStock}
            />
          </div>
          <Toggle
            id="product-active"
            labelText="Producto activo en catálogo"
            toggled={form.isActive ?? true}
            onToggle={(checked) => setForm({ ...form, isActive: checked })}
          />
        </Stack>
      </AppModal>
    </div>
  );
}
