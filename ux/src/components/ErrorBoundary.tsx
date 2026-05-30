import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button, InlineNotification } from "@carbon/react";

type Props = { children: ReactNode; fallbackTitle?: string };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Fortino]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: "2rem", maxWidth: 560, margin: "0 auto" }}>
          <InlineNotification
            kind="error"
            title={this.props.fallbackTitle ?? "Algo salió mal"}
            subtitle={this.state.error.message}
            lowContrast
            hideCloseButton
          />
          <Button
            kind="secondary"
            style={{ marginTop: "1rem" }}
            onClick={() => this.setState({ error: null })}
          >
            Reintentar
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
