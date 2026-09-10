import { createFileRoute } from "@tanstack/react-router";
import { Proximamente } from "@/components/panel/Proximamente";

export const Route = createFileRoute("/panel/dashboard")({
  component: () => (
    <Proximamente
      titulo="Dashboard"
      descripcion="Resumen de actividad: registros, castings abiertos y candidatos asignados."
    />
  ),
});
