import { PageHead } from "../components/PageHead";
import { SITE } from "../config/site";

export function ContactPage() {
  return (
    <>
      <PageHead
        title="Contacto"
        description={`Ubicación, horarios y contacto de ${SITE.name} en ${SITE.city}.`}
      />
      <section className="section page-intro">
        <div className="container">
          <h1>Ubicación y contacto</h1>
          <p className="muted">Visítanos o escríbenos; con gusto te atendemos.</p>
        </div>
      </section>

      <section className="section">
        <div className="container contact-grid">
          <div className="card contact-card">
            <h2>Dirección</h2>
            <p>{SITE.address}</p>
            <p className="muted">{SITE.city}</p>
            <a
              href={SITE.mapsUrl}
              className="btn btn-ghost"
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir en Google Maps
            </a>
          </div>

          <div className="card contact-card">
            <h2>Horario</h2>
            <p>{SITE.hours}</p>
            <h2>Teléfono</h2>
            <p>
              <a href={`tel:${SITE.phone.replace(/\s/g, "")}`}>{SITE.phone}</a>
            </p>
            <h2>Correo</h2>
            <p>
              <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            </p>
            <a
              href={`https://wa.me/${SITE.whatsapp}`}
              className="btn btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Escribir por WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
