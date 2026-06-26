import { Description, FieldError, Label, NumberField } from "@heroui/react";
import { blockInvalidNumberKeys, sanitizeDecimalInput, sanitizeIntegerInput } from "../../lib/numberInput.js";

type Format = "integer" | "decimal";

type Props = {
  id: string;
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  onBlur?: () => void;
  error?: string;
  helperText?: string;
  format?: Format;
  minValue?: number;
  maxValue?: number;
  step?: number;
  required?: boolean;
  placeholder?: string;
  className?: string;
};

export function FortinoNumberField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  format = "decimal",
  minValue,
  maxValue,
  step,
  required,
  placeholder,
  className,
}: Props) {
  const resolvedStep = step ?? (format === "integer" ? 1 : 0.01);

  return (
    <NumberField
      id={id}
      fullWidth
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      minValue={minValue}
      maxValue={maxValue}
      step={resolvedStep}
      isInvalid={Boolean(error)}
      isRequired={required}
      className={`fortino-number-field w-full ${className ?? ""}`.trim()}
    >
      <Label>{label}</Label>
      <NumberField.Group className="fortino-number-field__group">
        <NumberField.Input
          className="fortino-number-field__input"
          placeholder={placeholder}
          inputMode={format === "integer" ? "numeric" : "decimal"}
          onKeyDown={(e) => blockInvalidNumberKeys(e, format)}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData("text");
            const clean =
              format === "integer" ? sanitizeIntegerInput(pasted) : sanitizeDecimalInput(pasted);
            if (!clean) return;
            const num = Number(clean);
            if (!Number.isNaN(num)) onChange(num);
          }}
        />
      </NumberField.Group>
      {helperText && !error && <Description>{helperText}</Description>}
      {error && <FieldError>{error}</FieldError>}
    </NumberField>
  );
}
