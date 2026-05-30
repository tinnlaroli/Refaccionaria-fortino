import {
  ComposedModal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Button,
} from "@carbon/react";
import type { ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  subtitle?: string;
  size?: "xs" | "sm" | "md" | "lg";
  onClose: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  submitDisabled?: boolean;
  loading?: boolean;
  danger?: boolean;
  hideFooter?: boolean;
  children: ReactNode;
};

export function AppModal({
  open,
  title,
  subtitle,
  size = "md",
  onClose,
  onSubmit,
  submitLabel = "Guardar",
  cancelLabel = "Cancelar",
  submitDisabled,
  loading,
  danger,
  hideFooter,
  children,
}: Props) {
  return (
    <ComposedModal open={open} onClose={onClose} size={size} preventCloseOnClickOutside={loading}>
      <ModalHeader title={title} label={subtitle} closeModal={onClose} />
      <ModalBody>{children}</ModalBody>
      {!hideFooter && (
        <ModalFooter>
          <Button kind="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          {onSubmit && (
            <Button
              kind={danger ? "danger" : "primary"}
              onClick={onSubmit}
              disabled={submitDisabled || loading}
            >
              {loading ? "Procesando…" : submitLabel}
            </Button>
          )}
        </ModalFooter>
      )}
    </ComposedModal>
  );
}
