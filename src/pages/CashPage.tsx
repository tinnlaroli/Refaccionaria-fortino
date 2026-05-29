import { useEffect, useState } from "react";
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

export function CashPage() {
  const { token } = useAuth();
  const { success, error: toastError } = useToast();
  const online = useOnline();
  const [shift, setShift] = useState<CashShift | null>(null);
  const [summary, setSummary] = useState<ShiftSummary | null>(null);
  const [openingCash, setOpeningCash] = useState("0");
  const [closingCash, setClosingCash] = useState("");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementType, setMovementType] = useState<"income" | "expense">("expense");
  const [movementNote, setMovementNote] = useState("");
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    try {
      const s = await openShift(token, Number(openingCash));
      setShift(s);
      success("Turno abierto");
      await loadShift();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  const handleClose = async () => {
    if (!token || !shift || !online) return;
    setError(null);
    try {
      const result = await closeShift(token, shift.id, Number(closingCash));
      setShift(null);
      setSummary(null);
      success(
        `Turno cerrado. Diferencia: $${result.difference?.toFixed(2) ?? "0.00"}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  const handleMovement = async () => {
    if (!token || !shift || !online) return;
    setError(null);
    try {
      await registerMovement(token, {
        shiftId: shift.id,
        type: movementType,
        amount: Number(movementAmount),
        note: movementNote || undefined,
      });
      setMovementAmount("");
      setMovementNote("");
      success("Movimiento registrado");
      await loadShift();
    } catch (e) {
      toastError(e instanceof Error ? e.message : "Error");
    }
  };

  return (
    <div className="panel" style={{ height: "100%" }}>
      <h2 style={{ marginTop: 0 }}>Caja</h2>
      {error && <p className="error-text">{error}</p>}

      {!shift ? (
        <div className="cash-card cash-grid">
          <h3>Abrir turno</h3>
          <label>
            Efectivo inicial
            <input
              type="number"
              min="0"
              step="0.01"
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
            />
          </label>
          <button type="button" className="btn-primary" onClick={handleOpen}>
            Abrir turno
          </button>
        </div>
      ) : (
        <div className="cash-grid">
          <div className="cash-card">
            <h3>Resumen del turno</h3>
            <p>Apertura: ${Number(shift.openingCash).toFixed(2)}</p>
            {summary ? (
              <>
                <p>Ventas: {summary.salesCount} · ${summary.salesTotal.toFixed(2)}</p>
                <p>
                  Movimientos netos:{" "}
                  {summary.movementNet >= 0 ? "+" : ""}
                  ${summary.movementNet.toFixed(2)}
                </p>
                <p className="checkout-total price" style={{ fontSize: "1.25rem" }}>
                  Efectivo esperado: ${summary.expectedCash.toFixed(2)}
                </p>
              </>
            ) : (
              <p style={{ color: "var(--text-muted)" }}>
                {online ? "Calculando resumen..." : "Sin conexión para resumen en vivo"}
              </p>
            )}
          </div>

          <div className="cash-card">
            <h3>Movimiento manual</h3>
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value as "income" | "expense")}
            >
              <option value="income">Ingreso</option>
              <option value="expense">Egreso</option>
            </select>
            <input
              type="number"
              placeholder="Monto"
              value={movementAmount}
              onChange={(e) => setMovementAmount(e.target.value)}
              style={{ marginTop: "0.5rem" }}
            />
            <input
              type="text"
              placeholder="Nota"
              value={movementNote}
              onChange={(e) => setMovementNote(e.target.value)}
              style={{ marginTop: "0.5rem" }}
            />
            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: "0.75rem" }}
              onClick={handleMovement}
            >
              Registrar
            </button>
          </div>

          <div className="cash-card">
            <h3>Cerrar turno</h3>
            <input
              type="number"
              placeholder="Efectivo contado"
              value={closingCash}
              onChange={(e) => setClosingCash(e.target.value)}
            />
            {summary && closingCash && (
              <p className="change-hint" style={{ marginTop: "0.5rem" }}>
                Diferencia estimada:{" "}
                <strong>
                  ${(Number(closingCash) - summary.expectedCash).toFixed(2)}
                </strong>
              </p>
            )}
            <button
              type="button"
              className="btn-danger"
              style={{ marginTop: "0.75rem" }}
              onClick={handleClose}
            >
              Cerrar turno
            </button>
          </div>

          {summary && summary.movements.length > 0 && (
            <div className="cash-card cash-card-wide">
              <h3>Movimientos del turno</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Tipo</th>
                    <th>Monto</th>
                    <th>Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.movements.map((m) => (
                    <tr key={m.id}>
                      <td>{new Date(m.createdAt).toLocaleTimeString("es-MX")}</td>
                      <td>{m.type === "income" ? "Ingreso" : "Egreso"}</td>
                      <td className="price">${Number(m.amount).toFixed(2)}</td>
                      <td>{m.note ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
