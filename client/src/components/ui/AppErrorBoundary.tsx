import SystemState from "@/components/ui/SystemState";
import { Component, type ReactNode } from "react";

type BoundaryState = { failed: boolean; };

export default class AppErrorBoundary extends Component<{ children: ReactNode; }, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch() {
    this.setState({ failed: true });
  }

  render() {
    if (this.state.failed) {
      return (
        <SystemState
          title="Something went wrong."
          body="Reload the page and try that step again."
          action={{ href: "/", label: "Back to store" }}
        />
      );
    }
    return this.props.children;
  }
}
