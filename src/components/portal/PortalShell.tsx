import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { FileText, LogOut, Menu, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuAbierto, setMenuAbierto] = useState(false);
  const seccionActiva = MENU.find((item) => pathname.startsWith(item.to));

  async function salir() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-w-0">
            <Link to="/" className="text-sm font-bold tracking-tight">
              FigurArte<span className="text-primary">.</span>es
            </Link>
            <p className="truncate text-lg font-extrabold uppercase tracking-tight leading-tight">{razonSocial}</p>
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
        <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="grid w-full grid-cols-[auto_minmax(0,1fr)] justify-start gap-3 lg:hidden"
            >
              <Menu className="size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 truncate text-left">
                {seccionActiva?.etiqueta ?? "Menú del portal"}
              </span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-80 p-0">
            <SheetHeader className="border-b border-border px-5 py-5 text-left">
              <SheetTitle>Portal de cliente</SheetTitle>
              <SheetDescription>Selecciona una sección</SheetDescription>
            </SheetHeader>
            <nav aria-label="Secciones del portal" className="space-y-1 p-3">
              {MENU.map((item) => {
                const Icono = item.icono;
                return (
                  <SheetClose key={item.to} asChild>
                    <Link
                      to={item.to}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        pathname.startsWith(item.to)
                          ? "bg-muted font-medium text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      <Icono className="size-4 shrink-0" aria-hidden="true" />
                      <span>{item.etiqueta}</span>
                    </Link>
                  </SheetClose>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>

        <nav className="hidden lg:block lg:w-56 lg:shrink-0">
          <ul className="flex flex-col gap-2">
            {MENU.map((item) => {
              const Icono = item.icono;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "flex items-center gap-2 border border-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
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
