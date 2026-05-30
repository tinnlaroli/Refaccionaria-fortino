import { useEffect, useMemo, useState } from "react";
import {
  Button,
  ContentSwitcher,
  InlineNotification,
  NumberInput,
  Stack,
  Switch,
} from "@carbon/react";
import { useAuth } from "../context/AuthContext.js";
import { useCart } from "../context/CartContext.js";
import { useShiftStatus } from "../hooks/useShiftStatus.js";
import { useOnline } from "../hooks/useOnline.js";
import { getCachedShift } from "../api/cash.js";
import { createSaleOnline, queueSaleOffline } from "../api/sales.js";
import { getErrorMessage } from "../lib/errors.js";
import { cashReceived } from "../lib/validation.js";
import { AppModal } from "./carbon/AppModal.js";
import { ReceiptModal, type ReceiptData } from "./ReceiptModal.js";

type PaymentMethod = "cash" | "card" | "transfer";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const PAYMENTS: Array<{ index: number; value: PaymentMethod; label: string }> = [
  { index: 0, value: "cash", label: "Efectivo" },
  { index: 1, value: "card", label: "Tarjeta" },
  { index: 2, value: "transfer", label: "Transferencia" },
];

function suggestCashAmounts(total: number): number[] {
  const amounts = new Set<number>([total]);
  for (const bill of [20, 50, 100, 200, 500, 1000]) {
    if (bill >= total) amounts.add(bill);
  }
  const round50 = Math.ceil(total / 50) * 50;
  if (round50 >= total) amounts.add(round50);
  const round100 = Math.ceil(total / 100) * 100;
  if (round100 >= total) amounts.add(round100);
  return [...amounts].sort((a, b) => a - b).slice(0, 6);
}

export function CheckoutModal({ open, onClose, onSuccess }: Props) {
  const { token, sync } = useAuth();
  const { lines, total, clear } = useCart();
  const online = useOnline();
  const { hasShift, loading: shiftLoading } = useShiftStatus();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentIndex, setPaymentIndex] = useState(0);
  const [amountReceived, setAmountReceived] = useState<string | number>("");
  const [amountError, setAmountError] = useState<string | undefined>();
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const paymentMethod = PAYMENTS[paymentIndex]?.value ?? "cash";
  const cashSuggestions = useMemo(() => suggestCashAmounts(total), [total]);

  const change = useMemo(() => {
    if (paymentMethod !== "cash") return null;
    const received = Number(amountReceived);
    if (!received || Number.isNaN(received)) return null;
    return Math.max(0, received - total);
  }, [paymentMethod, amountReceived, total]);

  const canConfirm =
    lines.length > 0 &&
    hasShift === true &&
    (paymentMethod !== "cash" ||
      (Number(amountReceived) >= total && !Number.isNaN(Number(amountReceived))));

  useEffect(() => {
    if (!open) return;
    setPaymentIndex(0);
    setAmountReceived("");
    setAmountError(undefined);
    setError(null);
  }, [open]);

  if (receipt) {
    return (
      <ReceiptModal
        receipt={receipt}
        onClose={() => setReceipt(null)}
      />
    );
  }

  const handleConfirm = async () => {
    if (lines.length === 0) {
      setError("El carrito está vacío");
      return;
    }

    if (paymentMethod === "cash") {
      const err = cashReceived(String(amountReceived), total);
      if (err) {
        setAmountError(err);
        return;
      }
    } else if (total <= 0) {
      setError("El total debe ser mayor a cero");
      return;
    }

    if (!canConfirm) return;

    const shift = await getCachedShift();
    if (!shift?.shiftId) {
      setError("Abre un turno de caja en Caja antes de cobrar.");
      return;
    }

    setLoading(true);
    setError(null);

    const clientUuid = crypto.randomUUID();
    const soldAt = new Date().toISOString();
    const snapshotItems = [...lines];
    const received = paymentMethod === "cash" ? Number(amountReceived) : undefined;

    try {
      let saleId: string | undefined;
      if (online && token) {
        const result = await createSaleOnline(token, {
          clientUuid,
          shiftId: shift.shiftId,
          soldAt,
          paymentMethod,
          amountReceived: received,
          items: snapshotItems,
        });
        saleId = result.id;
        await sync();
      } else {
        await queueSaleOffline({
          clientUuid,
          shiftId: shift.shiftId,
          soldAt,
          paymentMethod,
          amountReceived: received,
          items: snapshotItems,
        });
      }

      clear();
      onSuccess();
      onClose();
      setAmountReceived("");
      setPaymentIndex(0);
      setReceipt({
        id: saleId,
        clientUuid,
        soldAt,
        paymentMethod,
        amountReceived: received,
        items: snapshotItems,
        total,
      });
    } catch (e) {
      setError(getErrorMessage(e, "Error al registrar la venta"));
    } finally {
      setLoading(false);
    }
  };

  const setCashAmount = (amount: number) => {
    setAmountReceived(amount);
    setAmountError(cashReceived(String(amount), total));
  };

  return (
    <AppModal
      open={open}
      title="Confirmar cobro"
      subtitle={`${lines.length} artículo(s)${!online ? " · se guardará offline" : ""}`}
      onClose={onClose}
      onSubmit={handleConfirm}
      submitLabel="Cobrar"
      submitDisabled={!canConfirm}
      loading={loading}
    >
      <Stack gap={5}>
        <div className="fortino-checkout-amount">
          <span className="cds--label">Total</span>
          <p className="fortino-checkout-total price">${total.toFixed(2)} MXN</p>
        </div>

        <ContentSwitcher
          selectedIndex={paymentIndex}
          onChange={({ index }) => setPaymentIndex(Number(index ?? 0))}
        >
          {PAYMENTS.map((p) => (
            <Switch key={p.value} name={p.value} text={p.label} />
          ))}
        </ContentSwitcher>

        {paymentMethod === "cash" && (
          <Stack gap={4}>
            <div className="fortino-cash-quick">
              <span className="cds--label">Monto rápido</span>
              <div className="fortino-cash-quick-btns">
                {cashSuggestions.map((amount) => (
                  <Button
                    key={amount}
                    kind={Number(amountReceived) === amount ? "primary" : "tertiary"}
                    size="sm"
                    onClick={() => setCashAmount(amount)}
                  >
                    {amount === total ? "Exacto" : `$${amount}`}
                  </Button>
                ))}
              </div>
            </div>

            <NumberInput
              id="checkout-amount"
              label="Monto recibido"
              min={total}
              step={0.01}
              value={amountReceived}
              onChange={(_, { value }) => {
                setAmountReceived(value);
                if (value) setAmountError(cashReceived(String(value), total));
                else setAmountError("Indica el monto recibido");
              }}
              onBlur={() => {
                if (!amountReceived) setAmountError("Indica el monto recibido");
                else setAmountError(cashReceived(String(amountReceived), total));
              }}
              invalid={Boolean(amountError)}
              invalidText={amountError}
            />

            {change != null && Number(amountReceived) >= total && (
              <div className="fortino-checkout-change">
                <span>Cambio</span>
                <strong className="price">${change.toFixed(2)}</strong>
              </div>
            )}
          </Stack>
        )}

        {(!shiftLoading && hasShift === false) && (
          <InlineNotification
            kind="warning"
            lowContrast
            title="Turno de caja requerido"
            subtitle="Ve a Caja y abre turno antes de registrar la venta."
            hideCloseButton
          />
        )}

        {error && (
          <InlineNotification kind="error" lowContrast title="No se pudo cobrar" subtitle={error} hideCloseButton />
        )}
      </Stack>
    </AppModal>
  );
}
