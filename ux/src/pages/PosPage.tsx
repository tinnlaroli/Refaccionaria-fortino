import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Chip } from "@heroui/react";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext.js";
import { useToast } from "../context/ToastContext.js";
import { useShiftStatus } from "../hooks/useShiftStatus.js";
import { ProductSearch, type ProductSearchHandle } from "../components/ProductSearch.js";
import { CheckoutModal } from "../components/CheckoutModal.js";
import { AppModal } from "../components/ui/AppModal.js";

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
            <Chip color="accent" size="sm">
              <Chip.Label>
                {itemCount} pieza{itemCount !== 1 ? "s" : ""}
              </Chip.Label>
            </Chip>
          )}
        </div>

        {lines.length === 0 ? (
          <div className="fortino-pos-empty">
            <ShoppingCart size={40} aria-hidden className="fortino-pos-empty-icon" />
            <h3 className="fortino-heading-subsection">Carrito vacío</h3>
            <p className="fortino-lead">
              Escanea un código de barras o busca una pieza para comenzar la venta.
            </p>
            <p className="fortino-pos-kbd-hint fortino-caption">
              <kbd>F2</kbd> buscar · <kbd>F9</kbd> cobrar
            </p>
          </div>
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
                    <span className="fortino-cart-line-unit fortino-caption">
                      ${line.unitPrice.toFixed(2)} c/u
                      {nearMax && (
                        <Chip color="danger" size="sm" className="fortino-cart-stock-tag">
                          <Chip.Label>máx. {line.maxStock}</Chip.Label>
                        </Chip>
                      )}
                    </span>
                  </div>

                  <div className="fortino-cart-qty">
                    <Button
                      variant="ghost"
                      isIconOnly
                      aria-label="Disminuir cantidad"
                      onPress={() => handleQty(line.sku, line.quantity - 1)}
                    >
                      <Minus size={18} />
                    </Button>
                    <span className="fortino-cart-qty-value mono">{line.quantity}</span>
                    <Button
                      variant="ghost"
                      isIconOnly
                      aria-label="Aumentar cantidad"
                      isDisabled={nearMax}
                      onPress={() => handleQty(line.sku, line.quantity + 1, line.maxStock)}
                    >
                      <Plus size={18} />
                    </Button>
                  </div>

                  <span className="fortino-cart-line-total price">${lineTotal.toFixed(2)}</span>

                  <Button
                    variant="ghost"
                    isIconOnly
                    aria-label="Quitar del carrito"
                    className="fortino-cart-remove"
                    onPress={() => removeLine(line.sku)}
                  >
                    <Trash2 size={18} />
                  </Button>
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
              <span className="fortino-caption">Subtotal</span>
              <span className="fortino-pos-subtotal price">${subtotal.toFixed(2)}</span>
            </div>
            <div className="fortino-pos-total-row fortino-pos-total-row--grand">
              <span>Total a cobrar</span>
              <span className="fortino-pos-grand-total price">${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="fortino-pos-checkout-actions">
            <Button
              variant="primary"
              size="lg"
              className="fortino-pos-pay-btn"
              isDisabled={lines.length === 0 || shiftLoading || hasShift === false}
              onPress={openCheckout}
            >
              Cobrar ${total.toFixed(2)}
            </Button>
            {hasShift === false && !shiftLoading && (
              <p className="fortino-caption fortino-text-warning" style={{ margin: 0 }}>
                Abre turno en Caja para habilitar cobro
              </p>
            )}
            <span className="fortino-pos-kbd-hint fortino-caption">
              Atajo: <kbd>F9</kbd>
            </span>
            <Button
              variant="tertiary"
              isDisabled={lines.length === 0}
              onPress={() => setClearConfirmOpen(true)}
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
        subtitle="Esta acción no se puede deshacer · el ticket quedará en cero"
        onClose={() => setClearConfirmOpen(false)}
        onSubmit={handleClear}
        submitLabel="Vaciar"
        danger
        size="sm"
      >
        <p className="text-sm m-0">
          ¿Confirmas que deseas eliminar {itemCount} pieza{itemCount !== 1 ? "s" : ""} del carrito?
        </p>
      </AppModal>
    </div>
  );
}
