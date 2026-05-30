import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Button, Search, Tag } from "@carbon/react";
import { Barcode, Search as SearchIcon } from "@carbon/icons-react";
import { searchProductsLocal, findBySku } from "../api/products.js";
import { StockBadge } from "./StockBadge.js";
import { useToast } from "../context/ToastContext.js";
import type { Product } from "../types/index.js";

export type ProductSearchHandle = {
  focus: () => void;
};

type Props = {
  onSelect: (product: Product) => void;
};

export const ProductSearch = forwardRef<ProductSearchHandle, Props>(function ProductSearch(
  { onSelect },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const { error: toastError } = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  const search = useCallback(async (q: string) => {
    const list = await searchProductsLocal(q);
    setResults(list);
    setHighlightIndex(-1);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 150);
    return () => clearTimeout(t);
  }, [query, search]);

  const availableResults = results.filter((p) => p.isActive && p.stock > 0);
  const visibleResults = results.slice(0, 8);

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
    setHighlightIndex(-1);
    inputRef.current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    if (highlightIndex >= 0 && visibleResults[highlightIndex]) {
      trySelect(visibleResults[highlightIndex]);
      return;
    }

    const product = await findBySku(trimmed);
    if (product) {
      trySelect(product);
      return;
    }

    if (availableResults.length === 1) {
      trySelect(availableResults[0]);
    } else if (results.length > 0 && availableResults.length === 0) {
      toastError("Ningún resultado tiene stock disponible");
    } else if (results.length === 0) {
      toastError("No se encontró ningún producto con ese SKU o nombre");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!query || visibleResults.length === 0) {
      if (e.key === "Escape") {
        setQuery("");
        setResults([]);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, visibleResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      e.preventDefault();
      setQuery("");
      setResults([]);
      setHighlightIndex(-1);
    }
  };

  useEffect(() => {
    if (highlightIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[highlightIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex]);

  return (
    <div className="fortino-pos-search">
      <form className="fortino-pos-search-form" onSubmit={handleSubmit}>
        <Search
          ref={inputRef}
          id="pos-product-search"
          labelText="Buscar producto"
          placeholder="Escanear SKU o buscar pieza… (F2)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          size="lg"
          autoComplete="off"
        />
        <Button type="submit" kind="primary" size="lg">
          Agregar
        </Button>
      </form>

      <p className="fortino-pos-search-hint cds--label">
        <Barcode size={14} aria-hidden />
        Escanea y presiona Enter · ↑↓ para navegar resultados
      </p>

      {visibleResults.length > 0 && query && (
        <ul className="fortino-search-results" ref={listRef} role="listbox">
          {visibleResults.map((p, index) => {
            const unavailable = !p.isActive || p.stock <= 0;
            const highlighted = index === highlightIndex;
            return (
              <li key={p.id} role="option" aria-selected={highlighted}>
                <button
                  type="button"
                  className={`fortino-search-result${highlighted ? " fortino-search-result--active" : ""}${unavailable ? " fortino-search-result--disabled" : ""}`}
                  disabled={unavailable}
                  onClick={() => trySelect(p)}
                  onMouseEnter={() => setHighlightIndex(index)}
                >
                  <span className="fortino-search-result-main">
                    <Tag type="gray" size="sm" className="sku">
                      {p.sku}
                    </Tag>
                    <span className="fortino-search-result-name">{p.name}</span>
                  </span>
                  <span className="fortino-search-result-meta">
                    <StockBadge stock={p.stock} minStock={p.minStock} />
                    <span className="fortino-search-result-price price">
                      ${Number(p.salePrice).toFixed(2)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {query && results.length === 0 && (
        <div className="fortino-search-empty">
          <SearchIcon size={20} aria-hidden />
          <span>Sin coincidencias para «{query}»</span>
        </div>
      )}
    </div>
  );
});
