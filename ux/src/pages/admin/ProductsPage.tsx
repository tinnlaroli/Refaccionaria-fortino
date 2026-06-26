import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Button,
  Checkbox,
  Chip,
  Label,
  SearchField,
  Switch,
  Table,
} from "@heroui/react";
import { Package, Pencil, Plus, ImageIcon } from "lucide-react";
import {
  createProduct,
  fetchAdminProducts,
  updateProduct,
  adjustProductStock,
  type AdminProduct,
  type ProductInput,
} from "../../api/admin-products.js";
import { fetchCategories, type Category } from "../../api/admin-categories.js";
import { fetchBrands, type Brand } from "../../api/admin-brands.js";
import { AppModal } from "../../components/ui/AppModal.js";
import { EmptyState } from "../../components/EmptyState.js";
import { InteractiveTableRow } from "../../components/ui/InteractiveTableRow.js";
import { ErrorBanner, TableSkeleton } from "../../components/ui/PageFeedback.js";
import { DataPanel } from "../../components/ui/DataPanel.js";
import { PageToolbar, PageToolbarGroup } from "../../components/ui/PageToolbar.js";
import { FortinoDecimalField } from "../../components/ui/FortinoDecimalField.js";
import { FortinoNumberField } from "../../components/ui/FortinoNumberField.js";
import { FortinoTextField } from "../../components/ui/FortinoTextField.js";
import { StockAdjustModal } from "../../components/StockAdjustModal.js";
import { StockBadge } from "../../components/StockBadge.js";
import { MediaPickerModal } from "../../components/media/MediaPickerModal.js";
import { PRODUCT_UNITS } from "../../config/catalog.js";
import { EX } from "../../config/fieldExamples.js";
import type { MediaAsset } from "../../api/admin-media.js";
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
  price,
  salePriceAboveCost,
  sku as validateSku,
} from "../../lib/validation.js";

const SELECT_CLASS =
  "w-full rounded-lg border border-default-200 bg-background px-3 py-2 text-sm";

