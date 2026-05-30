import { Button, Tile } from "@carbon/react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title,
  description,
  action,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const resolvedAction =
    action ??
    (actionLabel && onAction ? (
      <Button kind="primary" onClick={onAction}>
        {actionLabel}
      </Button>
    ) : undefined);

  return (
    <Tile className="fortino-empty-state">
      <h3 className="fortino-heading-subsection">{title}</h3>
      {description && <p className="fortino-lead">{description}</p>}
      {resolvedAction}
    </Tile>
  );
}
