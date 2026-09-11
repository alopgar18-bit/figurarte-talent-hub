import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { resolverAcceso, ROLES_STAFF, type AccesoResuelto } from "@/lib/auth.functions";
import { inscribirEnCasting } from "@/lib/inscripciones.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth/callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    proyecto_id: typeof search["proyecto_id"] === "string" ? search["proyecto_id"] : undefined,
    destino: search["destino"] === "solicitar" ? ("solicitar" as const) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Verificando acceso | FigurArte.es" },
      {
        name: "description",
        content: "Verificando tu enlace de acceso a la plataforma de casting FigurArte.es.",
      },
      { property: "og:title", content: "Verificando acceso | FigurArte.es" },
      {
        property: "og:description",
        content: "Verificando tu enlace de acceso a FigurArte.es.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CallbackPage,
});

const ETIQUETAS_ROL: Record<string, string> = {
  superadmin: "Superadministrador",
  admin_figurarte: "Administrador",
  coordinador: "Coordinador",
  validador: "Validador",
  cliente: "Cliente",
};

function CallbackPage() {
  const navegar = useNavigate();
  const resolver = useServerFn(resolverAcceso);
  const inscribir = useServerFn(inscribirEnCasting);
  const { proyecto_id: proyectoId, destino } = Route.useSearch();
  const [estado, setEstado] = useState<"cargando" | "listo" | "sin_sesion" | "error">(
    "cargando",
  );
  const [acceso, setAcceso] = useState<AccesoResuelto | null>(null);
  const [castingInscrito, setCastingInscrito] = useState<string | null>(null);
  const [falloCasting, setFalloCasting] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function procesar(hayUsuario: boolean) {
      if (!hayUsuario) {
        if (!cancelado) setEstado("sin_sesion");
        return;
      }
      try {
        const resultado = await resolver({});
        if (cancelado) return;
        setAcceso(resultado);
        // Solo los candidatos se apuntan automáticamente al casting.
        if (proyectoId && resultado.tipo === "candidato") {
          try {
            const insc = await inscribir({ data: { proyecto_id: proyectoId } });
            if (cancelado) return;
            if (insc.estado === "inscrito" || insc.estado === "ya_inscrito") {
              setCastingInscrito(insc.nombreCasting);
            } else {
              // Afecta a datos: no puede quedarse en silencio.
              setFalloCasting(true);
            }
          } catch {
            if (!cancelado) setFalloCasting(true);
          }
        }
        if (cancelado) return;
        // Sin casting de por medio, el candidato va directo a su ficha.
        if (resultado.tipo === "candidato" && !proyectoId) {
          void navegar({ to: "/candidato", replace: true });
          return;
        }
        // Staff y clientes van directos a su área.
        if (resultado.tipo === "usuario") {
          const esStaff = (ROLES_STAFF as readonly string[]).includes(resultado.rol);
          if (esStaff) {
            void navegar({ to: "/panel", replace: true });
            return;
          }
          if (resultado.rol === "cliente") {
            void navegar({ to: "/portal", replace: true });
            return;
          }
        }
        setEstado("listo");
      } catch {
        if (!cancelado) setEstado("error");
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) void procesar(true);
    });

    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) void procesar(true);
      else
        setTimeout(() => {
          void supabase.auth.getUser().then(({ data: d }) => procesar(Boolean(d.user)));
        }, 1500);
    });

    return () => {
      cancelado = true;
      sub.subscription.unsubscribe();
    };
  }, [resolver, inscribir, proyectoId]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          FigurArte<span className="text-primary">.</span>es
        </h1>

        <div className="mt-8 border border-border bg-card p-6 text-left">
          {estado === "cargando" && (
            <p className="text-sm text-muted-foreground">Verificando tu enlace de acceso...</p>
          )}

          {estado === "sin_sesion" && (
            <>
              <h2 className="text-lg font-semibold text-card-foreground">Enlace no válido</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                El enlace ha caducado o ya se ha usado. Pide uno nuevo.
              </p>
              <Button asChild className="mt-4 w-full">
                <Link to="/auth">Volver a acceder</Link>
              </Button>
            </>
          )}

          {estado === "error" && (
            <>
              <h2 className="text-lg font-semibold text-card-foreground">Algo ha fallado</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                No hemos podido comprobar tu acceso. Inténtalo de nuevo en un momento.
              </p>
              <Button asChild variant="outline" className="mt-4 w-full">
                <Link to="/auth">Volver a acceder</Link>
              </Button>
            </>
          )}

          {estado === "listo" && acceso?.tipo === "usuario" && (
            <p className="text-sm text-muted-foreground">
              Entrando como <strong>{ETIQUETAS_ROL[acceso.rol] ?? acceso.rol}</strong>...
            </p>
          )}

          {estado === "listo" && acceso?.tipo === "candidato" && (
            <>
              <h2 className="text-lg font-semibold text-card-foreground">
                {castingInscrito ? `Te has apuntado a ${castingInscrito}` : "Sesión iniciada"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {castingInscrito ? (
                  <>
                    Listo, <strong>{acceso.nombre}</strong>: el equipo de FigurArte ya te ve
                    asignado a este casting. No hace falta que hagas nada más.
                  </>
                ) : (
                  <>
                    Has entrado como candidato: <strong>{acceso.nombre}</strong>.
                  </>
                )}
              </p>
              {falloCasting && (
                <p className="mt-3 rounded-md border border-primary/40 bg-primary/10 p-3 text-sm">
                  Tu sesión está activa, pero no hemos podido apuntarte
                  automáticamente a este casting. Escríbenos o vuelve a
                  intentarlo desde tu área de candidato.
                </p>
              )}
              <Button asChild className="mt-4 w-full">
                <Link to="/candidato">Ir a mi ficha</Link>
              </Button>
            </>
          )}

          {estado === "listo" && acceso?.tipo === "ninguno" && (
            <>
              <h2 className="text-lg font-semibold text-card-foreground">
                No tienes cuenta todavía
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Regístrate desde el formulario de captación.
              </p>
              <Button asChild className="mt-4 w-full">
                <Link to="/">Ir al inicio</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
