import { useCallback, useEffect, useRef, useState } from "react";
import { searchProductsLocal, findBySku } from "../api/products.js";
import { StockBadge } from "./StockBadge.js";
import { useToast } from "../context/ToastContext.js";
import type { Product } from "../types/index.js";

type Props = {
  onSelect: (product: Product) => void;
};

export function ProductSearch({ onSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { error: toastError } = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);

  const search = useCallback(async (q: string) => {
    const list = await searchProductsLocal(q);
    setResults(list);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 150);
    return () => clearTimeout(t);
  }, [query, search]);

  const trySelect = (product: Product) => {
    if (!product.isActive) {
      toastError("Producto inactivo en catálogo");
      return;
    }
    if (product.stock <= 0) {
      toastError(`${product.sku} sin stock disponible`);
      return;
    }
    onSelect(product);
    setQuery("");
    setResults([]);
    inputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    const product = await findBySku(trimmed);
    if (product) {
      trySelect(product);
      return;
    }

    const available = results.filter((p) => p.isActive && p.stock > 0);
    if (available.length === 1) {
      trySelect(available[0]);
    } else if (results.length > 0 && available.length === 0) {
      toastError("Ningún resultado tiene stock disponible");
    }
  };

  return (
    <div>
      <form className="search-bar" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Escanear SKU o buscar pieza..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
        <button type="submit" className="btn-primary">
          Agregar
        </button>
      </form>
      {results.length > 0 && query && (
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            maxHeight: 240,
            overflow: "auto",
            border: "1px solid var(--border)",
            borderRadius: 8,
          }}
        >
          {results.slice(0, 8).map((p) => {
            const unavailable = !p.isActive || p.stock <= 0;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  className="search-result-item"
                  disabled={unavailable}
                  onClick={() => trySelect(p)}
                >
                  <span>
                    <span className="sku">{p.sku}</span> — {p.name}
                  </span>
                  <span className="search-result-meta">
                    <StockBadge stock={p.stock} minStock={p.minStock} />
                    <span className="price">${Number(p.salePrice).toFixed(2)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
