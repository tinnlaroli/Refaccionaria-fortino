import { Stack } from "@carbon/react";

type Props = {
  title: string;
  description?: string;
  step?: string;
  actions?: React.ReactNode;
};

export function PageHeader({ title, description, step, actions }: Props) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "1rem",
        marginBottom: "1rem",
      }}
    >
      <Stack gap={2}>
        {step && (
          <span className="cds--label" style={{ color: "var(--cds-link-primary)" }}>
            {step}
          </span>
        )}
        <h2 className="cds--productive-heading-03" style={{ margin: 0 }}>
          {title}
        </h2>
        {description && (
          <p className="cds--body-compact-01" style={{ margin: 0, color: "var(--cds-text-secondary)" }}>
            {description}
          </p>
        )}
      </Stack>
      {actions && <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>{actions}</div>}
    </header>
  );
}
