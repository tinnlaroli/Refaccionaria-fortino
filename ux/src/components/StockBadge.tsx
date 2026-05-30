type StockBadgeProps = {
  stock: number;
  minStock: number;
};

export function StockBadge({ stock, minStock }: StockBadgeProps) {
  if (stock <= 0) {
    return (
      <span className="fortino-badge fortino-badge--error cds--tag cds--tag--sm">
        Sin stock
      </span>
    );
  }
  if (stock <= minStock) {
    return (
      <span className="fortino-badge fortino-badge--warning cds--tag cds--tag--sm">
        Stock bajo
      </span>
    );
  }
  return (
    <span className="fortino-badge fortino-badge--success cds--tag cds--tag--sm">
      Disponible
    </span>
  );
}
