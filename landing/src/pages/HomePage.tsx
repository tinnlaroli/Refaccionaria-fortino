import { Link } from "react-router-dom";
import { PageHead } from "../components/PageHead";
import { SITE } from "../config/site";

const HIGHLIGHTS = [
  {
    title: "Variedad de refacciones",
    text: "Aceites, filtros, frenos y más para mantenimiento preventivo y correctivo.",
  },
  {
    title: "Atención en mostrador",
    text: "Te ayudamos a encontrar la pieza correcta por SKU, modelo o aplicación.",
  },
  {
    title: "Precios claros",
    text: "Consulta disponibilidad en línea y confirma tu compra en tienda.",
  },
] as const;

export function HomePage() {
  return (
    <>
      <PageHead
        title="Inicio"
        description={`${SITE.name} — ${SITE.tagline} en ${SITE.city}. Catálogo, ubicación y contacto.`}
      />
      <section className="hero">
        <div className="container hero-inner">
          <p className="eyebrow">{SITE.city}</p>
          <h1>{SITE.name}</h1>
          <p className="hero-lead">{SITE.tagline}</p>
          <div className="hero-actions">
            <Link to="/catalogo" className="btn btn-primary">
              Ver catálogo
            </Link>
            <Link to="/contacto" className="btn btn-ghost">
              Cómo llegar
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container cards-grid">
          {HIGHLIGHTS.map((item) => (
            <article key={item.title} className="card">
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section cta-band">
        <div className="container cta-inner">
          <div>
            <h2>¿Listo para tu siguiente servicio?</h2>
            <p className="muted">
              Revisa piezas disponibles o visítanos en horario de tienda.
            </p>
          </div>
          <div className="cta-actions">
            <Link to="/catalogo" className="btn btn-primary">
              Explorar catálogo
            </Link>
            <a
              href={`https://wa.me/${SITE.whatsapp}`}
              className="btn btn-ghost"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
