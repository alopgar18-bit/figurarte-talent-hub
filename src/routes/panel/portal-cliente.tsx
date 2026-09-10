import { createFileRoute } from "@tanstack/react-router";
import { Proximamente } from "@/components/panel/Proximamente";

export const Route = createFileRoute("/panel/portal-cliente")({
  component: () => (
    <Proximamente
      titulo="Portal cliente"
      descripcion="Vista previa de lo que ve el cliente: búsqueda sin datos de contacto y dossiers."
    />
  ),
});
