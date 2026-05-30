import { IconButton, TableCell, TableRow } from "@carbon/react";
import { useState, type ComponentProps, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";

export type TableRowAction = {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  onClick: () => void;
  kind?: "ghost" | "danger--ghost";
};

type Props = {
  rowProps: ComponentProps<typeof TableRow>;
  onOpen?: () => void;
  actions?: TableRowAction[];
  children: ReactNode;
  ariaLabel?: string;
};

export function InteractiveTableRow({
  rowProps,
  onOpen,
  actions = [],
  children,
  ariaLabel,
}: Props) {
  const [hovered, setHovered] = useState(false);

  const showActions = actions.length > 0 && hovered;

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
    <TableRow
      {...rowProps}
      className={`fortino-interactive-row${hovered ? " fortino-interactive-row--hover" : ""} ${String(rowProps.className ?? "")}`.trim()}
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
      {actions.length > 0 && (
        <TableCell className="fortino-row-actions-cell" aria-hidden={!showActions}>
          <div
            className={`fortino-row-actions${showActions ? " fortino-row-actions--visible" : ""}`}
            role="toolbar"
            aria-label="Acciones de fila"
            aria-hidden={!showActions}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            {actions.map((action) => (
              <IconButton
                key={action.label}
                kind={action.kind ?? "ghost"}
                size="sm"
                align="left"
                label={action.label}
                onClick={(event) => {
                  event.stopPropagation();
                  action.onClick();
                }}
              >
                <action.icon size={18} />
              </IconButton>
            ))}
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}

/** Columna reservada (sin encabezado) para la barra de acciones flotante. */
export const TABLE_ACTIONS_RAIL = { key: "_rail", header: "" } as const;
