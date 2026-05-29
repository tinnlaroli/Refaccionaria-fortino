const API_BASE = "";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...init } = options;
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch {
    throw new ApiError("Sin conexión al servidor", 0);
  }

  const text = await response.text();
  const trimmed = text.trim();
  let data: T;
  if (!trimmed) {
    data = {} as T;
  } else {
    try {
      data = JSON.parse(trimmed) as T;
    } catch {
      const contentType = response.headers.get("content-type") ?? "unknown";
      const snippet = trimmed.slice(0, 200);
      throw new ApiError(
        `Respuesta inválida del servidor (no JSON). status=${response.status}, content-type=${contentType}, body="${snippet}"`,
        response.status,
      );
    }
  }

  if (!response.ok) {
    const err = data as { error?: string };
    throw new ApiError(
      typeof err?.error === "string" ? err.error : response.statusText,
      response.status,
      data,
    );
  }

  return data;
}
