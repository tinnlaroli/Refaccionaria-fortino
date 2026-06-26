import { Component, type ErrorInfo, type ReactNode } from "react";
import { Alert, Button } from "@heroui/react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-6">
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Error inesperado</Alert.Title>
              <Alert.Description>{this.state.error.message}</Alert.Description>
            </Alert.Content>
          </Alert>
          <Button
            variant="primary"
            className="mt-4"
            onPress={() => this.setState({ error: null })}
          >
            Reintentar
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