const emptyForm: ProductInput = {
  sku: "",
  name: "",
  description: "",
  categoryId: null,
  purchasePrice: "",
  salePrice: "",
  stock: 0,
  minStock: 0,
  unitOfMeasure: "PZA",
  brandId: null,
  presentation: "",
  vehicleCompatibility: "",
  primaryMediaId: null,
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
  const [brandList, setBrandList] = useState<Brand[]>([]);
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
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const canCreate = hasPermission("products.create");
  const canEdit = hasPermission("products.edit");
  const canViewCosts = hasPermission("products.view_costs");

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [list, cats, brandsData] = await Promise.all([
        fetchAdminProducts(token, { q: filter || undefined, lowStock: lowStockOnly }),
        fetchCategories(token),
        fetchBrands(token),
      ]);
      setProducts(list);
      setCategories(cats);
      setBrandList(brandsData);
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
    setPreviewImageUrl(null);
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
      unitOfMeasure: product.unitOfMeasure ?? "PZA",
      brandId: product.brandId ?? null,
      presentation: product.presentation ?? "",
      vehicleCompatibility: product.vehicleCompatibility ?? "",
      primaryMediaId: product.primaryMediaId ?? null,
      isActive: product.isActive,
    });
    setPreviewImageUrl(product.imageUrl ?? null);
    setFieldErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setPreviewImageUrl(null);
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
        brandId: form.brandId || null,
        presentation: form.presentation?.trim() || null,
        vehicleCompatibility: form.vehicleCompatibility?.trim() || null,
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

  return (
    <div className="fortino-admin-page">
      <PageToolbar>
        <PageToolbarGroup grow>
          <p className="m-0 text-sm text-muted">
            {products.length} producto(s) en catálogo
            {lowStockOnly ? " · filtro stock bajo" : ""}
          </p>
        </PageToolbarGroup>
        {canCreate && (
          <PageToolbarGroup>
            <Button variant="primary" onPress={openCreate}>
              <Plus size={16} />
              Agregar producto
            </Button>
          </PageToolbarGroup>
        )}
      </PageToolbar>

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
        <DataPanel title="Catálogo de productos" description="SKU, precios y existencias" compact>
          <div className="fortino-toolbar">
            <SearchField
              aria-label="Buscar productos"
              value={filter}
              onChange={setFilter}
              className="fortino-toolbar-grow"
            >
              <SearchField.Group>
                <SearchField.Input
                  id="products-filter"
                  placeholder="SKU o nombre…"
                  onKeyDown={(e) => e.key === "Enter" && load()}
                />
              </SearchField.Group>
            </SearchField>
            <Checkbox
              id="low-stock-filter"
              isSelected={lowStockOnly}
              onChange={setLowStockOnly}
            >
              Solo stock bajo
            </Checkbox>
            <Button variant="secondary" onPress={() => load()}>
              Buscar
            </Button>
          </div>
          <div className="fortino-interactive-table">
          <Table aria-label="Productos">
            <Table.ScrollContainer>
              <Table.Content>
                <Table.Header>
                  <Table.Column isRowHeader>SKU</Table.Column>
                  <Table.Column>Nombre</Table.Column>
                  <Table.Column>Marca</Table.Column>
                  <Table.Column>U.M.</Table.Column>
                  <Table.Column>Categoría</Table.Column>
                  {canViewCosts && <Table.Column>Costo</Table.Column>}
                  <Table.Column>Venta</Table.Column>
                  <Table.Column>Stock</Table.Column>
                  <Table.Column>Estado</Table.Column>
                  {canEdit && <Table.Column className="fortino-row-actions-cell" />}
                </Table.Header>
                <Table.Body>
                  {products.map((product) => {
                    const rowActions = canEdit
                      ? [
                          {
                            label: "Editar producto",
                            icon: Pencil,
                            onClick: () => openEdit(product),
                          },
                          {
                            label: "Ajustar stock",
                            icon: Package,
                            onClick: () => setAdjustProduct(product),
                          },
                        ]
                      : [];
                    const low = product.stock <= product.minStock;
                    const out = product.stock <= 0;
                    return (
                    <InteractiveTableRow
                      key={product.id}
                      id={product.id}
                      reserveActionsColumn={canEdit}
                      onOpen={canEdit ? () => openEdit(product) : undefined}
                        actions={rowActions}
                        ariaLabel={`Producto ${product.name}`}
                      >
                        <Table.Cell className="mono">{product.sku}</Table.Cell>
                        <Table.Cell>{product.name}</Table.Cell>
                        <Table.Cell>{product.brandName ?? "—"}</Table.Cell>
                        <Table.Cell className="mono">{product.unitOfMeasure ?? "PZA"}</Table.Cell>
                        <Table.Cell>
                          {product.categoryId ? categoryMap.get(product.categoryId) ?? "—" : "—"}
                        </Table.Cell>
                        {canViewCosts && (
                          <Table.Cell className="mono">
                            {product.purchasePrice
                              ? `$${Number(product.purchasePrice).toFixed(2)}`
                              : "—"}
                          </Table.Cell>
                        )}
                        <Table.Cell className="mono">
                          ${Number(product.salePrice).toFixed(2)}
                        </Table.Cell>
                        <Table.Cell>
                          <span className={out ? "fortino-text-error" : low ? "fortino-text-warning" : undefined}>
                            {product.stock}
                          </span>
                        </Table.Cell>
                        <Table.Cell>
                          <div className="flex items-center gap-2">
                            <StockBadge stock={product.stock} minStock={product.minStock} />
                            {!product.isActive && (
                              <Chip size="sm" variant="flat">
                                <Chip.Label>Inactivo</Chip.Label>
                              </Chip>
                            )}
                          </div>
                        </Table.Cell>
                      </InteractiveTableRow>
                    );
                  })}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </div>
        </DataPanel>
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
        subtitle={
          editing
            ? `Modificando ${editing.sku} · los cambios aplican de inmediato en inventario`
            : "Registra la pieza con SKU único, precios y existencias iniciales"
        }
        size="xl"
        onClose={closeModal}
        onSubmit={handleSubmit}
        loading={saving}
      >
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FortinoTextField
              id="product-sku"
              label="Código SKU"
              placeholder={EX.sku}
              value={form.sku}
              onChange={(next) =>
                setForm({ ...form, sku: next.toUpperCase().replace(/[^A-Z0-9._-]/g, "") })
              }
              onBlur={() => touchField("sku")}
              error={fieldErrors.sku}
              helperText={editing ? undefined : "Letras, números, puntos y guiones"}
              required
            />
            <FortinoTextField
              id="product-name"
              label="Nombre del producto"
              placeholder={EX.productName}
              value={form.name}
              onChange={(next) => setForm({ ...form, name: blockDigitsInName(next) })}
              onBlur={() => touchField("name")}
              error={fieldErrors.name}
              helperText="Solo letras, sin números"
              required
            />
          </div>
          <FortinoTextField
            id="product-desc"
            label="Descripción del producto"
            placeholder={EX.productDesc}
            value={form.description ?? ""}
            onChange={(next) => setForm({ ...form, description: next })}
            onBlur={() => touchField("description")}
            error={fieldErrors.description}
            helperText="Opcional · máximo 500 caracteres"
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="product-category" className="text-sm font-medium">
              Categoría
            </label>
            <select
              id="product-category"
              className={SELECT_CLASS}
              value={form.categoryId ?? ""}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value || null })}
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="product-unit" className="text-sm font-medium">
                Unidad de medida
              </label>
              <select
                id="product-unit"
                className={SELECT_CLASS}
                value={form.unitOfMeasure ?? "PZA"}
                onChange={(e) => setForm({ ...form, unitOfMeasure: e.target.value })}
              >
                {PRODUCT_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="product-brand" className="text-sm font-medium">
                Marca
              </label>
              <select
                id="product-brand"
                className={SELECT_CLASS}
                value={form.brandId ?? ""}
                onChange={(e) => setForm({ ...form, brandId: e.target.value || null })}
              >
                <option value="">Sin marca</option>
                {brandList.filter((b) => b.isActive).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <FortinoTextField
            id="product-presentation"
            label="Presentación / empaque"
            placeholder={EX.presentation}
            value={form.presentation ?? ""}
            onChange={(v) => setForm({ ...form, presentation: v })}
          />
          <FortinoTextField
            id="product-compat"
            label="Compatibilidad con vehículos"
            placeholder={EX.vehicleCompat}
            value={form.vehicleCompatibility ?? ""}
            onChange={(v) => setForm({ ...form, vehicleCompatibility: v })}
          />
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Imagen del producto</span>
            <div className="flex flex-wrap items-center gap-3">
              {previewImageUrl ? (
                <img
                  src={previewImageUrl}
                  alt=""
                  className="h-20 w-20 rounded-lg border border-border object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-border text-muted">
                  <ImageIcon size={24} aria-hidden />
                </div>
              )}
              <Button variant="secondary" size="sm" onPress={() => setMediaPickerOpen(true)}>
                Elegir de biblioteca
              </Button>
              {form.primaryMediaId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => {
                    setForm({ ...form, primaryMediaId: null });
                    setPreviewImageUrl(null);
                  }}
                >
                  Quitar
                </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FortinoDecimalField
              id="product-sale"
              label="Precio de venta (MXN)"
              placeholder={EX.salePrice}
              value={form.salePrice}
              onChange={(next) => setForm({ ...form, salePrice: next })}
              onBlur={() => touchField("salePrice")}
              error={fieldErrors.salePrice}
              required
            />
            {canViewCosts && (
              <FortinoDecimalField
                id="product-cost"
                label="Precio de compra (MXN)"
                placeholder={EX.purchasePrice}
                value={form.purchasePrice ?? ""}
                onChange={(next) => setForm({ ...form, purchasePrice: next })}
                onBlur={() => touchField("purchasePrice")}
                error={fieldErrors.purchasePrice}
              />
            )}
            <FortinoNumberField
              id="product-stock"
              label="Existencia actual (piezas)"
              placeholder={EX.stockQty}
              format="integer"
              value={form.stock ?? 0}
              onChange={(value) => setForm({ ...form, stock: value ?? 0 })}
              onBlur={() => touchField("stock")}
              minValue={0}
              error={fieldErrors.stock}
            />
            <FortinoNumberField
              id="product-min"
              label="Stock mínimo de alerta"
              placeholder={EX.minStock}
              format="integer"
              value={form.minStock ?? 0}
              onChange={(value) => setForm({ ...form, minStock: value ?? 0 })}
              onBlur={() => touchField("minStock")}
              minValue={0}
              error={fieldErrors.minStock}
            />
          </div>
          <Switch
            isSelected={form.isActive ?? true}
            onChange={(checked) => setForm({ ...form, isActive: checked })}
          >
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Content>
              <Label className="text-sm">Producto activo en catálogo</Label>
            </Switch.Content>
          </Switch>
        </div>
      </AppModal>

      <MediaPickerModal
        open={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(asset: MediaAsset) => {
          setForm((f) => ({ ...f, primaryMediaId: asset.id }));
          setPreviewImageUrl(asset.url);
        }}
      />
    </div>
  );
}
