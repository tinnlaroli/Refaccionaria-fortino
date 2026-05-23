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
  const data = text ? (JSON.parse(text) as T) : ({} as T);

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
