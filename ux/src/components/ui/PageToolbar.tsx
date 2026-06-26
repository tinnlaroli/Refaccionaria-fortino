import type { ReactNode } from "react";

type PageToolbarProps = {
  children: ReactNode;
  className?: string;
};

export function PageToolbar({ children, className = "" }: PageToolbarProps) {
  return <div className={`fortino-page-toolbar ${className}`.trim()}>{children}</div>;
}

type PageToolbarGroupProps = {
  children: ReactNode;
  grow?: boolean;
};

export function PageToolbarGroup({ children, grow }: PageToolbarGroupProps) {
  return (
    <div className={grow ? "fortino-page-toolbar__grow" : "fortino-page-toolbar__group"}>
      {children}
    </div>
  );
}

type PageStatStripProps = {
  label: string;
  value: ReactNode;
};

export function PageStatStrip({ label, value }: PageStatStripProps) {
  return (
    <div className="fortino-page-stat-strip">
      <span className="fortino-page-stat-strip__label">{label}</span>
      <strong className="fortino-page-stat-strip__value">{value}</strong>
    </div>
  );
}
