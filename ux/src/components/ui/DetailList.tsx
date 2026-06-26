import type { ReactNode } from "react";

export type DetailItem = {
  label: string;
  value: ReactNode;
};

type Props = {
  items: DetailItem[];
  className?: string;
};

export function DetailList({ items, className }: Props) {
  return (
    <dl className={`fortino-detail-list ${className ?? ""}`.trim()}>
      {items.map((item) => (
        <div key={item.label} className="fortino-detail-list__row">
          <dt className="fortino-detail-list__label">{item.label}</dt>
          <dd className="fortino-detail-list__value">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
