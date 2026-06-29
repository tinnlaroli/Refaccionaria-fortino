import { PageHead } from "../components/PageHead";
import { SITE } from "../config/site";

const HIGHLIGHTS = [
  {
    title: "Variedad de refacciones",
    text: "Aceites, filtros, frenos y más para mantenimiento preventivo y correctivo de tu vehículo.",
  },
  {
    title: "Atención en mostrador",
    text: "Te ayudamos a encontrar la pieza correcta por SKU, modelo o aplicación directa en mostrador.",
  },
  {
    title: "Precios claros",
    text: "Consulta precios directamente en tienda y recibe asesoría sin compromiso.",
  },
] as const;

export function HomePage() {
  return (
    <>
      <PageHead
        title="Inicio"
        description={`${SITE.name} — ${SITE.tagline} en ${SITE.city}.`}
      />

      <section className="hero">
        <div className="container hero-inner">
          <p className="eyebrow">{SITE.city}</p>
          <h1>{SITE.name}</h1>
          <p className="hero-lead">{SITE.tagline}</p>
          <div className="hero-actions">
            <a href={SITE.posUrl} className="btn btn-primary btn-lg">
              Ir al punto de venta
            </a>
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

      <section className="section location-section">
        <div className="container location-grid">
          <div className="location-info">
            <h2>Visítanos</h2>
            <p className="muted">{SITE.city}</p>
            <p className="location-hours">{SITE.hours}</p>
            <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="location-phone">
              {SITE.phone}
            </a>
          </div>
          <div className="location-map">
            <iframe
              src={SITE.mapsEmbed}
              width="100%"
              height="100%"
              style={{ border: 0, borderRadius: 12, minHeight: 320 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              title="Ubicación de Refaccionaria Fortino"
            />
          </div>
        </div>
      </section>

      <section className="section cta-band">
        <div className="container cta-inner">
          <div>
            <h2>¿Listo para tu siguiente servicio?</h2>
            <p className="muted">
              Accede al punto de venta para consultar precios y disponibilidad.
            </p>
          </div>
          <div className="cta-actions">
            <a href={SITE.posUrl} className="btn btn-primary btn-lg">
              Ir al punto de venta
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
