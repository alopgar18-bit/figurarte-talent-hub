import { createFileRoute } from "@tanstack/react-router";
import { Proximamente } from "@/components/panel/Proximamente";

export const Route = createFileRoute("/panel/accesos-invitados")({
  component: () => (
    <Proximamente
      titulo="Accesos invitados"
      descripcion="Invitaciones de acceso para personas de un cliente concreto."
    />
  ),
});
