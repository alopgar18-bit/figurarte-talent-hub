import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/panel/Dashboard";

export const Route = createFileRoute("/panel/dashboard")({
  component: Dashboard,
});
