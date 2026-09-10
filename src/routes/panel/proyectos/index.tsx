import { createFileRoute } from "@tanstack/react-router";
import { ListadoProyectos } from "@/components/panel/ListadoProyectos";

export const Route = createFileRoute("/panel/proyectos/")({
  component: ListadoProyectos,
});
