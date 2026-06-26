import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, Button, Chip, Table } from "@heroui/react";
import { RefreshCw, Trash2, Wifi, WifiOff } from "lucide-react";
import { useAuth } from "../context/AuthContext.js";
import { useToast } from "../context/ToastContext.js";
import { EmptyState } from "../components/EmptyState.js";
import { DataPanel } from "../components/ui/DataPanel.js";
import { PageStatStrip, PageToolbar, PageToolbarGroup } from "../components/ui/PageToolbar.js";
import {
  discardQueueItem,
  getActiveQueueItems,
  purgeSyncedQueue,
  retryAllFailed,
} from "../api/sync.js";
import type { TransactionQueueRow } from "../db/dexie.js";
import { useOnline } from "../hooks/useOnline.js";

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
};

function queueTotal(items: TransactionQueueRow["items"]) {
  return items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
}

export function SyncPage() {
  const { token, sync, pendingSales, failedSales, refreshPending } = useAuth();
  const { success, error: toastError } = useToast();
  const online = useOnline();
  const [rows, setRows] = useState<TransactionQueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const items = await getActiveQueueItems();
      setRows(items.reverse());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [load, pendingSales, failedSales]);

  const handleSyncAll = async () => {
    if (!token || !online) return;
    setBusy(true);
    try {
      await sync();
      await load();
      success("Sincronización completada");
    } catch {
      toastError("No se pudo sincronizar");
    } finally {
      setBusy(false);
    }
  };

  const handleRetryFailed = async () => {
    if (!token || !online) return;
    setBusy(true);
    try {
      const { errors } = await retryAllFailed(token);
      await refreshPending();
      await load();
      if (errors > 0) {
        toastError(`${errors} venta(s) siguen con error`);
      } else {
        success("Ventas reintentadas correctamente");
      }
    } catch {
      toastError("Error al reintentar");
    } finally {
      setBusy(false);
    }
  };

  const handleDiscard = async (id: number) => {
    if (!window.confirm("¿Descartar esta venta de la cola local? No se enviará al servidor.")) {
      return;
    }
    await discardQueueItem(id);
    await refreshPending();
    await load();
    success("Venta descartada de la cola");
  };

  const handlePurge = async () => {
    const removed = await purgeSyncedQueue();
    if (removed > 0) success(`${removed} registro(s) antiguos eliminados`);
    else success("No había registros antiguos por limpiar");
  };

  return (
    <div className="fortino-pos-main fortino-sync-page">
      <header className="fortino-page-header">
        <div>
          <h1 className="fortino-heading-section">Cola de sincronización</h1>
          <p className="fortino-lead">
            Ventas guardadas en este dispositivo hasta que se envíen al servidor.
          </p>
        </div>
      </header>

      {!online && (
        <Alert status="warning" className="mb-4">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Sin conexión</Alert.Title>
            <Alert.Description>
              Las ventas se conservan aquí. Sincroniza cuando vuelva la red.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      {failedSales > 0 && online && (
        <Alert status="danger" className="mb-4">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Ventas con error</Alert.Title>
            <Alert.Description>
              {failedSales} venta(s) no se pudieron enviar. Revisa el mensaje, reintenta o descarta duplicados.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      )}

      <PageToolbar className="mb-4">
        <PageToolbarGroup>
          <PageStatStrip label="Pendientes" value={pendingSales} />
          <PageStatStrip
            label="Con error"
            value={<span className={failedSales > 0 ? "fortino-text-error" : undefined}>{failedSales}</span>}
          />
          <PageStatStrip label="En cola" value={rows.length} />
        </PageToolbarGroup>
        <PageToolbarGroup>
          <Button
            variant="primary"
            onPress={handleSyncAll}
            isDisabled={!online || busy || (pendingSales === 0 && failedSales === 0)}
          >
            <RefreshCw size={16} className={busy ? "animate-spin" : undefined} />
            Sincronizar todo
          </Button>
          {failedSales > 0 && (
            <Button variant="tertiary" onPress={handleRetryFailed} isDisabled={!online || busy}>
              Reintentar errores
            </Button>
          )}
          <Button variant="ghost" size="sm" onPress={handlePurge}>
            Limpiar historial
          </Button>
        </PageToolbarGroup>
      </PageToolbar>

      <DataPanel
        title="Ventas en cola"
        description={online ? "Conectado al servidor" : "Modo sin conexión"}
        actions={
          online ? (
            <Chip size="sm" color="success" variant="flat">
              <Wifi size={14} aria-hidden />
              <Chip.Label>En línea</Chip.Label>
            </Chip>
          ) : (
            <Chip size="sm" color="warning" variant="flat">
              <WifiOff size={14} aria-hidden />
              <Chip.Label>Offline</Chip.Label>
            </Chip>
          )
        }
      >
        {loading && rows.length === 0 ? (
          <p className="fortino-lead">Cargando cola…</p>
        ) : rows.length === 0 ? (
          <EmptyState
            title="Cola vacía"
            description="Todas las ventas están sincronizadas con el servidor."
            action={
              <Link to="/">
                <Button variant="primary">Volver al mostrador</Button>
              </Link>
            }
          />
        ) : (
          <Table aria-label="Cola de sincronización">
            <Table.ScrollContainer>
              <Table.Content>
                <Table.Header>
                  <Table.Column isRowHeader>Fecha</Table.Column>
                  <Table.Column>Detalle</Table.Column>
                  <Table.Column>Total</Table.Column>
                  <Table.Column>Estado</Table.Column>
                  <Table.Column>Mensaje</Table.Column>
                  <Table.Column>Acciones</Table.Column>
                </Table.Header>
                <Table.Body>
                  {rows.map((row) => (
                    <Table.Row key={String(row.id)} id={String(row.id)}>
                      <Table.Cell>
                        {new Date(row.soldAt).toLocaleString("es-MX", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </Table.Cell>
                      <Table.Cell>
                        {row.items.length} · {PAYMENT_LABELS[row.paymentMethod ?? "cash"] ?? "—"}
                      </Table.Cell>
                      <Table.Cell className="mono">
                        ${queueTotal(row.items).toFixed(2)}
                      </Table.Cell>
                      <Table.Cell>
                        {row.status === "error" ? (
                          <Chip color="danger" size="sm">
                            <Chip.Label>Error</Chip.Label>
                          </Chip>
                        ) : (
                          <Chip color="accent" size="sm">
                            <Chip.Label>Pendiente</Chip.Label>
                          </Chip>
                        )}
                      </Table.Cell>
                      <Table.Cell className="max-w-[12rem] truncate text-sm" title={row.error ?? undefined}>
                        {row.error ?? "—"}
                      </Table.Cell>
                      <Table.Cell>
                        {row.id != null && (
                          <Button
                            variant="ghost"
                            size="sm"
                            isIconOnly
                            aria-label="Descartar venta de la cola"
                            onPress={() => handleDiscard(row.id!)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}
      </DataPanel>
    </div>
  );
}
