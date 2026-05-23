import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { clearSession, getCachedSession, loginOnline } from "../api/auth.js";
import { fullSync, getPendingCount } from "../api/sync.js";
import { fetchProductsOnline } from "../api/products.js";
import type { AuthCacheRow } from "../db/dexie.js";
import { useOnline } from "../hooks/useOnline.js";
import type { ConnectionState, UserSession } from "../types/index.js";

type AuthContextValue = {
  session: AuthCacheRow | null;
  user: UserSession | null;
  token: string | null;
  loading: boolean;
  connection: ConnectionState;
  pendingSales: number;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sync: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const online = useOnline();
  const [session, setSession] = useState<AuthCacheRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState<ConnectionState>("online");
  const [pendingSales, setPendingSales] = useState(0);

  const refreshPending = useCallback(async () => {
    setPendingSales(await getPendingCount());
  }, []);

  const loadSession = useCallback(async () => {
    const cached = await getCachedSession();
    setSession(cached);
    await refreshPending();
    setLoading(false);
  }, [refreshPending]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const sync = useCallback(async () => {
    if (!session?.accessToken || !online) return;
    setConnection("syncing");
    try {
      await fullSync(session.accessToken);
      await fetchProductsOnline(session.accessToken);
      await refreshPending();
      setConnection("online");
    } catch {
      setConnection(online ? "online" : "offline");
    }
  }, [session?.accessToken, online, refreshPending]);

  useEffect(() => {
    if (!session || !online) {
      setConnection(online ? "online" : "offline");
      return;
    }
    sync();
  }, [online, session?.accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!online) setConnection("offline");
    else if (connection !== "syncing") setConnection("online");
  }, [online, connection]);

  const login = useCallback(
    async (email: string, password: string) => {
      if (!online) {
        const cached = await getCachedSession();
        if (cached && cached.user.email === email.toLowerCase()) {
          setSession(cached);
          return;
        }
        throw new Error("Sin conexión. Solo puedes entrar con la última sesión guardada.");
      }
      const data = await loginOnline(email, password);
      const row = await getCachedSession();
      setSession(row);
      if (row) {
        await fetchProductsOnline(data.accessToken);
        await fullSync(data.accessToken);
        await refreshPending();
      }
    },
    [online, refreshPending],
  );

  const logout = useCallback(async () => {
    await clearSession();
    setSession(null);
    setPendingSales(0);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      token: session?.accessToken ?? null,
      loading,
      connection,
      pendingSales,
      login,
      logout,
      sync,
    }),
    [session, loading, connection, pendingSales, login, logout, sync],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
