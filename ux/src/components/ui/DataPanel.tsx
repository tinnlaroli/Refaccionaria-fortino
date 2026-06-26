import type { ReactNode } from "react";
import { Card } from "@heroui/react";

type DataPanelProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  compact?: boolean;
};

export function DataPanel({
  title,
  description,
  actions,
  children,
  className = "",
  compact = false,
}: DataPanelProps) {
  return (
    <Card className={`fortino-data-panel ${compact ? "fortino-data-panel--compact" : ""} ${className}`.trim()}>
      {(title || description || actions) && (
        <Card.Header className="fortino-data-panel__head">
          <div className="fortino-data-panel__titles">
            {title && <Card.Title className="fortino-data-panel__title">{title}</Card.Title>}
            {description && (
              <Card.Description className="fortino-data-panel__desc">{description}</Card.Description>
            )}
          </div>
          {actions && <div className="fortino-data-panel__actions">{actions}</div>}
        </Card.Header>
      )}
      <Card.Content className="fortino-data-panel__body">{children}</Card.Content>
    </Card>
  );
}
