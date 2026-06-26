import { uuid } from "../lib/uuid.js";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Alert } from "@heroui/react";

export type ToastType = "success" | "error" | "info" | "warning";

export type Toast = {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
};

type ToastContextValue = {
  toast: (message: string, type?: ToastType, title?: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const STATUS: Record<ToastType, "success" | "danger" | "accent" | "warning"> = {
  success: "success",
  error: "danger",
  info: "accent",
  warning: "warning",
};

const TITLES: Record<ToastType, string> = {
  success: "Listo",
  error: "Error",
  info: "Información",
  warning: "Atención",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, type: ToastType = "info", title?: string) => {
      const id = uuid();
      setToasts((prev) => [...prev.slice(-4), { id, message, type, title }]);
      window.setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      toast: push,
      success: (message: string) => push(message, "success"),
      error: (message: string) => push(message, "error"),
      info: (message: string) => push(message, "info"),
      warning: (message: string) => push(message, "warning"),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fortino-toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <Alert key={t.id} status={STATUS[t.type]} className="shadow-lg">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{t.title ?? TITLES[t.type]}</Alert.Title>
              <Alert.Description>{t.message}</Alert.Description>
              <button
                type="button"
                className="mt-1 text-xs underline"
                onClick={() => dismiss(t.id)}
              >
                Cerrar
              </button>
            </Alert.Content>
          </Alert>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}
