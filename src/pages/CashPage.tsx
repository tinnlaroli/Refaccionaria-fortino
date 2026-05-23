import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import {
  closeShift,
  getCachedShift,
  getCurrentShift,
  openShift,
  registerMovement,
} from "../api/cash.js";
import type { CashShift } from "../types/index.js";
import { useOnline } from "../hooks/useOnline.js";

export function CashPage() {
  const { token } = useAuth();
  const online = useOnline();
  const [shift, setShift] = useState<CashShift | null>(null);
  const [openingCash, setOpeningCash] = useState("0");
  const [closingCash, setClosingCash] = useState("");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementType, setMovementType] = useState<"income" | "expense">("expense");
  const [movementNote, setMovementNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadShift = async () => {
    const cached = await getCachedShift();
    if (cached && online && token) {
      const current = await getCurrentShift(token);
      setShift(current);
    } else if (cached) {
      setShift({
        id: cached.shiftId,
        userId: "",
        openedAt: new Date().toISOString(),
        openingCash: cached.openingCash,
        status: "open",
      });
    } else {
      setShift(null);
    }
  };

  useEffect(() => {
    loadShift();
  }, [token, online]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpen = async () => {
    if (!token || !online) {
      setError("Se requiere conexión para abrir turno");
      return;
    }
    setError(null);
    try {
      const s = await openShift(token, Number(openingCash));
      setShift(s);
      setMessage("Turno abierto");
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
      setMessage(
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
      setMessage("Movimiento registrado");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  return (
    <div className="panel" style={{ height: "100%" }}>
      <h2 style={{ marginTop: 0 }}>Caja</h2>
      {message && <p style={{ color: "var(--success)" }}>{message}</p>}
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
            <h3>Turno activo</h3>
            <p className="mono">ID: {shift.id.slice(0, 8)}…</p>
            <p>Apertura: ${Number(shift.openingCash).toFixed(2)}</p>
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
            <button
              type="button"
              className="btn-danger"
              style={{ marginTop: "0.75rem" }}
              onClick={handleClose}
            >
              Cerrar turno
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
