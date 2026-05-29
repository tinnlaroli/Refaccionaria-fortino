import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  step?: string;
  actions?: ReactNode;
};

export function PageHeader({ title, description, step, actions }: Props) {
  return (
    <header className="page-header">
      <div className="page-header-text">
        {step && <span className="page-step">{step}</span>}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}
