export type DonutSegment = {
  label: string;
  value: number;
  color: string;
};

type DonutChartProps = {
  title: string;
  subtitle?: string;
  segments: DonutSegment[];
  centerLabel?: string;
  centerValue?: string | number;
};

export function DonutChart({
  title,
  subtitle,
  segments,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  let cursor = 0;
  const gradientStops = segments
    .map((segment) => {
      const start = (cursor / total) * 100;
      cursor += segment.value;
      const end = (cursor / total) * 100;
      return `${segment.color} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <figure className="fortino-donut-chart" aria-label={title}>
      <figcaption className="fortino-chart-caption">
        <strong>{title}</strong>
        {subtitle && <span>{subtitle}</span>}
      </figcaption>
      <div className="fortino-donut-chart__body">
        <div
          className="fortino-donut-chart__ring"
          style={{ background: `conic-gradient(${gradientStops})` }}
          role="img"
          aria-hidden
        >
          <div className="fortino-donut-chart__hole">
            {centerLabel && <span className="fortino-donut-chart__center-label">{centerLabel}</span>}
            {centerValue !== undefined && (
              <strong className="fortino-donut-chart__center-value">{centerValue}</strong>
            )}
          </div>
        </div>
        <ul className="fortino-donut-chart__legend">
          {segments.map((segment) => (
            <li key={segment.label}>
              <span className="fortino-donut-chart__swatch" style={{ background: segment.color }} />
              <span className="fortino-donut-chart__legend-label">{segment.label}</span>
              <strong className="fortino-donut-chart__legend-value">
                {segment.value.toLocaleString("es-MX")}
              </strong>
              <span className="fortino-donut-chart__legend-pct">
                {Math.round((segment.value / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </figure>
  );
}
