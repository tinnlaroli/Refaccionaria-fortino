import { useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import {

  Button,

  InlineNotification,

  Stack,

  Tag,

  Tile,

} from "@carbon/react";

import {

  ArrowRight,

  CheckmarkFilled,

  Store,

  WarningAlt,

} from "@carbon/icons-react";

import { fetchDashboardSummary, type DashboardSummary } from "../../api/dashboard.js";

import { QUICK_ACTIONS } from "../../config/modules.js";

import { BarChart } from "../../components/dashboard/BarChart.js";

import { DonutChart } from "../../components/dashboard/DonutChart.js";

import { StatCard } from "../../components/dashboard/StatCard.js";

import { carbonNavIcon } from "../../components/carbon/CarbonNavIcons.js";

import { ErrorBanner } from "../../components/carbon/PageFeedback.js";

import { EmptyState } from "../../components/EmptyState.js";

import { DashboardSkeleton } from "../../components/dashboard/DashboardSkeleton.js";

import { StockBadge } from "../../components/StockBadge.js";

import { useAuth } from "../../context/AuthContext.js";

import { usePermissions } from "../../hooks/usePermissions.js";

import { getErrorMessage } from "../../lib/errors.js";

import { buildDashboardKpis, relativeSaleTime } from "./dashboardKpis.js";



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



function shortDay(isoDate: string) {

  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("es-MX", {

    weekday: "short",

    day: "numeric",

  });

}



export function DashboardPage() {

  const { token, user } = useAuth();

  const { hasPermission, roleLabel } = usePermissions();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    if (!token) return;

    setLoading(true);

    fetchDashboardSummary(token)

      .then(setSummary)

      .catch((err) => setError(getErrorMessage(err, "No se pudo cargar el panel")))

      .finally(() => setLoading(false));

  }, [token]);



  const quickActions = QUICK_ACTIONS.filter((action) => {

    if (!action.permission) return true;

    return hasPermission(action.permission);

  });



  const alerts = useMemo(() => {

    if (!summary?.products) return [];

    const list = [];

    if (summary.products.outOfStock > 0) {

      list.push({

        kind: "error" as const,

        title: `${summary.products.outOfStock} pieza(s) sin stock`,

        text: "No se pueden vender en mostrador hasta reabastecer.",

        to: "/app/inventario?agotado=1",

        cta: "Ver agotados",

      });

    }

    if (summary.products.lowStock > 0) {

      list.push({

        kind: "warning" as const,

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

      <Stack gap={4}>

        <ErrorBanner message={error} />

        <EmptyState title="No se pudo cargar el panel" description={error} />

      </Stack>

    );

  }



  if (!summary) return null;



  const { meta } = summary;

  const canProducts = meta.canViewProducts && summary.products;

  const canSales = meta.canViewSales && summary.salesToday;

  const kpis = buildDashboardKpis(summary);



  const salesBars =

    summary.salesTrend7Days?.map((day) => ({

      label: shortDay(day.date),

      value: day.total,

    })) ?? [];



  const inventorySegments = canProducts

    ? [

        {

          label: "Stock saludable",

          value: summary.products!.healthy,

          color: "var(--cds-support-success)",

        },

        {

          label: "Stock bajo",

          value: summary.products!.lowStock,

          color: "var(--cds-support-warning)",

        },

        {

          label: "Sin existencia",

          value: summary.products!.outOfStock,

          color: "var(--cds-support-error)",

        },

      ].filter((s) => s.value > 0)

    : [];



  const lowStockItems = summary.lowStockItems ?? [];

  const recentSales = summary.recentSales ?? [];



  return (

    <div className="fortino-dash-home">

      <header className="fortino-dash-hero">

        <div className="fortino-dash-hero-text">

          <p className="fortino-dash-hero-date">{formatDate()}</p>

          <h1 className="fortino-dash-hero-title">

            {greeting()}, {user?.fullName?.split(" ")[0] ?? "equipo"}

          </h1>

          <p className="fortino-dash-hero-desc">

            Resumen operativo · <Tag type="gray" size="sm">{roleLabel}</Tag>

          </p>

        </div>

        <Button as={Link} to="/" kind="primary" renderIcon={Store} size="lg">

          Abrir mostrador

        </Button>

      </header>



      {alerts.length > 0 && (

        <div className="fortino-dash-alerts" aria-label="Alertas prioritarias">

          {alerts.map((alert) => (

            <div key={alert.to} className="fortino-dash-alert-row">

              <InlineNotification
                kind={alert.kind}
                lowContrast
                title={alert.title}
                subtitle={alert.text}
                hideCloseButton
              />

              <Button as={Link} to={alert.to} kind="ghost" size="sm" renderIcon={ArrowRight}>

                {alert.cta}

              </Button>

            </div>

          ))}

        </div>

      )}



      {kpis.length > 0 && (

        <section className="fortino-dash-kpi-row" aria-label="Indicadores clave">

          {kpis.map((kpi) => (

            <StatCard

              key={kpi.key}

              label={kpi.label}

              value={kpi.value}

              hint={kpi.hint}

              tone={kpi.tone}

              icon={kpi.icon}

              to={kpi.to}

            />

          ))}

        </section>

      )}



      <div className="fortino-dash-body">

        <div className="fortino-dash-body-main">

          {canSales && salesBars.length > 0 && (

            <Tile className="fortino-dash-panel">

              <BarChart

                title="Ventas — últimos 7 días"

                subtitle="Total diario de operaciones completadas"

                points={salesBars}

                valuePrefix="$"

                formatValue={(v) => `$${v.toFixed(2)}`}

              />

            </Tile>

          )}



          {canProducts && (

            <Tile className="fortino-dash-panel">

              <div className="fortino-dash-panel-head">

                <div>

                  <h2 className="fortino-dash-section-title">Piezas que requieren atención</h2>

                  <p className="fortino-dash-section-desc">

                    Stock bajo o agotado según el mínimo configurado.

                  </p>

                </div>

                <Link to="/app/inventario?bajo=1" className="cds--link">

                  Ver inventario

                </Link>

              </div>



              {lowStockItems.length === 0 ? (

                <div className="fortino-dash-empty-inline">

                  <CheckmarkFilled size={20} className="fortino-dash-empty-icon--ok" />

                  <span>Inventario en orden — no hay alertas pendientes.</span>

                </div>

              ) : (

                <ul className="fortino-dash-stock-list">

                  {lowStockItems.map((item) => (

                    <li key={item.id} className="fortino-dash-stock-item">

                      <div className="fortino-dash-stock-main">

                        <Tag type="gray" size="sm" className="mono">

                          {item.sku}

                        </Tag>

                        <span className="fortino-dash-stock-name">{item.name}</span>

                      </div>

                      <div className="fortino-dash-stock-meta">

                        <span

                          className={

                            item.stock <= 0 ? "fortino-text-error" : "fortino-text-warning"

                          }

                        >

                          {item.stock} / {item.minStock}

                        </span>

                        <StockBadge stock={item.stock} minStock={item.minStock} />

                      </div>

                    </li>

                  ))}

                </ul>

              )}

            </Tile>

          )}

        </div>



        <aside className="fortino-dash-body-side">

          {canProducts && inventorySegments.length > 0 && (

            <Tile className="fortino-dash-panel fortino-dash-panel--compact">

              <DonutChart

                title="Salud del inventario"

                subtitle="Piezas activas por estado"

                segments={inventorySegments}

                centerLabel="Activos"

                centerValue={summary.products!.active}

              />

            </Tile>

          )}



          {canSales && (

            <Tile className="fortino-dash-panel">

              <div className="fortino-dash-panel-head">

                <div>

                  <h2 className="fortino-dash-section-title">Últimas ventas</h2>

                  <p className="fortino-dash-section-desc">Actividad reciente en caja.</p>

                </div>

                <Link to="/app/ventas" className="cds--link">

                  Historial

                </Link>

              </div>



              {recentSales.length === 0 ? (

                <EmptyState

                  title="Sin ventas aún"

                  description="Las operaciones del mostrador aparecerán aquí."

                  action={

                    <Button as={Link} to="/" kind="tertiary" size="sm">

                      Ir al mostrador

                    </Button>

                  }

                />

              ) : (

                <ul className="fortino-dash-sales-list">

                  {recentSales.map((sale) => (

                    <li key={sale.id} className="fortino-dash-sales-item">

                      <div className="fortino-dash-sale-badge price">

                        ${Number(sale.total).toFixed(2)}

                      </div>

                      <div className="fortino-dash-sale-body">

                        <p className="fortino-dash-sale-detail">

                          {sale.items

                            .slice(0, 2)

                            .map((i) => `${i.quantity}× ${i.productName}`)

                            .join(" · ")}

                          {sale.items.length > 2 && (

                            <span className="fortino-dash-sale-more">

                              {" "}

                              +{sale.items.length - 2} más

                            </span>

                          )}

                        </p>

                        <time className="fortino-dash-sale-time" dateTime={sale.soldAt}>

                          {relativeSaleTime(sale.soldAt)}

                        </time>

                      </div>

                    </li>

                  ))}

                </ul>

              )}

            </Tile>

          )}



          {quickActions.length > 0 && (

            <Tile className="fortino-dash-panel fortino-dash-panel--compact">

              <h2 className="fortino-dash-section-title">Accesos rápidos</h2>

              <ul className="fortino-dash-quick-list">

                {quickActions.map((action) => {

                  const Icon = carbonNavIcon(action.icon);

                  return (

                    <li key={action.label}>

                      <Link to={action.path} className="fortino-dash-quick-item">

                        <span className="fortino-dash-quick-icon">

                          <Icon size={18} />

                        </span>

                        <span className="fortino-dash-quick-text">

                          <span className="fortino-dash-quick-label">{action.label}</span>

                          <span className="fortino-dash-quick-desc">{action.description}</span>

                        </span>

                        <ArrowRight size={16} aria-hidden />

                      </Link>

                    </li>

                  );

                })}

              </ul>

            </Tile>

          )}



          {!canSales && !canProducts && (

            <Tile className="fortino-dash-panel">

              <div className="fortino-dash-empty-inline">

                <WarningAlt size={20} />

                <span>Tu perfil tiene acceso limitado al panel.</span>

              </div>

            </Tile>

          )}

        </aside>

      </div>

    </div>

  );

}

