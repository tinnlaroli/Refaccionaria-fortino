import { useState } from "react";
import { useCart } from "../context/CartContext.js";
import { useToast } from "../context/ToastContext.js";
import { ProductSearch } from "../components/ProductSearch.js";
import { CheckoutModal } from "../components/CheckoutModal.js";

export function PosPage() {
  const { lines, subtotal, total, itemCount, addProduct, updateQty, removeLine, clear } =
    useCart();
  const { success, error: toastError } = useToast();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const handleAdd = (product: Parameters<typeof addProduct>[0]) => {
    const err = addProduct(product);
    if (err) toastError(err);
  };

  const handleQty = (sku: string, quantity: number, maxStock?: number) => {
    const err = updateQty(sku, quantity, maxStock);
    if (err) toastError(err);
  };

  return (
    <div className="pos-layout">
      <section className="panel">
        <ProductSearch onSelect={handleAdd} />
        <ul className="cart-lines">
          {lines.length === 0 && (
            <li style={{ color: "var(--text-muted)", padding: "2rem 0" }}>
              Escanea un código o busca una pieza para agregar al carrito.
            </li>
          )}
          {lines.map((line) => (
            <li key={line.sku} className="cart-line">
              <div>
                <div className="sku">{line.sku}</div>
                <div>{line.productName}</div>
              </div>
              <div className="qty-control">
                <button
                  type="button"
                  onClick={() => handleQty(line.sku, line.quantity - 1)}
                  aria-label="Menos"
                >
                  −
                </button>
                <span className="mono">{line.quantity}</span>
                <button
                  type="button"
                  onClick={() => handleQty(line.sku, line.quantity + 1, line.maxStock)}
                  aria-label="Más"
                >
                  +
                </button>
              </div>
              <span className="price mono">
                ${(line.unitPrice * line.quantity).toFixed(2)}
              </span>
              <button
                type="button"
                className="btn-ghost"
                style={{ padding: "0.25rem 0.5rem" }}
                onClick={() => removeLine(line.sku)}
                aria-label="Quitar"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </section>

      <aside className="panel panel-checkout">
        <h2 style={{ margin: 0 }}>Cobro</h2>
        <p style={{ color: "var(--text-muted)", margin: 0 }}>
          {itemCount} pieza(s) en carrito
        </p>
        <div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Subtotal</div>
          <div className="checkout-total price">${subtotal.toFixed(2)}</div>
        </div>
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <button
            type="button"
            className="btn-primary"
            style={{ padding: "0.85rem" }}
            disabled={lines.length === 0}
            onClick={() => setCheckoutOpen(true)}
          >
            Cobrar
          </button>
          <button
            type="button"
            className="btn-ghost"
            disabled={lines.length === 0}
            onClick={() => clear()}
          >
            Vaciar carrito
          </button>
        </div>
      </aside>

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={() => success("Venta registrada")}
      />    </div>
  );
}
