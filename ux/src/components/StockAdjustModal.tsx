import { useState } from "react";
import {
  InlineNotification,
  NumberInput,
  Select,
  SelectItem,
  Stack,
  TextInput,
} from "@carbon/react";
import type { AdminProduct } from "../api/admin-products.js";
import { AppModal } from "./carbon/AppModal.js";
import {
  combine,
  nonNegativeInt,
  optionalNote,
  positiveInt,
  required,
  requiredNoteForReason,
} from "../lib/validation.js";

const REASONS = [
  { value: "entrada", label: "Entrada de mercancía" },
  { value: "devolucion", label: "Devolución de cliente" },
  { value: "merma", label: "Merma / daño" },
  { value: "conteo", label: "Ajuste por conteo" },
  { value: "otro", label: "Otro" },
] as const;

export type StockAdjustPayload = {
  delta: number;
  reason: (typeof REASONS)[number]["value"];
  note?: string;
};

type FormFields = "quantity" | "setValue" | "reason" | "note";

type Props = {
  product: AdminProduct;
  onClose: () => void;
  onSubmit: (payload: StockAdjustPayload) => Promise<void>;
};

export function StockAdjustModal({ product, onClose, onSubmit }: Props) {
  const [mode, setMode] = useState<"add" | "remove" | "set">("add");
  const [quantity, setQuantity] = useState<string | number>(1);
  const [setValue, setSetValue] = useState<string | number>(product.stock);
  const [reason, setReason] = useState<StockAdjustPayload["reason"]>("entrada");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FormFields, string>>>({});

  const qtyNum = Number(quantity) || 0;
  const setNum = Number(setValue) || 0;
  const previewStock =
    mode === "set" ? setNum : mode === "add" ? product.stock + qtyNum : product.stock - qtyNum;

  const getErrors = (): Partial<Record<FormFields, string>> => {
    const errors: Partial<Record<FormFields, string>> = {};
    if (mode === "set") {
      const err = nonNegativeInt(setNum, "Nuevo stock");
      if (err) errors.setValue = err;
    } else {
      const err = positiveInt(quantity, "Cantidad");
      if (err) errors.quantity = err;
    }
    const reasonErr = required(reason, "El motivo");
    if (reasonErr) errors.reason = reasonErr;
    const noteErr = combine(
      optionalNote(note),
      requiredNoteForReason(reason, note),
    );
    if (noteErr) errors.note = noteErr;
    return errors;
  };

  const validate = () => {
    const next = getErrors();
    setFieldErrors(next);
    if (Object.keys(next).length > 0) return false;

    let delta = 0;
    if (mode === "add") delta = qtyNum;
    else if (mode === "remove") delta = -qtyNum;
    else delta = setNum - product.stock;

    if (delta === 0) {
      setFormError("No hay cambio en el stock");
      return false;
    }
    if (previewStock < 0) {
      setFormError("El stock no puede quedar negativo");
      return false;
    }
    setFormError(null);
    return true;
  };

  const touchField = (field: FormFields) => {
    const msg = getErrors()[field];
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (msg) next[field] = msg;
      else delete next[field];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      let delta = 0;
      if (mode === "add") delta = qtyNum;
      else if (mode === "remove") delta = -qtyNum;
      else delta = setNum - product.stock;

      await onSubmit({ delta, reason, note: note.trim() || undefined });
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo ajustar el stock");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppModal
      open
      title="Ajustar inventario"
      subtitle={`${product.sku} — ${product.name}`}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel="Confirmar ajuste"
      loading={saving}
    >
      <Stack gap={5}>
        <p className="cds--body-compact-01" style={{ margin: 0, color: "var(--cds-text-secondary)" }}>
          Stock actual: <strong>{product.stock}</strong> · Mínimo: {product.minStock}
        </p>

        <Select
          id="adjust-mode"
          labelText="Tipo de movimiento"
          value={mode}
          onChange={(e) => {
            setMode(e.target.value as "add" | "remove" | "set");
            setFieldErrors({});
            setFormError(null);
          }}
        >
          <SelectItem value="add" text="Entrada (+)" />
          <SelectItem value="remove" text="Salida (−)" />
          <SelectItem value="set" text="Fijar cantidad exacta" />
        </Select>

        {mode === "set" ? (
          <NumberInput
            id="adjust-set"
            label="Nuevo stock"
            min={0}
            step={1}
            value={setValue}
            onChange={(_, { value }) => setSetValue(value)}
            onBlur={() => touchField("setValue")}
            invalid={Boolean(fieldErrors.setValue)}
            invalidText={fieldErrors.setValue}
            required
          />
        ) : (
          <NumberInput
            id="adjust-qty"
            label="Cantidad"
            min={1}
            step={1}
            value={quantity}
            onChange={(_, { value }) => setQuantity(value)}
            onBlur={() => touchField("quantity")}
            invalid={Boolean(fieldErrors.quantity)}
            invalidText={fieldErrors.quantity}
            required
          />
        )}

        <Select
          id="adjust-reason"
          labelText="Motivo"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value as StockAdjustPayload["reason"]);
            touchField("reason");
          }}
          onBlur={() => touchField("reason")}
          invalid={Boolean(fieldErrors.reason)}
          invalidText={fieldErrors.reason}
          required
        >
          {REASONS.map((r) => (
            <SelectItem key={r.value} value={r.value} text={r.label} />
          ))}
        </Select>

        <TextInput
          id="adjust-note"
          labelText={reason === "otro" ? "Nota" : "Nota (opcional)"}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => touchField("note")}
          invalid={Boolean(fieldErrors.note)}
          invalidText={fieldErrors.note}
          placeholder="Ej. llegada de proveedor, conteo mensual…"
          required={reason === "otro"}
        />

        <InlineNotification
          kind="info"
          title="Stock resultante"
          subtitle={`${previewStock} unidades después del ajuste`}
          lowContrast
          hideCloseButton
        />

        {formError && (
          <InlineNotification kind="error" title="Error" subtitle={formError} lowContrast hideCloseButton />
        )}
      </Stack>
    </AppModal>
  );
}
