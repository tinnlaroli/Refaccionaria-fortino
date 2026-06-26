import type { KeyboardEvent } from "react";

const NAV_KEYS = new Set([
  "Backspace",
  "Delete",
  "Tab",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  "Enter",
]);

/** Solo dígitos enteros (cadena vacía permitida). */
export function sanitizeIntegerInput(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Dígitos y un punto decimal, máximo 2 decimales. */
export function sanitizeDecimalInput(raw: string): string {
  let value = raw.replace(/,/g, ".").replace(/[^\d.]/g, "");
  const dot = value.indexOf(".");
  if (dot !== -1) {
    const whole = value.slice(0, dot);
    const fraction = value.slice(dot + 1).replace(/\./g, "").slice(0, 2);
    value = fraction.length > 0 ? `${whole}.${fraction}` : `${whole}.`;
  }
  return value;
}

export function blockInvalidNumberKeys(
  e: KeyboardEvent<HTMLInputElement>,
  mode: "integer" | "decimal",
) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (NAV_KEYS.has(e.key)) return;

  if (mode === "integer") {
    if (/^\d$/.test(e.key)) return;
    e.preventDefault();
    return;
  }

  if (/^\d$/.test(e.key)) return;
  if (e.key === "." && !e.currentTarget.value.includes(".")) return;
  e.preventDefault();
}
