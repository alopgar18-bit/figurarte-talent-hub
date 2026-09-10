import { createFileRoute } from "@tanstack/react-router";
import { Proximamente } from "@/components/panel/Proximamente";

export const Route = createFileRoute("/panel/proyectos")({
  component: () => (
    <Proximamente
      titulo="Proyectos / Casting"
      descripcion="Creación y seguimiento de proyectos de casting, con candidatos asignados."
    />
  ),
});
