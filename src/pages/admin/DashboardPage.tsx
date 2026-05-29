import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDashboardSummary, type DashboardSummary } from "../../api/dashboard.js";
import { QUICK_ACTIONS } from "../../config/modules.js";
import { EmptyState } from "../../components/EmptyState.js";
import { DashboardSkeleton } from "../../components/dashboard/DashboardSkeleton.js";
import { NavIcon } from "../../components/dashboard/NavIcon.js";
import { StockBadge } from "../../components/StockBadge.js";
import { useAuth } from "../../context/AuthContext.js";
import { usePermissions } from "../../hooks/usePermissions.js";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

function formatDate() {
  return new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function DashboardPage() {
  const { token, user } = useAuth();
  const { hasPermission } = usePermissions();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchDashboardSummary(token)
      .then(setSummary)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "No se pudo cargar el panel"),
      )
      .finally(() => setLoading(false));
  }, [token]);

  const quickActions = QUICK_ACTIONS.filter((action) => {
    if (!action.permission) return true;
    return hasPermission(action.permission);
  });

  const alerts = useMemo(() => {
    if (!summary) return [];
    const list = [];
    if (summary.products.outOfStock > 0) {
      list.push({
        tone: "danger" as const,
        title: `${summary.products.outOfStock} pieza(s) sin stock`,
        text: "No se pueden vender en mostrador hasta reabastecer.",
        to: "/app/inventario?agotado=1",
        cta: "Ver agotados",
      });
    }
    if (summary.products.lowStock > 0) {
      list.push({
        tone: "warning" as const,
        title: `${summary.products.lowStock} alerta(s) de stock bajo`,
        text: "Piezas por debajo del mínimo configurado.",
        to: "/app/inventario?bajo=1",
        cta: "Reabastecer",
      });
    }
    return list;
  }, [summary]);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="dashboard-page">
        <EmptyState title="No se pudo cargar el panel" description={error} />
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="dashboard-page">
      <section className="dash-hero">
        <div className="dash-hero-text">
          <span className="dash-hero-date">{formatDate()}</span>
          <h2>
            {greeting()}, {user?.fullName?.split(" ")[0] ?? "equipo"}
          </h2>
          <p>
            Aquí tienes lo esencial de hoy: ventas, inventario y accesos directos
            para operar la refaccionaria.
          </p>
        </div>
        <Link to="/" className="btn-primary dash-hero-cta">
          <NavIcon name="pos" size={18} />
          Abrir mostrador
        </Link>
      </section>

      {alerts.length > 0 && (
        <section className="dash-alerts" aria-label="Alertas prioritarias">
          {alerts.map((alert) => (
            <div key={alert.to} className={`dash-alert dash-alert-${alert.tone}`}>
              <NavIcon name="alert" size={20} />
              <div className="dash-alert-body">
                <strong>{alert.title}</strong>
                <span>{alert.text}</span>
              </div>
              <Link to={alert.to} className="dash-alert-link">
                {alert.cta}
                <NavIcon name="chevron" size={16} />
              </Link>
            </div>
          ))}
        </section>
      )}

      <section className="dash-metrics-primary">
        <Link to="/app/ventas" className="metric-hero metric-hero-link">
          <span className="metric-label">Ventas de hoy</span>
          <strong className="metric-value-lg">${summary.salesToday.total.toFixed(2)}</strong>
          <span className="metric-hint">
            {summary.salesToday.count} operacion{summary.salesToday.count === 1 ? "" : "es"}
          </span>
        </Link>
        <div className="metric-stack">
          <Link to="/app/productos" className="metric-compact metric-compact-link">
            <span className="metric-label">Productos activos</span>
            <strong>{summary.products.active}</strong>
            <span className="metric-hint">{summary.products.total} en catálogo</span>
          </Link>
          <Link
            to="/app/inventario?bajo=1"
            className="metric-compact metric-compact-link metric-compact-warning"
          >
            <span className="metric-label">Stock bajo</span>
            <strong>{summary.products.lowStock}</strong>
            <span className="metric-hint">Por reabastecer</span>
          </Link>
        </div>
      </section>

      <div className="dash-workspace">
        <section className="dashboard-section dash-guide">
          <div className="section-header">
            <div>
              <h2>¿Qué quieres hacer?</h2>
              <p>Accesos guiados a las tareas más frecuentes.</p>
            </div>
          </div>
          <ul className="guide-actions">
            {quickActions.map((action) => (
              <li key={action.label}>
                <Link to={action.path} className="guide-action-card">
                  <span className="guide-action-icon">
                    <NavIcon name={action.icon} size={20} />
                  </span>
                  <span className="guide-action-text">
                    <strong>{action.label}</strong>
                    <small>{action.description}</small>
                  </span>
                  <NavIcon name="chevron" size={18} className="guide-action-chevron" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="dashboard-section dash-secondary-stats">
          <h2 className="section-title-sm">Operación</h2>
          <dl className="stat-list">
            <div>
              <dt>Sin stock</dt>
              <dd>
                <Link to="/app/inventario?agotado=1">{summary.products.outOfStock}</Link>
              </dd>
            </div>
            <div>
              <dt>Categorías</dt>
              <dd>
                <Link to="/app/categorias">{summary.categories}</Link>
              </dd>
            </div>
            <div>
              <dt>Empleados activos</dt>
              <dd>
                <Link to="/app/empleados">{summary.users.active}</Link>
              </dd>
            </div>
            <div>
              <dt>Turnos abiertos</dt>
              <dd>{summary.cash.openShifts}</dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="dashboard-columns">
        <section className="dashboard-section">
          <div className="section-header">
            <div>
              <h2>Alertas de inventario</h2>
              <p>Piezas que requieren atención inmediata.</p>
            </div>
            <Link to="/app/inventario?bajo=1">Ver todo</Link>
          </div>
          {summary.lowStockItems.length === 0 ? (
            <EmptyState
              title="Inventario en orden"
              description="No hay piezas por debajo del mínimo."
            />
          ) : (
            <table className="data-table data-table-compact">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Producto</th>
                  <th>Stock</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {summary.lowStockItems.map((item) => (
                  <tr key={item.id}>
                    <td className="sku">{item.sku}</td>
                    <td>{item.name}</td>
                    <td className={item.stock <= 0 ? "stock-out" : "stock-low"}>
                      {item.stock} / {item.minStock}
                    </td>
                    <td>
                      <StockBadge stock={item.stock} minStock={item.minStock} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="dashboard-section">
          <div className="section-header">
            <div>
              <h2>Últimas ventas</h2>
              <p>Actividad reciente en caja.</p>
            </div>
            <Link to="/app/ventas">Historial</Link>
          </div>
          {summary.recentSales.length === 0 ? (
            <EmptyState
              title="Sin ventas aún"
              description="Las operaciones del mostrador aparecerán aquí."
              action={
                <Link to="/" className="btn-primary">
                  Ir al mostrador
                </Link>
              }
            />
          ) : (
            <ul className="recent-list recent-list-rich">
              {summary.recentSales.map((sale) => (
                <li key={sale.id}>
                  <div className="recent-sale-main">
                    <strong className="price">${Number(sale.total).toFixed(2)}</strong>
                    <span>
                      {sale.items
                        .slice(0, 2)
                        .map((i) => `${i.quantity}x ${i.productName}`)
                        .join(" · ")}
                      {sale.items.length > 2 && ` +${sale.items.length - 2}`}
                    </span>
                  </div>
                  <time>{new Date(sale.soldAt).toLocaleString("es-MX")}</time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
