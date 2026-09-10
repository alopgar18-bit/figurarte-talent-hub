import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { FileText, LogOut, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const MENU = [
  { to: "/portal/candidatos", etiqueta: "Buscar candidatos", icono: Search },
  { to: "/portal/dossiers", etiqueta: "Mis dossiers", icono: FileText },
  { to: "/portal/solicitar", etiqueta: "Solicitar proyecto", icono: Send },
] as const;

export function PortalShell({
  razonSocial,
  children,
}: {
  razonSocial: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();

  async function salir() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <Link to="/" className="text-sm font-bold tracking-tight">
              FigurArte<span className="text-primary">.</span>es
            </Link>
            <p className="truncate text-lg font-semibold leading-tight">{razonSocial}</p>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Portal de cliente
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={salir} className="w-full sm:w-auto">
            <LogOut className="mr-2 h-4 w-4" /> Salir
          </Button>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:flex-row">
        <nav className="lg:w-56 lg:shrink-0">
          <ul className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {MENU.map((item) => {
              const Icono = item.icono;
              return (
                <li key={item.to} className="shrink-0 lg:shrink">
                  <Link
                    to={item.to}
                    className={cn(
                      "flex items-center gap-2 whitespace-nowrap border border-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    )}
                    activeProps={{
                      className: "border-border bg-muted font-medium text-foreground",
                    }}
                  >
                    <Icono className="h-4 w-4" />
                    {item.etiqueta}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
