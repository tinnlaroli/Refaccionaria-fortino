import {
  blockInvalidNumberKeys,
  sanitizeDecimalInput,
  sanitizeIntegerInput,
} from "../../lib/numberInput.js";

type Format = "integer" | "decimal";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  helperText?: string;
  format?: Format;
  required?: boolean;
  placeholder?: string;
  className?: string;
};

export function FortinoDecimalField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  format = "decimal",
  required,
  placeholder,
  className,
}: Props) {
  const sanitize = format === "integer" ? sanitizeIntegerInput : sanitizeDecimalInput;

  return (
    <div className={`fortino-field ${className ?? ""}`.trim()}>
      <label htmlFor={id} className="fortino-field-label">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode={format === "integer" ? "numeric" : "decimal"}
        autoComplete="off"
        spellCheck={false}
        className={`fortino-number-input${error ? " fortino-number-input--invalid" : ""}`}
        value={value}
        placeholder={placeholder}
        required={required}
        aria-invalid={Boolean(error)}
        onChange={(e) => onChange(sanitize(e.target.value))}
        onKeyDown={(e) => blockInvalidNumberKeys(e, format)}
        onPaste={(e) => {
          e.preventDefault();
          const pasted = e.clipboardData.getData("text");
          onChange(sanitize(pasted));
        }}
        onBlur={onBlur}
      />
      {helperText && !error && <p className="fortino-field-helper">{helperText}</p>}
      {error && <p className="fortino-field-error">{error}</p>}
    </div>
  );
}
