import { SkeletonPlaceholder, Stack } from "@carbon/react";

export function DashboardSkeleton() {
  return (
    <Stack gap={6} className="fortino-dash-home" aria-busy="true" aria-label="Cargando panel">
      <SkeletonPlaceholder style={{ width: "100%", height: "5.5rem", borderRadius: 4 }} />
      <div className="fortino-dash-kpi-row">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonPlaceholder key={i} style={{ width: "100%", height: "7.5rem", borderRadius: 4 }} />
        ))}
      </div>
      <div className="fortino-dash-body">
        <SkeletonPlaceholder style={{ width: "100%", height: "18rem", borderRadius: 4 }} />
        <SkeletonPlaceholder style={{ width: "100%", height: "18rem", borderRadius: 4 }} />
      </div>
    </Stack>
  );
}
