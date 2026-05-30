import { useCallback, useEffect, useRef, useState } from "react";
import { Button, IconButton, Tag, Tile } from "@carbon/react";
import { Add, ShoppingCart, Subtract, TrashCan } from "@carbon/icons-react";
import { useCart } from "../context/CartContext.js";
import { useToast } from "../context/ToastContext.js";
import { useShiftStatus } from "../hooks/useShiftStatus.js";
import { ProductSearch, type ProductSearchHandle } from "../components/ProductSearch.js";
import { CheckoutModal } from "../components/CheckoutModal.js";
import { AppModal } from "../components/carbon/AppModal.js";

export function PosPage() {
  const { lines, subtotal, total, itemCount, addProduct, updateQty, removeLine, clear } =
    useCart();
  const { success, error: toastError } = useToast();
  const { hasShift, loading: shiftLoading } = useShiftStatus();
  const searchRef = useRef<ProductSearchHandle>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [lastAddedSku, setLastAddedSku] = useState<string | null>(null);

  const handleAdd = useCallback(
    (product: Parameters<typeof addProduct>[0]) => {
      const err = addProduct(product);
      if (err) {
        toastError(err);
        return;
      }
      setLastAddedSku(product.sku);
      window.setTimeout(() => setLastAddedSku((s) => (s === product.sku ? null : s)), 1200);
    },
    [addProduct, toastError],
  );

  const handleQty = (sku: string, quantity: number, maxStock?: number) => {
    const err = updateQty(sku, quantity, maxStock);
    if (err) toastError(err);
  };

  const openCheckout = useCallback(() => {
    if (lines.length === 0) return;
    if (hasShift === false) {
      toastError("Abre un turno de caja en Caja antes de cobrar.");
      return;
    }
    setCheckoutOpen(true);
  }, [lines.length, hasShift, toastError]);

  const handleClear = () => {
    clear();
    setClearConfirmOpen(false);
    searchRef.current?.focus();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if (e.key === "F2") {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      if (typing) return;

      if (e.key === "F9" && lines.length > 0) {
        e.preventDefault();
        openCheckout();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lines.length, openCheckout]);

  return (
    <div className="fortino-pos-layout">
      <section className="fortino-pos-main">
        <ProductSearch ref={searchRef} onSelect={handleAdd} />

        <div className="fortino-pos-cart-header">
          <h2 className="fortino-pos-cart-title">Carrito</h2>
          {itemCount > 0 && (
            <Tag type="blue" size="sm">
              {itemCount} pieza{itemCount !== 1 ? "s" : ""}
            </Tag>
          )}
        </div>

        {lines.length === 0 ? (
          <Tile className="fortino-pos-empty">
            <ShoppingCart size={40} aria-hidden className="fortino-pos-empty-icon" />
            <h3 className="fortino-heading-subsection">Carrito vacío</h3>
            <p className="fortino-lead">
              Escanea un código de barras o busca una pieza para comenzar la venta.
            </p>
            <p className="fortino-pos-kbd-hint cds--label">
              <kbd>F2</kbd> buscar · <kbd>F9</kbd> cobrar
            </p>
          </Tile>
        ) : (
          <ul className="fortino-cart-lines">
            {lines.map((line) => {
              const lineTotal = line.unitPrice * line.quantity;
              const nearMax = line.maxStock != null && line.quantity >= line.maxStock;
              return (
                <li
                  key={line.sku}
                  className={`fortino-cart-line${lastAddedSku === line.sku ? " fortino-cart-line--flash" : ""}`}
                >
                  <div className="fortino-cart-line-info">
                    <span className="fortino-cart-line-sku sku">{line.sku}</span>
                    <span className="fortino-cart-line-name">{line.productName}</span>
                    <span className="fortino-cart-line-unit cds--label">
                      ${line.unitPrice.toFixed(2)} c/u
                      {nearMax && (
                        <Tag type="red" size="sm" className="fortino-cart-stock-tag">
                          máx. {line.maxStock}
                        </Tag>
                      )}
                    </span>
                  </div>

                  <div className="fortino-cart-qty">
                    <IconButton
                      kind="ghost"
                      size="md"
                      label="Disminuir cantidad"
                      onClick={() => handleQty(line.sku, line.quantity - 1)}
                    >
                      <Subtract size={18} />
                    </IconButton>
                    <span className="fortino-cart-qty-value mono">{line.quantity}</span>
                    <IconButton
                      kind="ghost"
                      size="md"
                      label="Aumentar cantidad"
                      disabled={nearMax}
                      onClick={() => handleQty(line.sku, line.quantity + 1, line.maxStock)}
                    >
                      <Add size={18} />
                    </IconButton>
                  </div>

                  <span className="fortino-cart-line-total price">${lineTotal.toFixed(2)}</span>

                  <IconButton
                    kind="ghost"
                    size="md"
                    label="Quitar del carrito"
                    className="fortino-cart-remove"
                    onClick={() => removeLine(line.sku)}
                  >
                    <TrashCan size={18} />
                  </IconButton>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <aside className="fortino-pos-checkout">
        <div className="fortino-pos-checkout-inner">
          <header className="fortino-pos-checkout-head">
            <h2 className="fortino-heading-section">Cobro</h2>
            <p className="fortino-caption">
              {itemCount > 0
                ? `${lines.length} línea${lines.length !== 1 ? "s" : ""} · ${itemCount} pieza${itemCount !== 1 ? "s" : ""}`
                : "Agrega piezas para cobrar"}
            </p>
          </header>

          <div className="fortino-pos-totals">
            <div className="fortino-pos-total-row">
              <span className="cds--label">Subtotal</span>
              <span className="fortino-pos-subtotal price">${subtotal.toFixed(2)}</span>
            </div>
            <div className="fortino-pos-total-row fortino-pos-total-row--grand">
              <span>Total a cobrar</span>
              <span className="fortino-pos-grand-total price">${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="fortino-pos-checkout-actions">
            <Button
              kind="primary"
              size="lg"
              className="fortino-pos-pay-btn"
              disabled={lines.length === 0 || shiftLoading || hasShift === false}
              onClick={openCheckout}
            >
              Cobrar ${total.toFixed(2)}
            </Button>
            {hasShift === false && !shiftLoading && (
              <p className="fortino-caption fortino-text-warning" style={{ margin: 0 }}>
                Abre turno en Caja para habilitar cobro
              </p>
            )}
            <span className="fortino-pos-kbd-hint cds--label">
              Atajo: <kbd>F9</kbd>
            </span>
            <Button
              kind="tertiary"
              disabled={lines.length === 0}
              onClick={() => setClearConfirmOpen(true)}
            >
              Vaciar carrito
            </Button>
          </div>
        </div>
      </aside>

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={() => {
          success("Venta registrada");
          searchRef.current?.focus();
        }}
      />

      <AppModal
        open={clearConfirmOpen}
        title="Vaciar carrito"
        subtitle="Se quitarán todas las piezas del ticket actual."
        onClose={() => setClearConfirmOpen(false)}
        onSubmit={handleClear}
        submitLabel="Vaciar"
        danger
        size="xs"
      >
        <p className="cds--body-compact-01" style={{ margin: 0 }}>
          ¿Confirmas que deseas eliminar {itemCount} pieza{itemCount !== 1 ? "s" : ""} del carrito?
        </p>
      </AppModal>
    </div>
  );
}
