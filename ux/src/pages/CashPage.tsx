import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Form,
  Table,
} from "@heroui/react";
import { useAuth } from "../context/AuthContext.js";
import { useToast } from "../context/ToastContext.js";
import {
  closeShift,
  getCachedShift,
  getCurrentShift,
  getShiftSummary,
  openShift,
  registerMovement,
  type ShiftSummary,
} from "../api/cash.js";
import type { CashShift } from "../types/index.js";
import { useOnline } from "../hooks/useOnline.js";
import { getErrorMessage } from "../lib/errors.js";
import { nonNegativeInt, optionalNote, positiveAmount } from "../lib/validation.js";
import { EX } from "../config/fieldExamples.js";
import { FortinoNumberField } from "../components/ui/FortinoNumberField.js";
import { FortinoTextField } from "../components/ui/FortinoTextField.js";

const SELECT_CLASS =
  "w-full rounded-lg border border-default-200 bg-background px-3 py-2 text-sm";

export function CashPage() {
  const { token, user } = useAuth();
  const { success, error: toastError } = useToast();
  const online = useOnline();
  const [shift, setShift] = useState<CashShift | null>(null);
  const [summary, setSummary] = useState<ShiftSummary | null>(null);
  const [openingCash, setOpeningCash] = useState(0);
  const [closingCash, setClosingCash] = useState<number | undefined>();
  const [movementAmount, setMovementAmount] = useState<number | undefined>();
  const [movementType, setMovementType] = useState<"income" | "expense">("expense");
  const [movementNote, setMovementNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  const loadShift = async () => {
    const cached = await getCachedShift();
    if (cached && online && token) {
      const current = await getCurrentShift(token);
      setShift(current);
      if (current) {
        try {
          setSummary(await getShiftSummary(token, current.id));
        } catch {
          setSummary(null);
        }
      } else {
        setSummary(null);
      }
    } else if (cached) {
      setShift({
        id: cached.shiftId,
        userId: "",
        openedAt: new Date().toISOString(),
        openingCash: cached.openingCash,
        status: "open",
      });
      setSummary(null);
    } else {
      setShift(null);
      setSummary(null);
    }
  };

  useEffect(() => {
    loadShift();
    if (!shift || !online || !token) return;
    const interval = setInterval(loadShift, 15000);
    return () => clearInterval(interval);
  }, [token, online, shift?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpen = async () => {
    if (!token || !online) {
      setError("Se requiere conexión para abrir turno");
      return;
    }
    const amount = openingCash;
    const err = nonNegativeInt(Math.round(amount * 100) / 100, "Efectivo inicial");
    if (err) {
      setFieldErrors({ openingCash: err });
      return;
    }
    setError(null);
    setFieldErrors({});
    try {
      const s = await openShift(token, amount);
      setShift(s);
      success("Turno abierto");
      await loadShift();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const handleClose = async () => {
    if (!token || !shift || !online) return;
    const err = positiveAmount(String(closingCash ?? ""), "Efectivo contado");
    if (err) {
      setFieldErrors({ closingCash: err });
      return;
    }
    setError(null);
    setFieldErrors({});
    try {
      const result = await closeShift(token, shift.id, Number(closingCash));
      const { exportCashShiftPdf } = await import("../lib/pdf-reports.js");
      exportCashShiftPdf({
        openedAt: result.openedAt,
        closedAt: result.closedAt,
        openingCash: result.openingCash,
        closingCashDeclared: result.closingCashDeclared ?? closingCash,
        closingCashExpected: result.closingCashExpected ?? result.expectedCash,
        difference: result.difference,
        salesCount: result.salesCount,
        salesTotal: result.salesTotal,
        cashSalesTotal: result.cashSalesTotal,
        cardSalesTotal: result.cardSalesTotal,
        transferSalesTotal: result.transferSalesTotal,
        incomeTotal: result.incomeTotal,
        expenseTotal: result.expenseTotal,
        movementNet: result.movementNet,
        expectedCash: result.expectedCash,
        cashierName: user?.fullName ?? user?.email,
      });
      setShift(null);
      setSummary(null);
      setClosingCash(undefined);
      success(`Turno cerrado. Diferencia: $${result.difference?.toFixed(2) ?? "0.00"}. PDF descargado.`);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const handleMovement = async () => {
    if (!token || !shift || !online) return;
    const amountErr = positiveAmount(String(movementAmount ?? ""), "Monto del movimiento");
    const noteErr = optionalNote(movementNote);
    if (amountErr || noteErr) {
      setFieldErrors({ movementAmount: amountErr, movementNote: noteErr });
      return;
    }
    setFieldErrors({});
    try {
      await registerMovement(token, {
        shiftId: shift.id,
        type: movementType,
        amount: Number(movementAmount),
        note: movementNote.trim() || undefined,
      });
      setMovementAmount(undefined);
      setMovementNote("");
      success("Movimiento registrado");
      await loadShift();
    } catch (e) {
      toastError(getErrorMessage(e));
    }
  };

  return (
    <div className="fortino-pos-main fortino-cash-page">
      <div className="flex flex-col gap-6">
        <header className="fortino-page-header">
          <div>
            <h1 className="fortino-heading-section">Caja</h1>
            <p className="fortino-lead">
              Turno, movimientos manuales y corte de efectivo al cierre.
            </p>
          </div>
        </header>

        {error && (
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Error</Alert.Title>
              <Alert.Description>{error}</Alert.Description>
              <button
                type="button"
                className="mt-2 text-sm underline"
                onClick={() => setError(null)}
              >
                Cerrar
              </button>
            </Alert.Content>
          </Alert>
        )}

        {!shift ? (
          <div className="fortino-cash-tile">
            <div className="flex flex-col gap-5">
              <h3 className="fortino-module-card-title">Abrir turno de caja</h3>
              <FortinoNumberField
                id="opening-cash"
                label="Efectivo inicial en caja (MXN)"
                placeholder={EX.cashAmount}
                value={openingCash}
                onChange={(value) => setOpeningCash(value ?? 0)}
                onBlur={() => {
                  const err = nonNegativeInt(Math.round(openingCash * 100) / 100, "Efectivo inicial");
                  setFieldErrors((f) => ({ ...f, openingCash: err }));
                }}
                minValue={0}
                step={0.01}
                error={fieldErrors.openingCash}
              />
              <Button variant="primary" onPress={handleOpen} isDisabled={!online}>
                {online ? "Abrir turno" : "Sin conexión"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="fortino-cash-tile">
                <div className="flex flex-col gap-4">
                  <h3 className="fortino-module-card-title">Resumen del turno</h3>
                  <p className="text-sm m-0">
                    Apertura: <strong className="price">${Number(shift.openingCash).toFixed(2)}</strong>
                  </p>
                  {summary ? (
                    <>
                      <div className="fortino-cash-breakdown">
                        <div className="fortino-cash-breakdown-row">
                          <span>Ventas totales</span>
                          <strong className="price">
                            {summary.salesCount} · ${summary.salesTotal.toFixed(2)}
                          </strong>
                        </div>
                        <div className="fortino-cash-breakdown-row">
                          <span>Efectivo en ventas</span>
                          <strong className="price">${summary.cashSalesTotal.toFixed(2)}</strong>
                        </div>
                        <div className="fortino-cash-breakdown-row">
                          <span>Tarjeta</span>
                          <strong className="price">${summary.cardSalesTotal.toFixed(2)}</strong>
                        </div>
                        <div className="fortino-cash-breakdown-row">
                          <span>Transferencia</span>
                          <strong className="price">${summary.transferSalesTotal.toFixed(2)}</strong>
                        </div>
                        <div className="fortino-cash-breakdown-row">
                          <span>Ingresos manuales</span>
                          <strong className="price fortino-text-success">
                            +${summary.incomeTotal.toFixed(2)}
                          </strong>
                        </div>
                        <div className="fortino-cash-breakdown-row">
                          <span>Egresos manuales</span>
                          <strong className="price fortino-text-error">
                            −${summary.expenseTotal.toFixed(2)}
                          </strong>
                        </div>
                      </div>
                      <p className="fortino-caption m-0">
                        Fórmula: apertura + ventas efectivo + movimientos netos
                      </p>
                      <p className="checkout-total price text-xl m-0">
                        Efectivo esperado: ${summary.expectedCash.toFixed(2)}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-default-500">
                      {online ? "Calculando resumen…" : "Sin conexión para resumen en vivo"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="fortino-cash-tile">
                <Form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleMovement();
                  }}
                >
                  <div className="flex flex-col gap-4">
                    <h3 className="fortino-module-card-title">Movimiento manual</h3>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="movement-type" className="text-sm font-medium">
                        Tipo
                      </label>
                      <select
                        id="movement-type"
                        className={SELECT_CLASS}
                        value={movementType}
                        onChange={(e) => setMovementType(e.target.value as "income" | "expense")}
                      >
                        <option value="income">Ingreso</option>
                        <option value="expense">Egreso</option>
                      </select>
                    </div>
                    <FortinoNumberField
                      id="movement-amount"
                      label="Monto del movimiento (MXN)"
                      placeholder={EX.cashAmount}
                      value={movementAmount}
                      onChange={setMovementAmount}
                      onBlur={() => {
                        const err = positiveAmount(String(movementAmount ?? ""), "Monto del movimiento");
                        setFieldErrors((f) => ({ ...f, movementAmount: err }));
                      }}
                      minValue={0.01}
                      step={0.01}
                      error={fieldErrors.movementAmount}
                      required
                    />
                    <FortinoTextField
                      id="movement-note"
                      label="Descripción del movimiento"
                      placeholder={EX.cashMovementNote}
                      value={movementNote}
                      onChange={setMovementNote}
                      onBlur={() => {
                        const err = optionalNote(movementNote);
                        setFieldErrors((f) => ({ ...f, movementNote: err }));
                      }}
                      error={fieldErrors.movementNote}
                    />
                    <Button type="submit" variant="primary">
                      Registrar movimiento
                    </Button>
                  </div>
                </Form>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="fortino-cash-tile">
                <div className="flex flex-col gap-4">
                  <h3 className="fortino-module-card-title">Cerrar turno</h3>
                  <FortinoNumberField
                    id="closing-cash"
                    label="Efectivo contado al cerrar (MXN)"
                    placeholder={EX.cashAmount}
                    value={closingCash}
                    onChange={setClosingCash}
                    onBlur={() => {
                      const err = positiveAmount(String(closingCash ?? ""), "Efectivo contado");
                      setFieldErrors((f) => ({ ...f, closingCash: err }));
                    }}
                    minValue={0}
                    step={0.01}
                    error={fieldErrors.closingCash}
                    required
                  />
                  {summary && closingCash != null && (
                    <p className="text-sm text-muted m-0">
                      Diferencia estimada: $
                      {(closingCash - summary.expectedCash).toFixed(2)}
                    </p>
                  )}
                  <Button variant="danger" onPress={handleClose}>
                    Cerrar turno
                  </Button>
                </div>
              </div>
            </div>

            {summary && summary.movements.length > 0 && (
              <div className="lg:col-span-12">
                <div className="fortino-cash-tile">
                  <h3 className="fortino-module-card-title">Movimientos del turno</h3>
                  <Table aria-label="Movimientos del turno">
                    <Table.ScrollContainer>
                      <Table.Content>
                        <Table.Header>
                          <Table.Column isRowHeader>Hora</Table.Column>
                          <Table.Column>Tipo</Table.Column>
                          <Table.Column>Monto</Table.Column>
                          <Table.Column>Nota</Table.Column>
                        </Table.Header>
                        <Table.Body>
                          {summary.movements.map((m) => (
                            <Table.Row key={m.id} id={m.id}>
                              <Table.Cell>
                                {new Date(m.createdAt).toLocaleTimeString("es-MX")}
                              </Table.Cell>
                              <Table.Cell>
                                {m.type === "income" ? "Ingreso" : "Egreso"}
                              </Table.Cell>
                              <Table.Cell className="mono">
                                ${Number(m.amount).toFixed(2)}
                              </Table.Cell>
                              <Table.Cell>{m.note ?? "—"}</Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table.Content>
                    </Table.ScrollContainer>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
