import { createFileRoute } from "@tanstack/react-router";
import { Proximamente } from "@/components/panel/Proximamente";

export const Route = createFileRoute("/panel/captacion")({
  component: () => (
    <Proximamente
      titulo="Captación RRSS"
      descripcion="Convocatorias en redes sociales y seguimiento del origen de cada registro."
    />
  ),
});
