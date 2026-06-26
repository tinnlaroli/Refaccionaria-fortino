import { useEffect } from "react";
import { Button, Modal, Spinner, useOverlayState } from "@heroui/react";
import type { ReactNode } from "react";

type ModalSize = "sm" | "md" | "lg" | "xl" | "help";

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: "fortino-modal-shell--sm",
  md: "fortino-modal-shell--md",
  lg: "fortino-modal-shell--lg",
  xl: "fortino-modal-shell--xl",
  help: "fortino-modal-shell--help",
};

const HEROUI_SIZE: Record<ModalSize, "sm" | "md" | "lg"> = {
  sm: "sm",
  md: "md",
  lg: "lg",
  xl: "lg",
  help: "lg",
};

type Props = {
  open: boolean;
  title: string;
  subtitle?: string;
  kicker?: string;
  size?: ModalSize;
  onClose: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  submitDisabled?: boolean;
  loading?: boolean;
  danger?: boolean;
  hideFooter?: boolean;
  footer?: ReactNode;
  footerClassName?: string;
  children: ReactNode;
};

export function AppModal({
  open,
  title,
  subtitle,
  kicker,
  size = "md",
  onClose,
  onSubmit,
  submitLabel = "Guardar",
  cancelLabel = "Cancelar",
  submitDisabled,
  loading,
  danger,
  hideFooter,
  footer,
  footerClassName,
  children,
}: Props) {
  const state = useOverlayState({ isOpen: open, onOpenChange: (next) => !next && onClose() });

  useEffect(() => {
    state.setOpen(open);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open && !state.isOpen) return null;

  const showDefaultFooter = !hideFooter && !footer;

  return (
    <Modal state={state}>
      <Modal.Backdrop isDismissable={!loading} className="fortino-modal-backdrop">
        <Modal.Container
          size={HEROUI_SIZE[size]}
          className={`fortino-modal-shell ${SIZE_CLASS[size]}`}
        >
          <Modal.Dialog className="fortino-modal-dialog">
            <Modal.Header className="fortino-modal-header">
              <div className="fortino-modal-header-text">
                {kicker && <p className="fortino-modal-kicker">{kicker}</p>}
                <Modal.Heading className="fortino-modal-title">{title}</Modal.Heading>
                {subtitle && <p className="fortino-modal-subtitle">{subtitle}</p>}
              </div>
              <Modal.CloseTrigger />
            </Modal.Header>

            <Modal.Body className="fortino-modal-body">{children}</Modal.Body>

            {footer && (
              <Modal.Footer className={footerClassName ?? "fortino-modal-footer"}>
                {footer}
              </Modal.Footer>
            )}

            {showDefaultFooter && (
              <Modal.Footer className="fortino-modal-footer">
                <Button variant="secondary" onPress={onClose} isDisabled={loading}>
                  {cancelLabel}
                </Button>
                {onSubmit && (
                  <Button
                    variant={danger ? "danger" : "primary"}
                    onPress={onSubmit}
                    isDisabled={submitDisabled || loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Spinner size="sm" />
                        Procesando…
                      </span>
                    ) : (
                      submitLabel
                    )}
                  </Button>
                )}
              </Modal.Footer>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
