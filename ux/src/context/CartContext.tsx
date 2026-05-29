import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartLine, Product } from "../types/index.js";

type CartContextValue = {
  lines: CartLine[];
  subtotal: number;
  total: number;
  itemCount: number;
  addProduct: (product: Product, qty?: number) => string | null;
  updateQty: (sku: string, quantity: number, maxStock?: number) => string | null;
  removeLine: (sku: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const addProduct = useCallback((product: Product, qty = 1): string | null => {
    if (!product.isActive) return "Producto inactivo";
    if (product.stock <= 0) return "Sin stock disponible";

    let error: string | null = null;
    const price = Number(product.salePrice);
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.sku === product.sku);
      const currentQty = idx >= 0 ? prev[idx].quantity : 0;
      const nextQty = currentQty + qty;
      if (nextQty > product.stock) {
        error = `Stock insuficiente (máx. ${product.stock})`;
        return prev;
      }
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: nextQty };
        return next;
      }
      return [
        ...prev,
        {
          productId: product.id,
          sku: product.sku,
          productName: product.name,
          unitPrice: price,
          quantity: qty,
          maxStock: product.stock,
        },
      ];
    });
    return error;
  }, []);

  const updateQty = useCallback((sku: string, quantity: number, maxStock?: number): string | null => {
    if (quantity <= 0) {
      setLines((prev) => prev.filter((l) => l.sku !== sku));
      return null;
    }
    let error: string | null = null;
    setLines((prev) => {
      const line = prev.find((l) => l.sku === sku);
      const limit = maxStock ?? line?.maxStock;
      if (limit !== undefined && quantity > limit) {
        error = `Stock insuficiente (máx. ${limit})`;
        return prev;
      }
      return prev.map((l) =>
        l.sku === sku ? { ...l, quantity, maxStock: limit ?? l.maxStock } : l,
      );
    });
    return error;
  }, []);

  const removeLine = useCallback((sku: string) => {
    setLines((prev) => prev.filter((l) => l.sku !== sku));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
    [lines],
  );

  const value = useMemo(
    () => ({
      lines,
      subtotal,
      total: subtotal,
      itemCount: lines.reduce((s, l) => s + l.quantity, 0),
      addProduct,
      updateQty,
      removeLine,
      clear,
    }),
    [lines, subtotal, addProduct, updateQty, removeLine, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
