import { db } from "../db/dexie.js";
import type { UserSession } from "../types/index.js";
import { apiFetch } from "./client.js";

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  user: UserSession;
};

export async function loginOnline(email: string, password: string) {
  const data = await apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  await db.authCache.put({
    id: "session",
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: data.user,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });

  return data;
}

export async function getCachedSession() {
  const row = await db.authCache.get("session");
  if (!row) return null;
  if (Date.now() > row.expiresAt) {
    await db.authCache.delete("session");
    return null;
  }
  return row;
}

export async function clearSession() {
  await db.authCache.delete("session");
  await db.shiftCache.delete("current");
}

export function canUseOfflineSession() {
  return getCachedSession();
}
