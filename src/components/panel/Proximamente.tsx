import { Construction } from "lucide-react";

export function Proximamente({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return (
    <div className="mx-auto max-w-xl border border-border bg-card p-8 text-center">
      <Construction className="mx-auto size-8 text-primary" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-bold tracking-tight text-card-foreground">{titulo}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{descripcion}</p>
      <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">Próximamente</p>
    </div>
  );
}
