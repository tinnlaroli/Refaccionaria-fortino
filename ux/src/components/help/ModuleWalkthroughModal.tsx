import { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  ComposedModal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ProgressIndicator,
  ProgressStep,
  Stack,
} from "@carbon/react";
import type { ModuleWalkthrough } from "../../config/walkthroughs.js";

type Props = {
  open: boolean;
  walkthrough: ModuleWalkthrough;
  onClose: () => void;
};

function storageKey(id: string) {
  return `fortino-help-dismissed-${id}`;
}

export function isWalkthroughDismissed(id: string) {
  try {
    return localStorage.getItem(storageKey(id)) === "1";
  } catch {
    return false;
  }
}

export function setWalkthroughDismissed(id: string, dismissed: boolean) {
  try {
    if (dismissed) localStorage.setItem(storageKey(id), "1");
    else localStorage.removeItem(storageKey(id));
  } catch {
    /* ignore */
  }
}

export function ModuleWalkthroughModal({ open, walkthrough, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(0);
      setDontShowAgain(false);
    }
  }, [open, walkthrough.id]);

  const total = walkthrough.steps.length;
  const current = walkthrough.steps[step];
  const isLast = step >= total - 1;

  const finish = () => {
    if (dontShowAgain) setWalkthroughDismissed(walkthrough.id, true);
    onClose();
  };

  return (
    <ComposedModal open={open} onClose={finish} size="md">
      <ModalHeader title={`Guía: ${walkthrough.title}`} label={walkthrough.summary} closeModal={finish} />
      <ModalBody>
        <Stack gap={6}>
          <ProgressIndicator currentIndex={step} spaceEqually={total <= 4}>
            {walkthrough.steps.map((s, i) => (
              <ProgressStep
                key={s.title}
                label={s.title}
                description={`Paso ${i + 1}`}
                complete={i < step}
                current={i === step}
              />
            ))}
          </ProgressIndicator>

          <div>
            <p className="fortino-walkthrough-step-label">
              Paso {step + 1} de {total}
            </p>
            <h3 className="fortino-walkthrough-step-title">{current?.title}</h3>
            <p className="fortino-walkthrough-step-body">{current?.body}</p>
          </div>

          <Checkbox
            id={`walkthrough-dismiss-${walkthrough.id}`}
            labelText="No volver a mostrar esta guía"
            checked={dontShowAgain}
            onChange={(_, { checked }) => setDontShowAgain(checked)}
          />
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={finish}>
          Cerrar
        </Button>
        {step > 0 && (
          <Button kind="tertiary" onClick={() => setStep((s) => s - 1)}>
            Anterior
          </Button>
        )}
        {!isLast ? (
          <Button kind="primary" onClick={() => setStep((s) => s + 1)}>
            Siguiente
          </Button>
        ) : (
          <Button kind="primary" onClick={finish}>
            Entendido
          </Button>
        )}
      </ModalFooter>
    </ComposedModal>
  );
}
