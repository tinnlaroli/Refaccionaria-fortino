import { apiFetch } from "./client.js";

export type AuditEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  payload: Record<string, unknown> | null;
  createdAt: string;
  userName: string | null;
};

export function fetchAuditLog(
  token: string,
  params?: {
    action?: string;
    entityType?: string;
    from?: string;
    to?: string;
    limit?: number;
  },
) {
  const query = new URLSearchParams();
  if (params?.action) query.set("action", params.action);
  if (params?.entityType) query.set("entityType", params.entityType);
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiFetch<AuditEntry[]>(`/api/audit${qs ? `?${qs}` : ""}`, { token });
}
