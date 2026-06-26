import { useState } from "react";
import { Alert } from "@heroui/react";
import type { AdminProduct } from "../api/admin-products.js";
import { AppModal } from "./ui/AppModal.js";
import { EX } from "../config/fieldExamples.js";
import { FortinoNumberField } from "./ui/FortinoNumberField.js";
import { FortinoSelect } from "./ui/FortinoSelect.js";
import { FortinoTextField } from "./ui/FortinoTextField.js";
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
  const [quantity, setQuantity] = useState(1);
  const [setValue, setSetValue] = useState(product.stock);
  const [reason, setReason] = useState<StockAdjustPayload["reason"]>("entrada");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FormFields, string>>>({});

  const previewStock =
    mode === "set" ? setValue : mode === "add" ? product.stock + quantity : product.stock - quantity;

  const getErrors = (): Partial<Record<FormFields, string>> => {
    const errors: Partial<Record<FormFields, string>> = {};
    if (mode === "set") {
      const err = nonNegativeInt(setValue, "Nuevo stock");
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
    if (mode === "add") delta = quantity;
    else if (mode === "remove") delta = -quantity;
    else delta = setValue - product.stock;

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
      if (mode === "add") delta = quantity;
      else if (mode === "remove") delta = -quantity;
      else delta = setValue - product.stock;

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
      subtitle={`${product.sku} · ${product.name} · indica motivo para auditoría`}
      size="md"
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel="Confirmar ajuste"
      loading={saving}
    >
      <div className="flex flex-col gap-5">
        <p className="text-sm m-0 text-muted">
          Stock actual: <strong>{product.stock}</strong> · Mínimo: {product.minStock}
        </p>

        <FortinoSelect
          id="adjust-mode"
          label="Tipo de ajuste de inventario"
          helperText="Entrada suma piezas, salida resta, fijar establece el total exacto"
          value={mode}
          onChange={(e) => {
            setMode(e.target.value as "add" | "remove" | "set");
            setFieldErrors({});
            setFormError(null);
          }}
        >
          <option value="add">Entrada (+)</option>
          <option value="remove">Salida (−)</option>
          <option value="set">Fijar cantidad exacta</option>
        </FortinoSelect>

        {mode === "set" ? (
          <FortinoNumberField
            id="adjust-set"
            label="Existencia final deseada"
            placeholder={EX.adjustStock}
            format="integer"
            value={setValue}
            onChange={(value) => setSetValue(value ?? 0)}
            onBlur={() => touchField("setValue")}
            minValue={0}
            error={fieldErrors.setValue}
            required
          />
        ) : (
          <FortinoNumberField
            id="adjust-qty"
            label="Piezas a mover"
            placeholder={EX.adjustQty}
            format="integer"
            value={quantity}
            onChange={(value) => setQuantity(value ?? 1)}
            onBlur={() => touchField("quantity")}
            minValue={1}
            error={fieldErrors.quantity}
            required
          />
        )}

        <FortinoSelect
          id="adjust-reason"
          label="Motivo del movimiento"
          helperText="Obligatorio para trazabilidad en el historial"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value as StockAdjustPayload["reason"]);
            touchField("reason");
          }}
          onBlur={() => touchField("reason")}
          error={fieldErrors.reason}
          required
        >
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </FortinoSelect>

        <FortinoTextField
          id="adjust-note"
          label={reason === "otro" ? "Nota" : "Nota (opcional)"}
          value={note}
          onChange={setNote}
          onBlur={() => touchField("note")}
          error={fieldErrors.note}
          placeholder={EX.adjustNote}
          required={reason === "otro"}
        />

        <Alert status="accent">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Stock resultante</Alert.Title>
            <Alert.Description>
              {previewStock} unidades después del ajuste
            </Alert.Description>
          </Alert.Content>
        </Alert>

        {formError && (
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Error</Alert.Title>
              <Alert.Description>{formError}</Alert.Description>
            </Alert.Content>
          </Alert>
        )}
      </div>
    </AppModal>
  );
}
