import { InlineLoading, InlineNotification, SkeletonText } from "@carbon/react";

type ErrorBannerProps = {
  title?: string;
  message: string;
  onClose?: () => void;
};

export function ErrorBanner({ title = "Error", message, onClose }: ErrorBannerProps) {
  return (
    <InlineNotification
      kind="error"
      lowContrast
      title={title}
      subtitle={message}
      hideCloseButton={!onClose}
      onClose={onClose}
      style={{ maxWidth: "100%", marginBottom: "1rem" }}
    />
  );
}

export function PageLoading({ description = "Cargando…" }: { description?: string }) {
  return (
    <div style={{ padding: "2rem 0" }}>
      <InlineLoading description={description} />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ padding: "1rem 0" }}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonText key={i} heading={i === 0} width={i === 0 ? "30%" : `${70 - i * 8}%`} />
      ))}
    </div>
  );
}
