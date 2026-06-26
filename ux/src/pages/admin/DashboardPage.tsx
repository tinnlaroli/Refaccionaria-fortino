import { useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import { Alert, Button, Chip } from "@heroui/react";

import {

  ArrowRight,

  CircleCheck,

  CreditCard,

  DollarSign,

  Store,

  AlertTriangle,

  TrendingUp,

} from "lucide-react";

import { fetchDashboardSummary, type DashboardSummary } from "../../api/dashboard.js";

import { QUICK_ACTIONS } from "../../config/modules.js";

import { DashboardHeroStrip, formatHeroMoney } from "../../components/dashboard/DashboardHeroStrip.js";

import { DonutChart } from "../../components/dashboard/DonutChart.js";

import { HorizontalBarChart } from "../../components/dashboard/HorizontalBarChart.js";

import { SalesTrendChart } from "../../components/dashboard/SalesTrendChart.js";

import { StatCard } from "../../components/dashboard/StatCard.js";

import { HelpButton } from "../../components/help/HelpButton.js";

import { navIcon } from "../../components/ui/NavIcons.js";

import { ErrorBanner } from "../../components/ui/PageFeedback.js";

import { EmptyState } from "../../components/EmptyState.js";

import { DashboardSkeleton } from "../../components/dashboard/DashboardSkeleton.js";

import { StockBadge } from "../../components/StockBadge.js";

import { useAuth } from "../../context/AuthContext.js";

import { usePermissions } from "../../hooks/usePermissions.js";

import { getErrorMessage } from "../../lib/errors.js";

import { calcTrendPct, formatMoney } from "../../lib/dashboardFormat.js";

import { buildDashboardKpis, relativeSaleTime } from "./dashboardKpis.js";



const PAYMENT_LABELS: Record<string, string> = {

  cash: "Efectivo",

  card: "Tarjeta",

  transfer: "Transferencia",

};



const PAYMENT_COLORS: Record<string, string> = {

  cash: "var(--fortino-success, #24a148)",

  card: "var(--fortino-accent, #0f62fe)",

  transfer: "var(--fortino-warning, #f1c21b)",

};



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

        status: "danger" as const,

        title: `${summary.products.outOfStock} pieza(s) sin stock`,

        text: "No se pueden vender en mostrador hasta reabastecer.",

        to: "/app/inventario?agotado=1",

        cta: "Ver agotados",

      });

    }

    if (summary.products.lowStock > 0) {

      list.push({

        status: "warning" as const,

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

      <div className="flex flex-col gap-4">

        <ErrorBanner message={error} />

        <EmptyState title="No se pudo cargar el panel" description={error} />

      </div>

    );

  }



  if (!summary) return null;



  const { meta } = summary;

  const canProducts = meta.canViewProducts && summary.products;

  const canSales = meta.canViewSales && summary.salesToday;

  const kpis = buildDashboardKpis(summary);



  const salesTrend =

    summary.salesTrend7Days?.map((day) => ({

      label: shortDay(day.date),

      total: day.total,

      count: day.count,

    })) ?? [];



  const inventorySegments = canProducts

    ? [

        {

          label: "Stock saludable",

          value: summary.products!.healthy,

          color: "var(--fortino-success, #24a148)",

        },

        {

          label: "Stock bajo",

          value: summary.products!.lowStock,

          color: "var(--fortino-warning, #f1c21b)",

        },

        {

          label: "Sin existencia",

          value: summary.products!.outOfStock,

          color: "var(--fortino-error, #da1e28)",

        },

      ].filter((s) => s.value > 0)

    : [];



  const paymentSegments =

    summary.paymentBreakdown7Days?.map((row) => ({

      label: PAYMENT_LABELS[row.method] ?? row.method,

      value: row.total,

      color: PAYMENT_COLORS[row.method] ?? "var(--fortino-accent, #0f62fe)",

    })) ?? [];



  const topProducts =

    summary.topProducts7Days?.map((p) => ({

      label: p.productName,

      value: p.quantity,

      sublabel: formatMoney(p.revenue),

    })) ?? [];



  const lowStockItems = summary.lowStockItems ?? [];

  const recentSales = summary.recentSales ?? [];



  const heroStripItems = [];

  if (canSales && summary.salesToday) {

    heroStripItems.push({

      key: "today",

      label: "Hoy",

      value: formatHeroMoney(summary.salesToday.total),

      hint: `${summary.salesToday.count} ventas`,

      icon: <DollarSign size={18} />,

    });

    if (summary.salesWeek) {

      heroStripItems.push({

        key: "week",

        label: "Semana",

        value: formatHeroMoney(summary.salesWeek.total),

        hint: `${summary.salesWeek.count} operaciones`,

        icon: <TrendingUp size={18} />,

      });

    }

  }

  if (canProducts && summary.inventoryValue) {

    heroStripItems.push({

      key: "stock-value",

      label: "Inventario",

      value: formatHeroMoney(summary.inventoryValue.atSale),

      hint: "Valor a precio de venta",

      icon: <Store size={18} />,

    });

  }

  if (summary.cash) {

    heroStripItems.push({

      key: "shifts",

      label: "Cajas",

      value: String(summary.cash.openShifts),

      hint: summary.cash.openShifts > 0 ? "Turnos abiertos" : "Sin turno activo",

      icon: <CreditCard size={18} />,

    });

  }



  const salesDelta =

    canSales && summary.salesToday && summary.salesYesterday

      ? calcTrendPct(summary.salesToday.total, summary.salesYesterday.total)

      : null;



  return (

    <div className="fortino-dash-home">

      <header className="fortino-dash-hero">

        <div className="fortino-dash-hero-main">

          <div className="fortino-dash-hero-text">

            <p className="fortino-dash-hero-date">{formatDate()}</p>

            <h1 className="fortino-dash-hero-title">

              {greeting()}, {user?.fullName?.split(" ")[0] ?? "equipo"}

            </h1>

            <p className="fortino-dash-hero-desc">

              Panel operativo ·{" "}

              <Chip size="sm" variant="flat">

                <Chip.Label>{roleLabel}</Chip.Label>

              </Chip>

              {salesDelta !== null && salesDelta !== 0 && (

                <span className="fortino-dash-hero-delta">

                  {salesDelta > 0 ? "+" : ""}

                  {salesDelta}% ventas vs ayer

                </span>

              )}

            </p>

          </div>

          <div className="fortino-dash-hero-actions">

            <HelpButton variant="secondary" showLabel />

            <Link to="/">

              <Button variant="primary" size="lg">

                <Store size={18} />

                Abrir mostrador

              </Button>

            </Link>

          </div>

        </div>

        {heroStripItems.length > 0 && <DashboardHeroStrip items={heroStripItems} />}

      </header>



      {alerts.length > 0 && (

        <div className="fortino-dash-alerts" aria-label="Alertas prioritarias">

          {alerts.map((alert) => (

            <div key={alert.to} className="fortino-dash-alert-row">

              <Alert status={alert.status} className="flex-1">

                <Alert.Indicator />

                <Alert.Content>

                  <Alert.Title>{alert.title}</Alert.Title>

                  <Alert.Description>{alert.text}</Alert.Description>

                </Alert.Content>

              </Alert>

              <Link to={alert.to}>

                <Button variant="ghost" size="sm">

                  {alert.cta}

                  <ArrowRight size={16} />

                </Button>

              </Link>

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

              delta={kpi.delta}

            />

          ))}

        </section>

      )}



      <section className="fortino-dash-analytics" aria-label="Análisis operativo">

        {canSales && salesTrend.length > 0 && (

          <div className="fortino-dash-panel fortino-dash-panel--chart">

            <SalesTrendChart

              title="Tendencia de ventas"

              subtitle="Ingresos y operaciones · últimos 7 días"

              points={salesTrend}

            />

          </div>

        )}



        {canSales && paymentSegments.length > 0 && (

          <div className="fortino-dash-panel fortino-dash-panel--compact">

            <DonutChart

              title="Mix de cobro"

              subtitle="Por forma de pago · 7 días"

              segments={paymentSegments}

              centerLabel="Total"

              centerValue={formatHeroMoney(

                summary.paymentBreakdown7Days?.reduce((s, p) => s + p.total, 0) ?? 0,

              )}

            />

          </div>

        )}



        {canSales && topProducts.length > 0 && (

          <div className="fortino-dash-panel fortino-dash-panel--chart">

            <HorizontalBarChart

              title="Productos más vendidos"

              subtitle="Unidades vendidas · 7 días"

              points={topProducts}

              formatValue={(v) => `${v} uds`}

            />

          </div>

        )}



        {canProducts && inventorySegments.length > 0 && (

          <div className="fortino-dash-panel fortino-dash-panel--compact">

            <DonutChart

              title="Salud del inventario"

              subtitle="Piezas activas por estado"

              segments={inventorySegments}

              centerLabel="Activos"

              centerValue={summary.products!.active}

            />

          </div>

        )}

      </section>



      <div className="fortino-dash-body">

        <div className="fortino-dash-body-main">

          {canProducts && (

            <div className="fortino-dash-panel">

              <div className="fortino-dash-panel-head">

                <div>

                  <h2 className="fortino-dash-section-title">Piezas que requieren atención</h2>

                  <p className="fortino-dash-section-desc">

                    Stock bajo o agotado según el mínimo configurado.

                  </p>

                </div>

                <Link to="/app/inventario?bajo=1" className="fortino-dash-panel-link">

                  Ver inventario

                  <ArrowRight size={14} />

                </Link>

              </div>



              {lowStockItems.length === 0 ? (

                <div className="fortino-dash-empty-inline">

                  <CircleCheck size={20} className="fortino-dash-empty-icon--ok" />

                  <span>Inventario en orden — no hay alertas pendientes.</span>

                </div>

              ) : (

                <ul className="fortino-dash-stock-list">

                  {lowStockItems.map((item) => (

                    <li key={item.id} className="fortino-dash-stock-item">

                      <div className="fortino-dash-stock-main">

                        <Chip size="sm" variant="flat">

                          <Chip.Label className="mono">{item.sku}</Chip.Label>

                        </Chip>

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

            </div>

          )}

        </div>



        <aside className="fortino-dash-body-side">

          {canSales && (

            <div className="fortino-dash-panel">

              <div className="fortino-dash-panel-head">

                <div>

                  <h2 className="fortino-dash-section-title">Últimas ventas</h2>

                  <p className="fortino-dash-section-desc">Actividad reciente en caja.</p>

                </div>

                <Link to="/app/ventas" className="fortino-dash-panel-link">

                  Historial

                  <ArrowRight size={14} />

                </Link>

              </div>



              {recentSales.length === 0 ? (

                <EmptyState

                  title="Sin ventas aún"

                  description="Las operaciones del mostrador aparecerán aquí."

                  action={

                    <Link to="/">

                      <Button variant="tertiary" size="sm">

                        Ir al mostrador

                      </Button>

                    </Link>

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

            </div>

          )}



          {quickActions.length > 0 && (

            <div className="fortino-dash-panel fortino-dash-panel--compact">

              <div className="fortino-dash-panel-head">

                <h2 className="fortino-dash-section-title">Accesos rápidos</h2>

              </div>

              <ul className="fortino-dash-quick-list">

                {quickActions.map((action) => {

                  const Icon = navIcon(action.icon);

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

            </div>

          )}



          {!canSales && !canProducts && (

            <div className="fortino-dash-panel">

              <div className="fortino-dash-empty-inline">

                <AlertTriangle size={20} />

                <span>Tu perfil tiene acceso limitado al panel.</span>

              </div>

            </div>

          )}

        </aside>

      </div>

    </div>

  );

}

