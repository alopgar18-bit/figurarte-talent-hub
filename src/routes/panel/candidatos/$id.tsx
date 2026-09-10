import { createFileRoute, Link } from "@tanstack/react-router";
import { Proximamente } from "@/components/panel/Proximamente";

export const Route = createFileRoute("/panel/candidatos/$id")({
  component: FichaCandidato,
});

function FichaCandidato() {
  return (
    <div className="space-y-4">
      <Link
        to="/panel/candidatos"
        className="text-sm text-muted-foreground underline underline-offset-4"
      >
        ← Volver al listado
      </Link>
      <Proximamente
        titulo="Ficha del candidato"
        descripcion="Aquí irá la ficha completa con datos, fotos, vídeo y proyectos asociados."
      />
    </div>
  );
}
