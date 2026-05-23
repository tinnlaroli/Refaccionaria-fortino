export default function App() {
  return (
    <div className="page">
      <header className="hero">
        <h1>Refaccionaria Fortino</h1>
        <p>Repuestos, aceites y refacciones para tu vehículo en Veracruz.</p>
        <div className="actions">
          <a href="/pos/" className="btn primary">
            Ir al Punto de Venta
          </a>
          <a href="/api/info" className="btn ghost">
            Estado del sistema
          </a>
        </div>
      </header>
      <section className="info">
        <h2>Próximamente</h2>
        <p>
          Landing pública en desarrollo (rama <code>feat/landing</code>). Catálogo
          en línea, ubicación y contacto.
        </p>
      </section>
    </div>
  );
}
