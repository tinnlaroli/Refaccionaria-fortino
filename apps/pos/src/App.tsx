import { useEffect, useState } from "react";

type ApiStatus = {
  status: string;
  database?: string;
};

export default function App() {
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then(setApiStatus)
      .catch(() => setApiStatus({ status: "offline" }));
  }, []);

  return (
    <div className="app">
      <header>
        <h1>Refaccionaria Fortino</h1>
        <p>Punto de Venta — scaffold (feat/ux)</p>
      </header>
      <main className="layout">
        <section className="cart-panel">
          <h2>Carrito</h2>
          <p className="placeholder">70% — lista de compra (Fase 3)</p>
        </section>
        <aside className="checkout-panel">
          <h2>Cobro</h2>
          <p className="placeholder">30% — totalizador (Fase 3)</p>
          <p className="status">
            API: {apiStatus?.status ?? "conectando..."}
            {apiStatus?.database ? ` · BD: ${apiStatus.database}` : ""}
          </p>
        </aside>
      </main>
    </div>
  );
}
