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
  const count = useCounter(end, 2200, inView);
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
    text: "Aceites de motor, transmisión y lubricantes para el mantenimiento de tu vehículo.",
  },
  {
    title: "Sistema de frenos",
    text: "Pastillas, discos y componentes de frenado para todas las marcas y modelos.",
  },
  {
    title: "Filtros",
    text: "Filtros de aceite, aire, combustible y cabina para proteger tu motor.",
  },
  {
    title: "Baterías",
    text: "Baterías de arranque con garantía. Entrega inmediata en mostrador.",
  },
  {
    title: "Suspensión y dirección",
    text: "Amortiguadores, resortes, rótulas y piezas de suspensión.",
  },
  {
    title: "Cuidado automotriz",
    text: "Limpiaparabrisas, aditivos, anticongelantes y productos de limpieza.",
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

      {/* ══════ Hero ══════ */}
      <section className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="container hero-inner">
          <Reveal stagger={0}>
            <p className="eyebrow">{SITE.city}</p>
          </Reveal>
          <Reveal stagger={0.12}>
            <h1>{SITE.name}</h1>
          </Reveal>
          <Reveal stagger={0.24}>
            <p className="hero-lead">
              Repuestos, aceites y refacciones para tu vehículo, con el
              compromiso de servir a Tezonapa y toda la región.
            </p>
          </Reveal>
          <Reveal stagger={0.36}>
            <div className="hero-actions">
              <a href={SITE.posUrl} className="btn btn-primary btn-lg pulse-glow">
                Ir al punto de venta
              </a>
              <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="btn btn-ghost btn-lg">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "0.4rem" }}>
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Llamar ahora
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════ Story ══════ */}
      <section className="story-section">
        <div className="section-divider-top" aria-hidden="true" />
        <div className="container">
          <Reveal>
            <div className="story-grid">
              <div className="story-content">
                <p className="eyebrow">Nuestra historia</p>
                <h2>Nacimos para mantener a Tezonapa en movimiento</h2>
                <p>
                  Refaccionaria Fortino abrió sus puertas en Vereda con una
                  convicción: que los conductores de la región encontraran la
                  pieza exacta que necesitan, sin tener que viajar hasta la
                  ciudad.
                </p>
                <p>
                  Día a día crecemos con la comunidad. Atendemos a mecánicos,
                  transportistas y familias que nos eligen porque encuentran
                  refacciones de calidad y un trato honesto.
                </p>
                <div className="story-quote">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginBottom: "-0.2rem", marginRight: "0.3rem", opacity: 0.6 }}>
                    <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z" />
                  </svg>
                  <span>No solo vendemos piezas. Ayudamos a que la gente siga adelante.</span>
                </div>
              </div>
              <div className="story-visual">
                <div className="timeline-card">
                  <div className="timeline-dot top" />
                  <div className="timeline-line" />
                  <div className="timeline-dot bottom" />
                  <div className="timeline-node">
                    <span className="timeline-year" style={{ fontSize: "1.25rem" }}>2026</span>
                    <span className="timeline-label">Apertura en Vereda</span>
                  </div>
                  <div className="timeline-node" style={{ marginTop: "auto" }}>
                    <span className="timeline-year" style={{ fontSize: "1.25rem", opacity: 0.5 }}>Hoy</span>
                    <span className="timeline-label">Crecemos contigo</span>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════ Stats ══════ */}
      <section className="stats-section">
        <div className="section-divider-alt" aria-hidden="true" />
        <div className="container">
          <Reveal>
            <p className="eyebrow" style={{ textAlign: "center", marginBottom: "0.25rem" }}>Nuestro inicio</p>
            <h2 className="section-title">Cifras que crecen día a día</h2>
          </Reveal>
          <div className="stats-grid">
            <Reveal stagger={0}>
              <StatItem label="Clientes atendidos" end={180} suffix="+" />
            </Reveal>
            <Reveal stagger={0.1}>
              <StatItem label="Piezas vendidas" end={950} suffix="+" />
            </Reveal>
            <Reveal stagger={0.2}>
              <StatItem label="Municipios alcanzados" end={5} suffix="" />
            </Reveal>
            <Reveal stagger={0.3}>
              <StatItem label="Marcas disponibles" end={12} suffix="+" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════ Services ══════ */}
      <section className="services-section">
        <div className="section-divider-top" aria-hidden="true" />
        <div className="container">
          <Reveal>
            <p className="eyebrow" style={{ textAlign: "center", marginBottom: "0.25rem" }}>Lo que ofrecemos</p>
            <h2 className="section-title">Todo lo que tu vehículo necesita</h2>
          </Reveal>
          <div className="services-grid">
            {SERVICES.map((svc, i) => (
              <Reveal key={svc.title} stagger={i * 0.07}>
                <article className="service-card">
                  <div className="service-icon-wrap">
                    <span className="service-icon-label">{svc.title.charAt(0)}</span>
                  </div>
                  <h3>{svc.title}</h3>
                  <p>{svc.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ Highlights ══════ */}
      <section className="highlights-section">
        <div className="section-divider-alt" aria-hidden="true" />
        <div className="container">
          <Reveal>
            <p className="eyebrow" style={{ textAlign: "center", marginBottom: "0.25rem" }}>Por qué elegirnos</p>
            <h2 className="section-title">Confianza que se construye día a día</h2>
          </Reveal>
          <div className="cards-grid">
            <Reveal stagger={0}>
              <article className="card">
                <div className="card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 21V9" />
                  </svg>
                </div>
                <h2>Variedad de refacciones</h2>
                <p>Aceites, filtros, frenos, baterías, suspensión y más. Todo para el mantenimiento de tu vehículo en un solo lugar.</p>
              </article>
            </Reveal>
            <Reveal stagger={0.1}>
              <article className="card">
                <div className="card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h2>Atención en mostrador</h2>
                <p>Te ayudamos a encontrar la pieza correcta por SKU, modelo o aplicación. Asesoría directa y sin vueltas.</p>
              </article>
            </Reveal>
            <Reveal stagger={0.2}>
              <article className="card">
                <div className="card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <h2>Precios claros</h2>
                <p>Sin sorpresas. Consulta precios en mostrador y recibe asesoría honesta antes de decidir.</p>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════ Location ══════ */}
      <section className="location-section">
        <div className="section-divider-top" aria-hidden="true" />
        <div className="container location-grid">
          <Reveal>
            <div className="location-info">
              <p className="eyebrow">Ubicación</p>
              <h2>{SITE.city}</h2>
              <div className="location-detail">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                <span>{SITE.hours}</span>
              </div>
              <div className="location-detail">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                <span>Vereda, Tezonapa, Veracruz</span>
              </div>
              <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="location-phone">
                {SITE.phone}
              </a>
              <p className="muted" style={{ fontSize: "0.875rem" }}>Sin cita previa — te esperamos.</p>
            </div>
          </Reveal>
          <Reveal stagger={0.15}>
            <div className="location-map">
              <iframe
                src={SITE.mapsEmbed}
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: 360 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                title="Ubicación de Refaccionaria Fortino"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════ CTA ══════ */}
      <section className="cta-band">
        <div className="container cta-inner">
          <Reveal>
            <div className="cta-actions">
              <a href={SITE.posUrl} className="btn btn-primary btn-lg pulse-glow">
                Ir al punto de venta
              </a>
              <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="btn btn-ghost btn-lg">
                Llamar {SITE.phone}
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════ Floating phone ══════ */}
      <a
        href={`tel:${SITE.phone.replace(/\s/g, "")}`}
        className="float-phone"
        aria-label="Llamar a Refaccionaria Fortino"
      >
        <span className="float-phone-ring" aria-hidden="true" />
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      </a>
    </>
  );
}
