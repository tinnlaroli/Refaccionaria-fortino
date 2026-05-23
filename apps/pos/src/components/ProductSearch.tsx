import { useCallback, useEffect, useRef, useState } from "react";
import { searchProductsLocal, findBySku } from "../api/products.js";
import type { Product } from "../types/index.js";

type Props = {
  onSelect: (product: Product) => void;
};

export function ProductSearch({ onSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    const product = await findBySku(trimmed);
    if (product && product.isActive) {
      onSelect(product);
      setQuery("");
      setResults([]);
      inputRef.current?.focus();
      return;
    }

    if (results.length === 1) {
      onSelect(results[0]);
      setQuery("");
      setResults([]);
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
            maxHeight: 200,
            overflow: "auto",
            border: "1px solid var(--border)",
            borderRadius: 8,
          }}
        >
          {results.slice(0, 8).map((p) => (
            <li key={p.id}>
              <button
                type="button"
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "0.6rem 0.75rem",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
                onClick={() => {
                  onSelect(p);
                  setQuery("");
                  setResults([]);
                  inputRef.current?.focus();
                }}
              >
                <span className="sku">{p.sku}</span> — {p.name}{" "}
                <span className="price">${Number(p.salePrice).toFixed(2)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
