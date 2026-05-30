import { z } from "zod";

/** Letras (incl. acentos), espacios, apóstrofe, punto y guion — sin dígitos */
const NAME_CHARS = /^[\p{L}\s'.-]+$/u;
const HAS_DIGIT = /\d/;
const MULTI_SPACE = /\s{2,}/;
const SKU_PATTERN = /^[A-Za-z0-9._-]+$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function trimStr(value) {
  return typeof value === "string" ? value.trim() : value;
}

function parseMoney(value) {
  const num = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return num;
}

export function validateName(value, label = "Nombre", { min = 2, max = 120 } = {}) {
  const trimmed = trimStr(value);
  if (!trimmed) return `${label} es obligatorio`;
  if (trimmed.length < min) return `${label} debe tener al menos ${min} caracteres`;
  if (trimmed.length > max) return `${label} no puede superar ${max} caracteres`;
  if (HAS_DIGIT.test(trimmed)) return `${label} no puede contener números`;
  if (MULTI_SPACE.test(trimmed)) return `${label} no puede tener espacios dobles`;
  if (!NAME_CHARS.test(trimmed)) {
    return `${label} solo puede incluir letras, espacios, apóstrofes, puntos y guiones`;
  }
  return null;
}

export function validateSku(value) {
  const trimmed = trimStr(value);
  if (!trimmed) return "El SKU es obligatorio";
  if (trimmed.length > 64) return "SKU demasiado largo (máx. 64)";
  if (!SKU_PATTERN.test(trimmed)) {
    return "SKU: solo letras, números, puntos, guiones y guion bajo";
  }
  return null;
}

export function validateSlug(value) {
  const trimmed = trimStr(value);
  if (!trimmed) return "El identificador web es obligatorio";
  if (!SLUG_PATTERN.test(trimmed)) {
    return "Identificador: minúsculas, números y guiones (ej. filtros-aceite)";
  }
  return null;
}

export function validateDescription(value) {
  if (value == null || value === "") return null;
  const trimmed = String(value).trim();
  if (trimmed.length > 500) return "La descripción no puede superar 500 caracteres";
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(trimmed)) {
    return "La descripción contiene caracteres no permitidos";
  }
  return null;
}

export function validatePassword(value) {
  const trimmed = trimStr(value);
  if (!trimmed) return "La contraseña es obligatoria";
  if (trimmed.length < 6) return "La contraseña debe tener al menos 6 caracteres";
  if (/\s/.test(trimmed)) return "La contraseña no puede contener espacios";
  return null;
}

export function validateMoney(value, label = "Precio") {
  const num = parseMoney(value);
  if (Number.isNaN(num)) return `${label} inválido`;
  if (num < 0) return `${label} no puede ser negativo`;
  if (num > 999_999_999) return `${label} demasiado alto`;
  const raw = String(value).replace(",", ".");
  if (/\.\d{3,}$/.test(raw)) return `${label} admite máximo 2 decimales`;
  return null;
}

export function validateNonNegativeInt(value, label = "Cantidad") {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || !Number.isInteger(num)) {
    return `${label} debe ser un número entero`;
  }
  if (num < 0) return `${label} no puede ser negativa`;
  return null;
}

export function nameZod(label = "Nombre", opts) {
  return z
    .string()
    .trim()
    .superRefine((val, ctx) => {
      const err = validateName(val, label, opts);
      if (err) ctx.addIssue({ code: z.ZodIssueCode.custom, message: err });
    });
}

export function skuZod() {
  return z.string().superRefine((val, ctx) => {
    const err = validateSku(val);
    if (err) ctx.addIssue({ code: z.ZodIssueCode.custom, message: err });
  });
}

export function slugZod() {
  return z.string().superRefine((val, ctx) => {
    const err = validateSlug(val);
    if (err) ctx.addIssue({ code: z.ZodIssueCode.custom, message: err });
  });
}

export function descriptionZod() {
  return z
    .string()
    .optional()
    .superRefine((val, ctx) => {
      const err = validateDescription(val ?? "");
      if (err) ctx.addIssue({ code: z.ZodIssueCode.custom, message: err });
    });
}

export function passwordZod() {
  return z.string().superRefine((val, ctx) => {
    const err = validatePassword(val);
    if (err) ctx.addIssue({ code: z.ZodIssueCode.custom, message: err });
  });
}

export function moneyZod(label = "Precio") {
  return z.union([z.string(), z.number()]).superRefine((val, ctx) => {
    const err = validateMoney(val, label);
    if (err) ctx.addIssue({ code: z.ZodIssueCode.custom, message: err });
  });
}

export function nonNegativeIntZod(label = "Cantidad") {
  return z.number().int().superRefine((val, ctx) => {
    const err = validateNonNegativeInt(val, label);
    if (err) ctx.addIssue({ code: z.ZodIssueCode.custom, message: err });
  });
}

export function formatZodError(error) {
  const fieldErrors = error.flatten().fieldErrors;
  const first = Object.values(fieldErrors).flat().find(Boolean);
  return first ?? "Datos inválidos";
}
