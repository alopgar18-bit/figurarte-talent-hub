import { useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Users,
  Clapperboard,
  Megaphone,
  MessageSquare,
  LayoutDashboard,
  Building2,
  KeyRound,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const ETIQUETAS_ROL: Record<string, string> = {
  superadmin: "Superadministrador",
  admin_figurarte: "Administrador",
  coordinador: "Coordinador",
  validador: "Validador",
};

type Enlace = { titulo: string; ruta: string; icono: typeof Users };

const OPERATIVA: Enlace[] = [
  { titulo: "Dashboard", ruta: "/panel/dashboard", icono: LayoutDashboard },
  { titulo: "Candidatos", ruta: "/panel/candidatos", icono: Users },
  { titulo: "Proyectos / Casting", ruta: "/panel/proyectos", icono: Clapperboard },
  { titulo: "Captación RRSS", ruta: "/panel/captacion", icono: Megaphone },
  { titulo: "Comunicaciones", ruta: "/panel/comunicaciones", icono: MessageSquare },
];

const ADMINISTRACION: Enlace[] = [
  { titulo: "Clientes", ruta: "/panel/clientes", icono: Building2 },
  { titulo: "Accesos invitados", ruta: "/panel/accesos-invitados", icono: KeyRound },
  { titulo: "Administración", ruta: "/panel/administracion", icono: Settings },
];

const TODOS = [...OPERATIVA, ...ADMINISTRACION];

function Grupo({
  titulo,
  enlaces,
  activo,
  onNavegar,
}: {
  titulo: string;
  enlaces: Enlace[];
  activo: string;
  onNavegar: () => void;
}) {
  return (
    <div className="mt-6 first:mt-0">
      <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {titulo}
      </p>
      <nav className="mt-2 space-y-1">
        {enlaces.map(({ titulo: t, ruta, icono: Icono }) => (
          <Link
            key={ruta}
            to={ruta}
            onClick={onNavegar}
            className={cn(
              "flex items-center gap-3 px-3 py-2 text-sm transition-colors",
              activo === ruta
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Icono className="size-4 shrink-0" aria-hidden="true" />
            <span>{t}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PanelShell({
  rol,
  email,
  children,
}: {
  rol: string;
  email: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activo = TODOS.find((e) => pathname.startsWith(e.ruta))?.ruta ?? "";
  const seccion = TODOS.find((e) => e.ruta === activo)?.titulo ?? "Panel";

  async function salir() {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  const contenidoSidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-5">
        <p className="text-lg font-extrabold tracking-[0.14em] text-foreground">FIGURARTE</p>
        <p className="text-xs uppercase tracking-widest text-primary">Casting</p>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-4">
        <Grupo
          titulo="Operativa"
          enlaces={OPERATIVA}
          activo={activo}
          onNavegar={() => setAbierto(false)}
        />
        <Grupo
          titulo="Administración"
          enlaces={ADMINISTRACION}
          activo={activo}
          onNavegar={() => setAbierto(false)}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar escritorio */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-card lg:block">
        {contenidoSidebar}
      </aside>

      {/* Sidebar móvil */}
      {abierto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-foreground/50"
            onClick={() => setAbierto(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 max-w-[85vw] border-r border-border bg-card">
            {contenidoSidebar}
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-card px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setAbierto((v) => !v)}
          >
            {abierto ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
          <h1 className="min-w-0 flex-1 truncate text-base font-extrabold uppercase tracking-tight text-foreground sm:text-lg">
            {seccion}
          </h1>
          <div className="hidden text-right sm:block">
            <p className="max-w-[220px] truncate text-sm font-medium text-foreground">{email}</p>
            <p className="text-xs text-muted-foreground">{ETIQUETAS_ROL[rol] ?? rol}</p>
          </div>
          <Button variant="outline" size="sm" onClick={salir}>
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
