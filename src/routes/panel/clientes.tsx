import { createFileRoute } from "@tanstack/react-router";
import { Proximamente } from "@/components/panel/Proximamente";

export const Route = createFileRoute("/panel/clientes")({
  component: () => (
    <Proximamente
      titulo="Clientes"
      descripcion="Ficha de cada cliente, sus proyectos y sus solicitudes."
    />
  ),
});
