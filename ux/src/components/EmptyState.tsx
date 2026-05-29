type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
