import { createFileRoute } from "@tanstack/react-router";
import { Administracion } from "@/components/panel/Administracion";

export const Route = createFileRoute("/panel/administracion")({
  component: PaginaAdministracion,
});

function PaginaAdministracion() {
  const { staff } = Route.useRouteContext();
  return <Administracion rol={staff.rol} email={staff.email} />;
}
