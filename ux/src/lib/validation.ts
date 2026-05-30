export type FieldErrors<T extends string> = Partial<Record<T, string>>;

export type Validator<T = string> = (value: T) => string | undefined;

const NAME_CHARS = /^[\p{L}\s'.-]+$/u;
const HAS_DIGIT = /\d/;
const MULTI_SPACE = /\s{2,}/;

/** Elimina dígitos mientras el usuario escribe en campos de nombre */
export function blockDigitsInName(value: string): string {
  return value.replace(/\d/g, "");
}

/** Normaliza espacios múltiples en nombres */
export function normalizeSpaces(value: string): string {
  return value.replace(/\s{2,}/g, " ");
}

export function required(value: string, label = "Este campo"): string | undefined {
  if (!value?.trim()) return `${label} es obligatorio`;
  return undefined;
}

export function email(value: string): string | undefined {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return "El correo es obligatorio";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Ingresa un correo válido";
  }
  if (/\s/.test(value)) return "El correo no puede contener espacios";
  return undefined;
}

export function minLength(value: string, min: number, label = "Este campo"): string | undefined {
  if (value.length < min) {
    return `${label} debe tener al menos ${min} caracteres`;
  }
  return undefined;
}

export function sku(value: string): string | undefined {
  const trimmed = value.trim();
  const req = required(trimmed, "El SKU");
  if (req) return req;
  if (!/^[A-Za-z0-9._-]+$/.test(trimmed)) {
    return "SKU: solo letras, números, puntos, guiones y guion bajo";
  }
  if (trimmed.length > 64) return "SKU demasiado largo (máx. 64)";
  return undefined;
}

export function slug(value: string): string | undefined {
  const trimmed = value.trim();
  const req = required(trimmed, "El identificador web");
  if (req) return req;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmed)) {
    return "Identificador: minúsculas, números y guiones (ej. filtros-aceite)";
  }
  return undefined;
}

export function price(value: string | number, label = "Precio"): string | undefined {
  const num = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (Number.isNaN(num)) return `${label} inválido`;
  if (num < 0) return `${label} no puede ser negativo`;
  if (num > 999_999_999) return `${label} demasiado alto`;
  const raw = String(value).replace(",", ".");
  if (/\.\d{3,}$/.test(raw)) return `${label} admite máximo 2 decimales`;
  return undefined;
}

export function nonNegativeInt(value: number, label = "Cantidad"): string | undefined {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    return `${label} debe ser un número entero`;
  }
  if (value < 0) return `${label} no puede ser negativa`;
  return undefined;
}

export function positiveInt(value: string | number, label = "Cantidad"): string | undefined {
  const trimmed = String(value).trim();
  if (!trimmed) return `${label} es obligatorio`;
  const num = Number(trimmed);
  if (Number.isNaN(num) || !Number.isInteger(num)) {
    return `${label} debe ser un número entero`;
  }
  if (num <= 0) return `${label} debe ser mayor a cero`;
  return undefined;
}

export function positiveAmount(value: string, label = "Monto"): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return `${label} es obligatorio`;
  const num = Number(trimmed.replace(",", "."));
  if (Number.isNaN(num)) return `${label} inválido`;
  if (num <= 0) return `${label} debe ser mayor a cero`;
  return undefined;
}

export function cashReceived(value: string, minimum: number): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "Indica el monto recibido";
  const num = Number(trimmed.replace(",", "."));
  if (Number.isNaN(num)) return "Monto inválido";
  if (num < minimum) {
    return `El monto debe ser al menos $${minimum.toFixed(2)}`;
  }
  return undefined;
}

export function password(value: string): string | undefined {
  const trimmed = value.trim();
  const req = required(trimmed, "La contraseña");
  if (req) return req;
  if (trimmed.length < 6) return "La contraseña debe tener al menos 6 caracteres";
  if (/\s/.test(value)) return "La contraseña no puede contener espacios";
  return undefined;
}

export function nameField(value: string, label = "Nombre"): string | undefined {
  const trimmed = value.trim();
  const req = required(trimmed, label);
  if (req) return req;
  if (trimmed.length < 2) return `${label} debe tener al menos 2 caracteres`;
  if (trimmed.length > 120) return `${label} no puede superar 120 caracteres`;
  if (HAS_DIGIT.test(trimmed)) return `${label} no puede contener números`;
  if (MULTI_SPACE.test(trimmed)) return `${label} no puede tener espacios dobles`;
  if (!NAME_CHARS.test(trimmed)) {
    return `${label} solo puede incluir letras, espacios, apóstrofes, puntos y guiones`;
  }
  return undefined;
}

export function description(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > 500) return "La descripción no puede superar 500 caracteres";
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(trimmed)) {
    return "La descripción contiene caracteres no permitidos";
  }
  return undefined;
}

export function combine(...checks: Array<string | undefined>): string | undefined {
  return checks.find(Boolean);
}

export function maxLength(value: string, max: number, label = "Este campo"): string | undefined {
  if (value.length > max) return `${label} no puede superar ${max} caracteres`;
  return undefined;
}

export function optionalNote(value: string, max = 500): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return maxLength(trimmed, max, "La nota");
}

export function requiredNoteForReason(
  reason: string,
  note: string,
  reasonValue = "otro",
): string | undefined {
  if (reason !== reasonValue) return undefined;
  return required(note.trim(), "La nota");
}

export function salePriceAboveCost(
  salePrice: string | number,
  purchasePrice: string | number | undefined | null,
): string | undefined {
  if (!purchasePrice) return undefined;
  const sale = typeof salePrice === "number" ? salePrice : Number(String(salePrice).replace(",", "."));
  const cost =
    typeof purchasePrice === "number"
      ? purchasePrice
      : Number(String(purchasePrice).replace(",", "."));
  if (Number.isNaN(sale) || Number.isNaN(cost) || cost <= 0) return undefined;
  if (sale < cost) return "El precio de venta no debería ser menor al costo";
  return undefined;
}

export function validateFields<T extends string>(
  values: Record<T, unknown>,
  rules: Partial<Record<T, Validator>>,
): FieldErrors<T> {
  const errors: FieldErrors<T> = {};
  for (const key of Object.keys(rules) as T[]) {
    const rule = rules[key];
    if (!rule) continue;
    const msg = rule(values[key] as never);
    if (msg) errors[key] = msg;
  }
  return errors;
}
