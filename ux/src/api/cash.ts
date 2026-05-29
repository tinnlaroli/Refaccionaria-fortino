import { db } from "../db/dexie.js";
import type { CashShift } from "../types/index.js";
import { apiFetch } from "./client.js";

export async function getCurrentShift(token: string) {
  const shift = await apiFetch<CashShift | null>("/api/cash/shifts/current", {
    token,
  });
  if (shift) {
    await db.shiftCache.put({
      id: "current",
      shiftId: shift.id,
      openingCash: shift.openingCash,
    });
  }
  return shift;
}

export async function getCachedShift() {
  return db.shiftCache.get("current");
}

export async function openShift(token: string, openingCash: number) {
  const shift = await apiFetch<CashShift>("/api/cash/shifts/open", {
    method: "POST",
    token,
    body: JSON.stringify({ openingCash }),
  });
  await db.shiftCache.put({
    id: "current",
    shiftId: shift.id,
    openingCash: shift.openingCash,
  });
  return shift;
}

export async function closeShift(
  token: string,
  shiftId: string,
  closingCashDeclared: number,
) {
  const result = await apiFetch<CashShift & { difference: number }>(
    `/api/cash/shifts/${shiftId}/close`,
    {
      method: "POST",
      token,
      body: JSON.stringify({ closingCashDeclared }),
    },
  );
  await db.shiftCache.delete("current");
  return result;
}

export async function registerMovement(
  token: string,
  params: {
    shiftId: string;
    type: "income" | "expense";
    amount: number;
    note?: string;
  },
) {
  return apiFetch("/api/cash/movements", {
    method: "POST",
    token,
    body: JSON.stringify(params),
  });
}

export type ShiftSummary = {
  shift: CashShift;
  salesTotal: number;
  salesCount: number;
  movementNet: number;
  expectedCash: number;
  movements: Array<{
    id: string;
    type: "income" | "expense";
    amount: string;
    note: string | null;
    createdAt: string;
    createdByName: string | null;
  }>;
};

export async function getShiftSummary(token: string, shiftId: string) {
  return apiFetch<ShiftSummary>(`/api/cash/shifts/${shiftId}/summary`, { token });
}
