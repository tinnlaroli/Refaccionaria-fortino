import { PageHead } from "../components/PageHead";
import { SITE } from "../config/site";
import { useInView } from "../hooks/useInView";
import { useCounter } from "../hooks/useCounter";

function Reveal({ children, className = "", stagger = 0 }: { children: React.ReactNode; className?: string; stagger?: number }) {
  const { ref, inView } = useInView(0.1);
  return (
    <div
      ref={ref}
      className={`reveal ${inView ? "in-view" : ""} ${className}`}
      style={{ transitionDelay: `${stagger}s` }}
    >
      {children}
    </div>
  );
}

function StatItem({ label, end, suffix = "" }: { label: string; end: number; suffix?: string }) {
  const { ref, inView } = useInView(0.5);
  const count = useCounter(end, 2000, inView);
  return (
    <div ref={ref} className="stat-item">
      <span className="stat-number">{count}{suffix}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

const SERVICES = [
  {
    title: "Aceites y lubricantes",
    text: "Aceites de motor, transmisión y lubricantes para mantenimiento preventivo.",
    icon: "M12 2.5a2 2 0 0 1 2 2v1.5h3.5a2 2 0 0 1 2 2V10a4 4 0 0 1-2.5 3.7l-1.3.5v3.3a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-3.3l-1.3-.5A4 4 0 0 1 4.5 10V8a2 2 0 0 1 2-2H10V4.5a2 2 0 0 1 2-2z",
  },
  {
    title: "Frenos",
    text: "Pastillas, discos y componentes de frenado para todas las marcas.",
    icon: "M8.5 2a3 3 0 0 0-3 3v.5H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1.5v1.5a3 3 0 0 0 6 0v-1.5H13a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-1.5V5a3 3 0 0 0-3-3z",
  },
  {
    title: "Filtros",
    text: "Filtros de aceite, aire, combustible y cabina para tu vehículo.",
    icon: "M12 2a6 6 0 0 0-6 6c0 2.2 1.2 4.2 3 5.2V19a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-5.8c1.8-1 3-3 3-5.2a6 6 0 0 0-6-6z",
  },
  {
    title: "Baterías",
    text: "Baterías de arranque con garantía y entrega inmediata.",
    icon: "M7 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H7zm1 3h8v2H8V6zm0 4h8v2H8v-2z",
  },
  {
    title: "Suspensión",
    text: "Amortiguadores, resortes y piezas de suspensión y dirección.",
    icon: "M12 2C7.6 2 4 5.6 4 10c0 3.1 1.5 5.8 3.8 7.5l.7.5V21a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-3l.7-.5A9.5 9.5 0 0 0 20 10c0-4.4-3.6-8-8-8z",
  },
  {
    title: "Limpieza",
    text: "Limpiaparabrisas, aditivos y productos para el cuidado automotriz.",
    icon: "M19 3H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1v8a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9h1a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z",
  },
] as const;

export function HomePage() {
  return (
    <>
      <div className="grain-overlay" aria-hidden="true" />

      <PageHead
        title={`${SITE.name} — ${SITE.tagline}`}
        description={`${SITE.name} — ${SITE.tagline} en ${SITE.city}. Más de 10 años sirviendo a Tezonapa y la región.`}
      />

      {/* ── Hero ── */}
      <section className="hero">
        <div className="container hero-inner">
          <Reveal stagger={0}>
            <p className="eyebrow">{SITE.city}</p>
          </Reveal>
          <Reveal stagger={0.15}>
            <h1>{SITE.name}</h1>
          </Reveal>
          <Reveal stagger={0.3}>
            <p className="hero-lead">
              Repuestos, aceites y refacciones para tu vehículo, con la confianza
              de más de 10 años sirviendo a Tezonapa y la región.
            </p>
          </Reveal>
          <Reveal stagger={0.45}>
            <div className="hero-actions">
              <a href={SITE.posUrl} className="btn btn-primary btn-lg">
                Ir al punto de venta
              </a>
              <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="btn btn-ghost btn-lg">
                Llamar ahora
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Story ── */}
      <section className="section story-section">
        <div className="container">
          <Reveal>
            <div className="story-grid">
              <div className="story-content">
                <p className="eyebrow">Nuestra historia</p>
                <h2>Más de una década manteniendo a Tezonapa en movimiento</h2>
                <p>
                  Refaccionaria Fortino nació en Vereda con una idea simple: que
                  los conductores de la región siempre encontraran la pieza que
                  necesitan, sin tener que viajar horas hasta la ciudad.
                </p>
                <p>
                  Desde entonces, crecemos con la comunidad. Atendemos a
                  mecánicos, transportistas y familias que confían en nosotros
                  porque conocen el valor de un servicio honesto y refacciones
                  de calidad.
                </p>
                <p className="story-quote">
                  "No solo vendemos piezas. Ayudamos a que la gente siga
                  adelante."
                </p>
              </div>
              <div className="story-visual">
                <div className="story-card-accent">
                  <span className="story-year">2014</span>
                  <span className="story-label">Fundación</span>
                  <span className="story-year" style={{ fontSize: "1rem", opacity: 0.7 }}>2026</span>
                  <span className="story-label" style={{ fontSize: "0.75rem" }}>Presente</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="section stats-section">
        <div className="container">
          <Reveal>
            <p className="eyebrow" style={{ textAlign: "center", marginBottom: "0.5rem" }}>En números</p>
          </Reveal>
          <div className="stats-grid">
            <Reveal stagger={0}>
              <StatItem label="Años de experiencia" end={12} suffix="+" />
            </Reveal>
            <Reveal stagger={0.15}>
              <StatItem label="Clientes atendidos" end={5200} suffix="+" />
            </Reveal>
            <Reveal stagger={0.3}>
              <StatItem label="Piezas vendidas" end={28500} suffix="+" />
            </Reveal>
            <Reveal stagger={0.45}>
              <StatItem label="Municipios alcanzados" end={15} suffix="" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section className="section services-section">
        <div className="container">
          <Reveal>
            <p className="eyebrow" style={{ textAlign: "center", marginBottom: "0.5rem" }}>Lo que ofrecemos</p>
            <h2 style={{ textAlign: "center", fontSize: "1.75rem", margin: "0 0 2.5rem" }}>
              Todo lo que tu vehículo necesita
            </h2>
          </Reveal>
          <div className="services-grid">
            {SERVICES.map((svc, i) => (
              <Reveal key={svc.title} stagger={i * 0.08}>
                <article className="service-card">
                  <svg className="service-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={svc.icon} />
                  </svg>
                  <h3>{svc.title}</h3>
                  <p>{svc.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Highlights ── */}
      <section className="section highlights-section">
        <div className="container">
          <Reveal>
            <p className="eyebrow" style={{ textAlign: "center", marginBottom: "0.5rem" }}>Por qué elegirnos</p>
            <h2 style={{ textAlign: "center", fontSize: "1.75rem", margin: "0 0 2.5rem" }}>
              Confianza que se construye día a día
            </h2>
          </Reveal>
          <div className="cards-grid">
            <Reveal stagger={0}>
              <article className="card">
                <h2>Variedad de refacciones</h2>
                <p>Aceites, filtros, frenos y más para mantenimiento preventivo y correctivo de tu vehículo.</p>
              </article>
            </Reveal>
            <Reveal stagger={0.1}>
              <article className="card">
                <h2>Atención en mostrador</h2>
                <p>Te ayudamos a encontrar la pieza correcta por SKU, modelo o aplicación directa en mostrador.</p>
              </article>
            </Reveal>
            <Reveal stagger={0.2}>
              <article className="card">
                <h2>Precios claros</h2>
                <p>Consulta precios directamente en tienda y recibe asesoría sin compromiso.</p>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Location ── */}
      <section className="location-section">
        <div className="container location-grid">
          <Reveal>
            <div className="location-info">
              <p className="eyebrow">Visítanos</p>
              <h2>{SITE.city}</h2>
              <p className="location-hours">{SITE.hours}</p>
              <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="location-phone">
                {SITE.phone}
              </a>
              <p className="muted" style={{ marginTop: "0.25rem" }}>
                ¡Te esperamos! Sin cita previa.
              </p>
            </div>
          </Reveal>
          <Reveal stagger={0.15}>
            <div className="location-map">
              <iframe
                src={SITE.mapsEmbed}
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: 340 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                title="Ubicación de Refaccionaria Fortino"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="cta-band">
        <div className="container cta-inner">
          <Reveal>
            <div>
              <h2>¿Listo para tu siguiente servicio?</h2>
              <p className="muted">
                Visítanos en Vereda o accede al punto de venta desde cualquier lugar.
              </p>
            </div>
          </Reveal>
          <Reveal stagger={0.15}>
            <div className="cta-actions">
              <a href={SITE.posUrl} className="btn btn-primary btn-lg">
                Ir al punto de venta
              </a>
              <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="btn btn-ghost btn-lg">
                Llamar {SITE.phone}
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Floating phone ── */}
      <a
        href={`tel:${SITE.phone.replace(/\s/g, "")}`}
        className="float-phone"
        aria-label="Llamar a Refaccionaria Fortino"
        title="Llámanos"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      </a>
    </>
  );
}
