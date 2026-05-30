import { useEffect, useState } from "react";
import {
  Button,
  Column,
  Form,
  Grid,
  InlineNotification,
  NumberInput,
  Select,
  SelectItem,
  Stack,
  TextInput,
  Tile,
  DataTable,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@carbon/react";
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

export function CashPage() {
  const { token } = useAuth();
  const { success, error: toastError } = useToast();
  const online = useOnline();
  const [shift, setShift] = useState<CashShift | null>(null);
  const [summary, setSummary] = useState<ShiftSummary | null>(null);
  const [openingCash, setOpeningCash] = useState<string | number>("0");
  const [closingCash, setClosingCash] = useState<string | number>("");
  const [movementAmount, setMovementAmount] = useState<string | number>("");
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
    const amount = Number(openingCash);
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
    const err = positiveAmount(String(closingCash), "Efectivo contado");
    if (err) {
      setFieldErrors({ closingCash: err });
      return;
    }
    setError(null);
    setFieldErrors({});
    try {
      const result = await closeShift(token, shift.id, Number(closingCash));
      setShift(null);
      setSummary(null);
      setClosingCash("");
      success(`Turno cerrado. Diferencia: $${result.difference?.toFixed(2) ?? "0.00"}`);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  const handleMovement = async () => {
    if (!token || !shift || !online) return;
    const amountErr = positiveAmount(String(movementAmount), "Monto del movimiento");
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
      setMovementAmount("");
      setMovementNote("");
      success("Movimiento registrado");
      await loadShift();
    } catch (e) {
      toastError(getErrorMessage(e));
    }
  };

  return (
    <div className="fortino-pos-main fortino-cash-page">
      <Stack gap={6}>
        {error && (
          <InlineNotification kind="error" lowContrast title="Error" subtitle={error} onClose={() => setError(null)} />
        )}

        {!shift ? (
          <Tile className="fortino-cash-tile">
            <Stack gap={5}>
              <h3 className="fortino-module-card-title">Abrir turno de caja</h3>
              <NumberInput
                id="opening-cash"
                label="Efectivo inicial en caja"
                min={0}
                step={0.01}
                value={openingCash}
                onChange={(_, { value }) => setOpeningCash(value)}
                onBlur={() => {
                  const amount = Number(openingCash);
                  const err = nonNegativeInt(Math.round(amount * 100) / 100, "Efectivo inicial");
                  setFieldErrors((f) => ({ ...f, openingCash: err }));
                }}
                invalid={Boolean(fieldErrors.openingCash)}
                invalidText={fieldErrors.openingCash}
              />
              <Button kind="primary" onClick={handleOpen} disabled={!online}>
                {online ? "Abrir turno" : "Sin conexión"}
              </Button>
            </Stack>
          </Tile>
        ) : (
          <Grid narrow>
            <Column lg={5} md={4} sm={4}>
              <Tile>
                <Stack gap={4}>
                  <h3 className="fortino-module-card-title">Resumen del turno</h3>
                  <p className="cds--body-compact-01" style={{ margin: 0 }}>
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
                      <p className="fortino-caption" style={{ margin: 0 }}>
                        Fórmula: apertura + ventas efectivo + movimientos netos
                      </p>
                      <p className="checkout-total price" style={{ fontSize: "1.35rem", margin: 0 }}>
                        Efectivo esperado: ${summary.expectedCash.toFixed(2)}
                      </p>
                    </>
                  ) : (
                    <p className="cds--body-compact-01" style={{ color: "var(--cds-text-secondary)" }}>
                      {online ? "Calculando resumen…" : "Sin conexión para resumen en vivo"}
                    </p>
                  )}
                </Stack>
              </Tile>
            </Column>

            <Column lg={5} md={4} sm={4}>
              <Tile>
                <Form onSubmit={(e) => { e.preventDefault(); handleMovement(); }}>
                  <Stack gap={4}>
                    <h3 className="fortino-module-card-title">Movimiento manual</h3>
                    <Select
                      id="movement-type"
                      labelText="Tipo"
                      value={movementType}
                      onChange={(e) => setMovementType(e.target.value as "income" | "expense")}
                    >
                      <SelectItem value="income" text="Ingreso" />
                      <SelectItem value="expense" text="Egreso" />
                    </Select>
                    <NumberInput
                      id="movement-amount"
                      label="Monto"
                      min={0.01}
                      step={0.01}
                      value={movementAmount}
                      onChange={(_, { value }) => setMovementAmount(value)}
                      onBlur={() => {
                        const err = positiveAmount(String(movementAmount), "Monto del movimiento");
                        setFieldErrors((f) => ({ ...f, movementAmount: err }));
                      }}
                      invalid={Boolean(fieldErrors.movementAmount)}
                      invalidText={fieldErrors.movementAmount}
                    />
                    <TextInput
                      id="movement-note"
                      labelText="Nota (opcional)"
                      value={movementNote}
                      onChange={(e) => setMovementNote(e.target.value)}
                      onBlur={() => {
                        const err = optionalNote(movementNote);
                        setFieldErrors((f) => ({ ...f, movementNote: err }));
                      }}
                      invalid={Boolean(fieldErrors.movementNote)}
                      invalidText={fieldErrors.movementNote}
                      placeholder="Ej. pago proveedor, cambio…"
                    />
                    <Button type="submit" kind="primary">
                      Registrar movimiento
                    </Button>
                  </Stack>
                </Form>
              </Tile>
            </Column>

            <Column lg={6} md={8} sm={4}>
              <Tile>
                <Stack gap={4}>
                  <h3 className="fortino-module-card-title">Cerrar turno</h3>
                  <NumberInput
                    id="closing-cash"
                    label="Efectivo contado en caja"
                    min={0}
                    step={0.01}
                    value={closingCash}
                    onChange={(_, { value }) => setClosingCash(value)}
                    onBlur={() => {
                      const err = positiveAmount(String(closingCash), "Efectivo contado");
                      setFieldErrors((f) => ({ ...f, closingCash: err }));
                    }}
                    invalid={Boolean(fieldErrors.closingCash)}
                    invalidText={fieldErrors.closingCash}
                    helperText={
                      summary && closingCash
                        ? `Diferencia estimada: $${(Number(closingCash) - summary.expectedCash).toFixed(2)}`
                        : undefined
                    }
                  />
                  <Button kind="danger" onClick={handleClose}>
                    Cerrar turno
                  </Button>
                </Stack>
              </Tile>
            </Column>

            {summary && summary.movements.length > 0 && (
              <Column lg={16} md={8} sm={4}>
                <Tile>
                  <h3 className="fortino-module-card-title">Movimientos del turno</h3>
                  <DataTable
                    rows={summary.movements.map((m) => ({
                      id: m.id,
                      time: new Date(m.createdAt).toLocaleTimeString("es-MX"),
                      type: m.type === "income" ? "Ingreso" : "Egreso",
                      amount: `$${Number(m.amount).toFixed(2)}`,
                      note: m.note ?? "—",
                    }))}
                    headers={[
                      { key: "time", header: "Hora" },
                      { key: "type", header: "Tipo" },
                      { key: "amount", header: "Monto" },
                      { key: "note", header: "Nota" },
                    ]}
                    size="sm"
                  >
                    {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
                      <Table {...getTableProps()} size="sm">
                        <TableHead>
                          <TableRow>
                            {headers.map((h) => (
                              <TableHeader {...getHeaderProps({ header: h })} key={h.key}>
                                {h.header}
                              </TableHeader>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {rows.map((row) => (
                            <TableRow {...getRowProps({ row })} key={row.id}>
                              {row.cells.map((cell) => (
                                <TableCell key={cell.id}>{cell.value}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </DataTable>
                </Tile>
              </Column>
            )}
          </Grid>
        )}
      </Stack>
    </div>
  );
}
