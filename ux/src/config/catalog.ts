export const PRODUCT_UNITS = [
  { value: "PZA", label: "Pieza (PZA)" },
  { value: "PAR", label: "Par (PAR)" },
  { value: "JGO", label: "Juego (JGO)" },
  { value: "LT", label: "Litro (LT)" },
  { value: "ML", label: "Mililitro (ML)" },
  { value: "KG", label: "Kilogramo (KG)" },
  { value: "CAJA", label: "Caja (CAJA)" },
  { value: "ROLLO", label: "Rollo (ROLLO)" },
] as const;

export type ProductUnit = (typeof PRODUCT_UNITS)[number]["value"];
