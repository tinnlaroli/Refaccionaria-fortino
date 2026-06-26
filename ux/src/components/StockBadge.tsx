import { Chip } from "@heroui/react";

type StockBadgeProps = {
  stock: number;
  minStock: number;
};

export function StockBadge({ stock, minStock }: StockBadgeProps) {
  if (stock <= 0) {
    return (
      <Chip size="sm" color="danger" variant="flat">
        Sin stock
      </Chip>
    );
  }
  if (stock <= minStock) {
    return (
      <Chip size="sm" color="warning" variant="flat">
        Stock bajo
      </Chip>
    );
  }
  return (
    <Chip size="sm" color="success" variant="flat">
      Disponible
    </Chip>
  );
}
