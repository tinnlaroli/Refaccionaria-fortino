import { Button, Card } from "@heroui/react";

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
      <Button variant="primary" onPress={onAction}>
        {actionLabel}
      </Button>
    ) : undefined);

  return (
    <Card className="fortino-empty-state">
      <Card.Header>
        <Card.Title className="fortino-heading-subsection">{title}</Card.Title>
        {description && <Card.Description className="fortino-lead">{description}</Card.Description>}
      </Card.Header>
      {resolvedAction && <Card.Footer>{resolvedAction}</Card.Footer>}
    </Card>
  );
}
