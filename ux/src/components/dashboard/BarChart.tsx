export type BarChartPoint = {
  label: string;
  value: number;
};

type BarChartProps = {
  title: string;
  subtitle?: string;
  points: BarChartPoint[];
  valuePrefix?: string;
  formatValue?: (value: number) => string;
};

export function BarChart({
  title,
  subtitle,
  points,
  valuePrefix = "",
  formatValue,
}: BarChartProps) {
  const max = Math.max(...points.map((p) => p.value), 1);
  const fmt = formatValue ?? ((v: number) => `${valuePrefix}${v.toLocaleString("es-MX")}`);

  return (
    <figure className="fortino-bar-chart" aria-label={title}>
      <figcaption className="fortino-chart-caption">
        <strong>{title}</strong>
        {subtitle && <span>{subtitle}</span>}
      </figcaption>
      <div className="fortino-bar-chart__plot" role="img" aria-hidden>
        {points.map((point) => {
          const height = Math.max(6, Math.round((point.value / max) * 100));
          return (
            <div key={point.label} className="fortino-bar-chart__col">
              <div className="fortino-bar-chart__bar-wrap">
                <div
                  className="fortino-bar-chart__bar"
                  style={{ height: `${height}%` }}
                  title={`${point.label}: ${fmt(point.value)}`}
                />
              </div>
              <span className="fortino-bar-chart__label">{point.label}</span>
              <span className="fortino-bar-chart__value">{fmt(point.value)}</span>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
