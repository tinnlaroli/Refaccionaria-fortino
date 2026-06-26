import { useEffect, useState } from "react";
import { Button, Checkbox } from "@heroui/react";
import type { ModuleWalkthrough } from "../../config/walkthroughs.js";
import {
  isWalkthroughDismissed,
  setWalkthroughDismissed,
  suppressAutoShowHelp,
} from "../../lib/helpStorage.js";
import { AppModal } from "../ui/AppModal.js";

type Props = {
  open: boolean;
  walkthrough: ModuleWalkthrough;
  onClose: () => void;
};

export {
  isWalkthroughDismissed,
  setWalkthroughDismissed,
  shouldAutoShowHelp,
  suppressAutoShowHelp,
} from "../../lib/helpStorage.js";

export function ModuleWalkthroughModal({ open, walkthrough, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (open) {
      setStep(0);
      setDontShowAgain(isWalkthroughDismissed(walkthrough.id));
    }
  }, [open, walkthrough.id]);

  const total = walkthrough.steps.length;
  const current = walkthrough.steps[step];
  const isLast = step >= total - 1;

  const finish = () => {
    suppressAutoShowHelp(walkthrough.id);
    if (dontShowAgain) setWalkthroughDismissed(walkthrough.id, true);
    else setWalkthroughDismissed(walkthrough.id, false);
    onClose();
  };

  return (
    <AppModal
      open={open}
      kicker="Guía del módulo"
      title={walkthrough.title}
      subtitle={walkthrough.summary}
      size="help"
      onClose={finish}
      footerClassName="fortino-modal-footer fortino-modal-footer--split"
      footer={
        <>
          <div className="fortino-modal-footer-start">
            {step > 0 && (
              <Button variant="tertiary" onPress={() => setStep((s) => s - 1)}>
                Anterior
              </Button>
            )}
          </div>
          <div className="fortino-modal-footer-end">
            <Button variant="secondary" onPress={finish}>
              Cerrar
            </Button>
            {!isLast ? (
              <Button variant="primary" onPress={() => setStep((s) => s + 1)}>
                Siguiente
              </Button>
            ) : (
              <Button variant="primary" onPress={finish}>
                Entendido
              </Button>
            )}
          </div>
        </>
      }
    >
      <div className="fortino-help-modal-body">
        <div className="fortino-help-progress" role="tablist" aria-label="Pasos de la guía">
          {walkthrough.steps.map((s, i) => (
            <button
              key={s.title}
              type="button"
              role="tab"
              aria-selected={i === step}
              className={`fortino-help-progress-segment${i <= step ? " fortino-help-progress-segment--done" : ""}${i === step ? " fortino-help-progress-segment--active" : ""}`}
              aria-label={`Paso ${i + 1}: ${s.title}`}
              onClick={() => setStep(i)}
            />
          ))}
        </div>

        <article className="fortino-help-step-card">
          <p className="fortino-help-step-label">
            Paso {step + 1} de {total}
          </p>
          <h3 className="fortino-help-step-title">{current?.title}</h3>
          <p className="fortino-help-step-body">{current?.body}</p>
        </article>

        <Checkbox
          id={`walkthrough-dismiss-${walkthrough.id}`}
          isSelected={dontShowAgain}
          onChange={setDontShowAgain}
        >
          No volver a mostrar esta guía automáticamente
        </Checkbox>
      </div>
    </AppModal>
  );
}
