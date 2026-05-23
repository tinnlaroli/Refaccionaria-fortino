import { Link } from "react-router-dom";
import { SITE } from "../config/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <strong>{SITE.name}</strong>
          <p>{SITE.tagline}</p>
          <p className="muted">{SITE.city}</p>
        </div>
        <div>
          <strong>Enlaces</strong>
          <ul className="footer-links">
            <li>
              <Link to="/catalogo">Catálogo</Link>
            </li>
            <li>
              <Link to="/contacto">Ubicación y contacto</Link>
            </li>
            <li>
              <a href={SITE.posUrl}>Acceso empleados (POS)</a>
            </li>
          </ul>
        </div>
        <div>
          <strong>Contacto</strong>
          <p>
            <a href={`tel:${SITE.phone.replace(/\s/g, "")}`}>{SITE.phone}</a>
          </p>
          <p>
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          </p>
        </div>
      </div>
      <p className="footer-copy container">
        © {year} {SITE.name}. Todos los derechos reservados.
      </p>
    </footer>
  );
}
