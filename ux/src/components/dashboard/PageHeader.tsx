type Props = {
  title: string;
  description?: string;
  step?: string;
  actions?: React.ReactNode;
};

export function PageHeader({ title, description, step, actions }: Props) {
  return (
    <header className="mb-4 flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        {step && <span className="fortino-page-step">{step}</span>}
        <h2 className="fortino-heading-section m-0">{title}</h2>
        {description && <p className="fortino-lead m-0">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </header>
  );
}
