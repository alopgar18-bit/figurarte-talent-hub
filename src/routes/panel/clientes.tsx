import { createFileRoute } from "@tanstack/react-router";
import { ListadoClientes } from "@/components/panel/ListadoClientes";

export const Route = createFileRoute("/panel/clientes")({
  component: ListadoClientes,
});
