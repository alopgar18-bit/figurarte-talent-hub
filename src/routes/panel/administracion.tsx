import { createFileRoute } from "@tanstack/react-router";
import { Proximamente } from "@/components/panel/Proximamente";

export const Route = createFileRoute("/panel/administracion")({
  component: () => (
    <Proximamente
      titulo="Administración"
      descripcion="Usuarios del equipo y campos personalizados de los proyectos."
    />
  ),
});
