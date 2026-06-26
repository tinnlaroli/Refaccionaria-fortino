export type HorizontalBarPoint = {
  label: string;
  value: number;
  sublabel?: string;
};

type HorizontalBarChartProps = {
  title: string;
  subtitle?: string;
  points: HorizontalBarPoint[];
  formatValue?: (value: number) => string;
  valuePrefix?: string;
  emptyMessage?: string;
};

export function HorizontalBarChart({
  title,
  subtitle,
  points,
  formatValue,
  valuePrefix = "",
  emptyMessage = "Sin datos en el periodo",
}: HorizontalBarChartProps) {
  const max = Math.max(...points.map((p) => p.value), 1);
  const fmt = formatValue ?? ((v: number) => `${valuePrefix}${v.toLocaleString("es-MX")}`);

  return (
    <figure className="fortino-hbar-chart" aria-label={title}>
      <figcaption className="fortino-chart-caption">
        <strong>{title}</strong>
        {subtitle && <span>{subtitle}</span>}
      </figcaption>
      {points.length === 0 ? (
        <p className="fortino-chart-empty">{emptyMessage}</p>
      ) : (
        <ol className="fortino-hbar-chart__list">
          {points.map((point, index) => {
            const width = Math.max(4, Math.round((point.value / max) * 100));
            return (
              <li key={`${point.label}-${index}`} className="fortino-hbar-chart__row">
                <div className="fortino-hbar-chart__meta">
                  <span className="fortino-hbar-chart__rank">{index + 1}</span>
                  <span className="fortino-hbar-chart__label" title={point.label}>
                    {point.label}
                  </span>
                  <strong className="fortino-hbar-chart__value">{fmt(point.value)}</strong>
                </div>
                <div className="fortino-hbar-chart__track" aria-hidden>
                  <div className="fortino-hbar-chart__fill" style={{ width: `${width}%` }} />
                </div>
                {point.sublabel && (
                  <span className="fortino-hbar-chart__sublabel">{point.sublabel}</span>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </figure>
  );
}
