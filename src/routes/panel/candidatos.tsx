import { createFileRoute } from "@tanstack/react-router";
import { Proximamente } from "@/components/panel/Proximamente";

export const Route = createFileRoute("/panel/candidatos")({
  component: () => (
    <Proximamente
      titulo="Base de candidatos"
      descripcion="Aquí irá el listado con filtros, búsqueda, selección múltiple y exportación."
    />
  ),
});
