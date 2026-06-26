import type { ReactNode, SelectHTMLAttributes } from "react";

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  id: string;
  label: string;
  error?: string;
  helperText?: string;
  children: ReactNode;
};

export function FortinoSelect({
  id,
  label,
  error,
  helperText,
  children,
  className,
  ...rest
}: Props) {
  return (
    <div className="fortino-field">
      <label htmlFor={id} className="fortino-field-label">
        {label}
      </label>
      <select
        id={id}
        className={`fortino-select${error ? " fortino-select--invalid" : ""}${className ? ` ${className}` : ""}`}
        aria-invalid={Boolean(error)}
        {...rest}
      >
        {children}
      </select>
      {helperText && !error && <p className="fortino-field-helper">{helperText}</p>}
      {error && <p className="fortino-field-error">{error}</p>}
    </div>
  );
}
