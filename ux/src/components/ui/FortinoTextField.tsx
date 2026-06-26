import { Description, FieldError, Input, Label, TextField } from "@heroui/react";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  helperText?: string;
  type?: "text" | "email" | "password" | "search";
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  className?: string;
};

export function FortinoTextField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  type = "text",
  required,
  autoComplete,
  placeholder,
  className,
}: Props) {
  return (
    <TextField
      id={id}
      isRequired={required}
      isInvalid={Boolean(error)}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      type={type}
      autoComplete={autoComplete}
      className={className ?? "w-full"}
    >
      <Label>{label}</Label>
      <Input placeholder={placeholder} />
      {helperText && !error && <Description>{helperText}</Description>}
      {error && <FieldError>{error}</FieldError>}
    </TextField>
  );
}
