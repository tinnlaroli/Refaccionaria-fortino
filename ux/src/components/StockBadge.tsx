type StockBadgeProps = {
  stock: number;
  minStock: number;
};

export function StockBadge({ stock, minStock }: StockBadgeProps) {
  if (stock <= 0) {
    return <span className="badge badge-danger">Sin stock</span>;
  }
  if (stock <= minStock) {
    return <span className="badge badge-warning">Stock bajo</span>;
  }
  return <span className="badge badge-ok">Disponible</span>;
}
