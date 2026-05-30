import { useCallback, useEffect, useState } from "react";
import { getCachedShift, getCurrentShift } from "../api/cash.js";
import { useAuth } from "../context/AuthContext.js";
import { useOnline } from "./useOnline.js";

export function useShiftStatus(pollMs = 15000) {
  const { token } = useAuth();
  const online = useOnline();
  const [hasShift, setHasShift] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (online && token) {
      try {
        const current = await getCurrentShift(token);
        setHasShift(Boolean(current));
      } catch {
        const cached = await getCachedShift();
        setHasShift(Boolean(cached));
      }
    } else {
      const cached = await getCachedShift();
      setHasShift(Boolean(cached));
    }
    setLoading(false);
  }, [online, token]);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, pollMs);
    return () => window.clearInterval(id);
  }, [refresh, pollMs]);

  return { hasShift, loading, refresh };
}
