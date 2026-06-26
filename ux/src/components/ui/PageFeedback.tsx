import { Alert, Skeleton, Spinner } from "@heroui/react";

type ErrorBannerProps = {
  title?: string;
  message: string;
  onClose?: () => void;
};

export function ErrorBanner({ title = "Error", message, onClose }: ErrorBannerProps) {
  return (
    <Alert status="danger" className="mb-4 max-w-full">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{title}</Alert.Title>
        <Alert.Description>{message}</Alert.Description>
        {onClose && (
          <button
            type="button"
            className="mt-2 text-sm underline"
            onClick={onClose}
          >
            Cerrar
          </button>
        )}
      </Alert.Content>
    </Alert>
  );
}

export function PageLoading({ description = "Cargando…" }: { description?: string }) {
  return (
    <div className="flex items-center gap-3 py-8">
      <Spinner size="md" />
      <span className="text-sm text-default-500">{description}</span>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3 py-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          className={i === 0 ? "h-6 w-[30%]" : "h-4"}
          style={i === 0 ? undefined : { width: `${Math.max(40, 70 - i * 8)}%` }}
        />
      ))}
    </div>
  );
}
