import { SITE } from "../config/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <strong>{SITE.name}</strong>
          <p className="muted">{SITE.tagline}</p>
        </div>
        <div className="footer-contact">
          <p>
            <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="footer-phone">
              {SITE.phone}
            </a>
          </p>
          <p className="muted">{SITE.hours}</p>
          <p className="muted">{SITE.city}</p>
        </div>
        <div className="footer-pos">
          <a href={SITE.posUrl} className="btn btn-primary btn-sm">
            Punto de venta
          </a>
        </div>
      </div>
      <p className="footer-copy container">
        © {year} {SITE.name}. Todos los derechos reservados.
      </p>
    </footer>
  );
}
