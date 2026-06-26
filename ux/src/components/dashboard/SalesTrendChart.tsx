export type SalesTrendPoint = {
  label: string;
  total: number;
  count: number;
};

type SalesTrendChartProps = {
  title: string;
  subtitle?: string;
  points: SalesTrendPoint[];
};

function formatMoney(v: number) {
  return v.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
}

export function SalesTrendChart({ title, subtitle, points }: SalesTrendChartProps) {
  const maxTotal = Math.max(...points.map((p) => p.total), 1);
  const maxCount = Math.max(...points.map((p) => p.count), 1);
  const weekTotal = points.reduce((s, p) => s + p.total, 0);
  const weekCount = points.reduce((s, p) => s + p.count, 0);

  return (
    <figure className="fortino-sales-trend" aria-label={title}>
      <figcaption className="fortino-chart-caption fortino-sales-trend__caption">
        <div>
          <strong>{title}</strong>
          {subtitle && <span>{subtitle}</span>}
        </div>
        <div className="fortino-sales-trend__summary">
          <span>
            <strong>{formatMoney(weekTotal)}</strong>
            <small>7 días</small>
          </span>
          <span>
            <strong>{weekCount}</strong>
            <small>operaciones</small>
          </span>
        </div>
      </figcaption>

      <div className="fortino-sales-trend__plot" role="img" aria-hidden>
        {points.map((point) => {
          const height = Math.max(6, Math.round((point.total / maxTotal) * 100));
          const dotScale = point.count > 0 ? Math.max(20, Math.round((point.count / maxCount) * 100)) : 0;
          return (
            <div key={point.label} className="fortino-sales-trend__col">
              <div className="fortino-sales-trend__bar-wrap">
                <div
                  className="fortino-sales-trend__bar"
                  style={{ height: `${height}%` }}
                  title={`${point.label}: ${formatMoney(point.total)} · ${point.count} ventas`}
                />
                {point.count > 0 && (
                  <span
                    className="fortino-sales-trend__dot"
                    style={{ bottom: `calc(${height}% + 4px)` }}
                    title={`${point.count} operaciones`}
                  />
                )}
              </div>
              <span className="fortino-sales-trend__label">{point.label}</span>
              <span className="fortino-sales-trend__value">{formatMoney(point.total)}</span>
              <span className="fortino-sales-trend__count">{point.count} ops</span>
            </div>
          );
        })}
      </div>

      <div className="fortino-sales-trend__legend">
        <span>
          <i className="fortino-sales-trend__swatch fortino-sales-trend__swatch--bar" />
          Ingresos
        </span>
        <span>
          <i className="fortino-sales-trend__swatch fortino-sales-trend__swatch--dot" />
          Operaciones
        </span>
      </div>
    </figure>
  );
}
