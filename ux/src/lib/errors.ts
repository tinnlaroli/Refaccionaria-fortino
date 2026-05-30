import { ApiError } from "../api/client.js";

const FRIENDLY: Record<number, string> = {
  0: "Sin conexión al servidor. Verifica tu internet.",
  400: "Los datos enviados no son válidos.",
  401: "Sesión expirada. Vuelve a iniciar sesión.",
  403: "No tienes permiso para esta acción.",
  404: "El recurso solicitado no existe.",
  409: "Conflicto: el registro ya fue modificado.",
  422: "Revisa los campos del formulario.",
  500: "Error interno del servidor. Intenta de nuevo.",
  502: "El servidor no responde. Intenta en unos momentos.",
  503: "Servicio temporalmente no disponible.",
};

export function getErrorMessage(err: unknown, fallback = "Ocurrió un error inesperado"): string {
  if (err instanceof ApiError) {
    const body = err.body as { code?: string; error?: string } | undefined;
    if (body?.code === "NO_OPEN_SHIFT") {
      return "Debes abrir un turno de caja antes de cobrar. Ve a Caja para abrir turno.";
    }
    if (err.message && err.message !== "Failed to fetch") return err.message;
    return FRIENDLY[err.status] ?? fallback;
  }
  if (err instanceof Error) {
    if (err.message === "Failed to fetch") return FRIENDLY[0];
    return err.message || fallback;
  }
  if (typeof err === "string") return err;
  return fallback;
}
