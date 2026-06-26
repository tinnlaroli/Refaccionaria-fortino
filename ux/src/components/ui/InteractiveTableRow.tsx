import { Button, Table } from "@heroui/react";
import {
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";

export type TableRowAction = {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  onClick: () => void;
  variant?: "ghost" | "danger";
};

type Props = ComponentProps<typeof Table.Row> & {
  onOpen?: () => void;
  actions?: TableRowAction[];
  /** Reserva celda vacía para alinear con columna de acciones del encabezado. */
  reserveActionsColumn?: boolean;
  children: ReactNode;
  ariaLabel?: string;
};

export function InteractiveTableRow({
  onOpen,
  actions = [],
  reserveActionsColumn = false,
  children,
  ariaLabel,
  className,
  ...rowProps
}: Props) {
  const [hovered, setHovered] = useState(false);
  const showActions = actions.length > 0 && hovered;
  const showActionsColumn = reserveActionsColumn || actions.length > 0;

  const handleRowClick = (event: MouseEvent<HTMLTableRowElement>) => {
    if ((event.target as HTMLElement).closest(".fortino-row-actions")) return;
    onOpen?.();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (!onOpen) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };

  return (
    <Table.Row
      {...rowProps}
      className={`fortino-interactive-row${hovered ? " fortino-interactive-row--hover" : ""} ${className ?? ""}`.trim()}
      onClick={handleRowClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setHovered(false);
        }
      }}
      tabIndex={onOpen ? 0 : undefined}
      aria-label={ariaLabel}
    >
      {children}
      {showActionsColumn && (
        <Table.Cell className="fortino-row-actions-cell" aria-hidden={!showActions && actions.length === 0}>
          {actions.length > 0 ? (
            <div
              className={`fortino-row-actions${showActions ? " fortino-row-actions--visible" : ""}`}
              role="toolbar"
              aria-label="Acciones de fila"
              aria-hidden={!showActions}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              {actions.map((action) => (
                <Button
                  key={action.label}
                  variant={action.variant === "danger" ? "danger" : "ghost"}
                  size="sm"
                  isIconOnly
                  aria-label={action.label}
                  onPress={() => action.onClick()}
                >
                  <action.icon size={18} />
                </Button>
              ))}
            </div>
          ) : null}
        </Table.Cell>
      )}
    </Table.Row>
  );
}

/** Columna reservada (sin encabezado) para la barra de acciones flotante. */
export const TABLE_ACTIONS_RAIL = { key: "_rail", header: "" } as const;
