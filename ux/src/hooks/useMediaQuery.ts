import { useEffect, useState } from "react";

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** Carbon UI shell — sidenav fijo a partir de 1056px */
export function useDesktopNav() {
  return useMediaQuery("(min-width: 1056px)");
}

/** Layout compacto tipo móvil (barra inferior POS, headers reducidos) */
export function useMobileLayout() {
  return useMediaQuery("(max-width: 671px)");
}
