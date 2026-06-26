import { Skeleton } from "@heroui/react";



export function DashboardSkeleton() {

  return (

    <div className="fortino-dash-home flex flex-col gap-6" aria-busy="true" aria-label="Cargando panel">

      <Skeleton className="h-[9rem] w-full rounded-2xl" />

      <div className="fortino-dash-kpi-row">

        {Array.from({ length: 6 }).map((_, i) => (

          <Skeleton key={i} className="h-[8.5rem] w-full rounded-xl" />

        ))}

      </div>

      <div className="fortino-dash-analytics">

        <Skeleton className="h-[20rem] w-full rounded-xl" />

        <Skeleton className="h-[20rem] w-full rounded-xl" />

      </div>

      <div className="fortino-dash-body">

        <Skeleton className="h-[16rem] w-full rounded-xl" />

        <Skeleton className="h-[16rem] w-full rounded-xl" />

      </div>

    </div>

  );

}

