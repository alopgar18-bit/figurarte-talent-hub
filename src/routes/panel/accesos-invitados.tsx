import { createFileRoute } from "@tanstack/react-router";
import { AccesosInvitados } from "@/components/panel/AccesosInvitados";

export const Route = createFileRoute("/panel/accesos-invitados")({
  component: AccesosInvitados,
});
