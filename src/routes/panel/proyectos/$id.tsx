import { createFileRoute } from "@tanstack/react-router";
import { DetalleProyecto } from "@/components/panel/DetalleProyecto";

export const Route = createFileRoute("/panel/proyectos/$id")({
  component: DetalleProyectoRoute,
});

function DetalleProyectoRoute() {
  const { id } = Route.useParams();
  return <DetalleProyecto id={id} />;
}
