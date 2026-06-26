const DISMISS_KEY = (id: string) => `fortino-help-dismissed-${id}`;
const AUTO_OFF_KEY = (id: string) => `fortino-help-auto-off-${id}`;

export function shouldAutoShowHelp(id: string) {
  try {
    return localStorage.getItem(AUTO_OFF_KEY(id)) !== "1";
  } catch {
    return false;
  }
}

export function suppressAutoShowHelp(id: string) {
  try {
    localStorage.setItem(AUTO_OFF_KEY(id), "1");
  } catch {
    /* ignore */
  }
}

export function isWalkthroughDismissed(id: string) {
  try {
    return localStorage.getItem(DISMISS_KEY(id)) === "1";
  } catch {
    return false;
  }
}

export function setWalkthroughDismissed(id: string, dismissed: boolean) {
  try {
    if (dismissed) localStorage.setItem(DISMISS_KEY(id), "1");
    else localStorage.removeItem(DISMISS_KEY(id));
  } catch {
    /* ignore */
  }
}
