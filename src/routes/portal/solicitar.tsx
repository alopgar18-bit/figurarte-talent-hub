import { createFileRoute } from "@tanstack/react-router";
import { SolicitarProyecto } from "@/components/portal/SolicitarProyecto";

export const Route = createFileRoute("/portal/solicitar")({
  component: SolicitarRoute,
});

function SolicitarRoute() {
  const { cliente } = Route.useRouteContext();
  return <SolicitarProyecto clienteId={cliente.clienteId} />;
}
