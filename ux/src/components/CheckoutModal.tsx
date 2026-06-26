import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Tabs,
} from "@heroui/react";
import { useAuth } from "../context/AuthContext.js";
import { useCart } from "../context/CartContext.js";
import { useShiftStatus } from "../hooks/useShiftStatus.js";
import { useOnline } from "../hooks/useOnline.js";
import { getCachedShift } from "../api/cash.js";
import { createSaleOnline, queueSaleOffline } from "../api/sales.js";
import { getErrorMessage } from "../lib/errors.js";
import { cashReceived } from "../lib/validation.js";
import { uuid } from "../lib/uuid.js";
import { AppModal } from "./ui/AppModal.js";
import { EX } from "../config/fieldExamples.js";
import { FortinoNumberField } from "./ui/FortinoNumberField.js";
import { ReceiptModal, type ReceiptData } from "./ReceiptModal.js";

type PaymentMethod = "cash" | "card" | "transfer";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const PAYMENTS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "cash", label: "Efectivo" },
  { value: "card", label: "Tarjeta" },
  { value: "transfer", label: "Transferencia" },
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [amountReceived, setAmountReceived] = useState<number | undefined>();
  const [amountError, setAmountError] = useState<string | undefined>();
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const cashSuggestions = useMemo(() => suggestCashAmounts(total), [total]);

  const change = useMemo(() => {
    if (paymentMethod !== "cash") return null;
    if (amountReceived == null || Number.isNaN(amountReceived)) return null;
    return Math.max(0, amountReceived - total);
  }, [paymentMethod, amountReceived, total]);

  const canConfirm =
    lines.length > 0 &&
    hasShift === true &&
    (paymentMethod !== "cash" ||
      (amountReceived != null && amountReceived >= total && !Number.isNaN(amountReceived)));

  useEffect(() => {
    if (!open) return;
    setPaymentMethod("cash");
    setAmountReceived(undefined);
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
      const err = cashReceived(String(amountReceived ?? ""), total);
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

    const clientUuid = uuid();
    const soldAt = new Date().toISOString();
    const snapshotItems = [...lines];
    const received = paymentMethod === "cash" ? amountReceived : undefined;

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
      setAmountReceived(undefined);
      setPaymentMethod("cash");
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
      subtitle={`${lines.length} artículo(s) en el ticket${!online ? " · se guardará sin conexión" : ""}`}
      size="md"
      onClose={onClose}
      onSubmit={handleConfirm}
      submitLabel="Cobrar"
      submitDisabled={!canConfirm}
      loading={loading}
    >
      <div className="flex flex-col gap-5">
        <div className="fortino-checkout-amount">
          <span className="fortino-caption">Total</span>
          <p className="fortino-checkout-total price">${total.toFixed(2)} MXN</p>
        </div>

        <Tabs
          selectedKey={paymentMethod}
          onSelectionChange={(key) => setPaymentMethod(key as PaymentMethod)}
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="Forma de pago">
              {PAYMENTS.map((p) => (
                <Tabs.Tab key={p.value} id={p.value}>
                  {p.label}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>

        {paymentMethod === "cash" && (
          <div className="flex flex-col gap-4">
            <div className="fortino-cash-quick">
              <span className="fortino-caption">Monto rápido</span>
              <div className="fortino-cash-quick-btns">
                {cashSuggestions.map((amount) => (
                  <Button
                    key={amount}
                    variant={amountReceived === amount ? "primary" : "tertiary"}
                    size="sm"
                    onPress={() => setCashAmount(amount)}
                  >
                    {amount === total ? "Exacto" : `$${amount}`}
                  </Button>
                ))}
              </div>
            </div>

            <FortinoNumberField
              id="checkout-amount"
              label="Efectivo recibido del cliente (MXN)"
              placeholder={EX.checkoutAmount}
              value={amountReceived}
              onChange={(value) => {
                setAmountReceived(value);
                if (value != null) setAmountError(cashReceived(String(value), total));
                else setAmountError("Indica el monto recibido");
              }}
              onBlur={() => {
                if (amountReceived == null) setAmountError("Indica el monto recibido");
                else setAmountError(cashReceived(String(amountReceived), total));
              }}
              minValue={total}
              step={0.01}
              error={amountError}
              required
            />

            {change != null && amountReceived != null && amountReceived >= total && (
              <div className="fortino-checkout-change">
                <span>Cambio</span>
                <strong className="price">${change.toFixed(2)}</strong>
              </div>
            )}
          </div>
        )}

        {!shiftLoading && hasShift === false && (
          <Alert status="warning">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Turno de caja requerido</Alert.Title>
              <Alert.Description>
                Ve a Caja y abre turno antes de registrar la venta.
              </Alert.Description>
            </Alert.Content>
          </Alert>
        )}

        {error && (
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>No se pudo cobrar</Alert.Title>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Content>
          </Alert>
        )}
      </div>
    </AppModal>
  );
}
