import { SystemState } from "@/components/SystemState";

export function NotFoundPage() {
  return (
    <SystemState
      title="Page not found."
      body="That page does not exist."
      action={{ href: "/", label: "Back to store" }}
    />
  );
}
