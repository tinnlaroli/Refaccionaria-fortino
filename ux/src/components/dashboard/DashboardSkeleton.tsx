export function DashboardSkeleton() {
  return (
    <div className="dashboard-page" aria-busy="true" aria-label="Cargando panel">
      <div className="dash-hero dash-hero-skeleton">
        <div className="skeleton-line skeleton-line-lg" />
        <div className="skeleton-line skeleton-line-md" />
      </div>
      <div className="dash-metrics-primary">
        <div className="skeleton-block skeleton-block-lg" />
        <div className="skeleton-block skeleton-block-md" />
      </div>
      <div className="skeleton-grid">
        <div className="skeleton-block" />
        <div className="skeleton-block" />
        <div className="skeleton-block" />
      </div>
    </div>
  );
}
