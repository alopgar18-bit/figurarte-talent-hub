import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  CalendarDays,
  MapPin,
  Euro,
  Clock,
  Check,
  CalendarX2,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  FormularioCaptacion,
  type CategoriaCandidato,
} from "@/components/FormularioCaptacion";
import { CabeceraPublica, PieLegal } from "@/components/publico/CabeceraPublica";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BriefPublico = {
  categoria?: string;
  subtitulo?: string;
  fechas_rodaje?: string;
  ubicacion?: string;
  remuneracion?: string;
  requisitos?: string[];
  sobre_el_papel?: string;
  cierre_en?: string;
};

type Casting = {
  id: string;
  nombre: string;
  slug_publico: string | null;
  brief_publico: BriefPublico | null;
};

const CATEGORIA_LABEL: Record<string, string> = {
  actor: "Casting Actor",
  modelo: "Casting Modelo",
  figurante: "Casting Figurante",
  casting_plus: "Casting +",
};

const CATEGORIAS_VALIDAS: CategoriaCandidato[] = [
  "actor",
  "modelo",
  "figurante",
  "casting_plus",
];

function formatFecha(iso?: string): string | null {
  if (!iso) return null;
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return iso;
  return fecha.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export const Route = createFileRoute("/casting/$slug")({
  loader: async ({ params }): Promise<{ casting: Casting | null }> => {
    const { data } = await supabase
      .from("proyectos_casting")
      .select("id, nombre, slug_publico, brief_publico")
      .eq("slug_publico", params.slug)
      .eq("publicado", true)
      .maybeSingle();
    return { casting: (data as Casting | null) ?? null };
  },
  head: ({ loaderData }) => {
    const casting = loaderData?.casting ?? null;
    const titulo = casting
      ? `${casting.nombre} — Casting abierto | FigurArte.es`
      : "Casting no disponible | FigurArte.es";
    const descripcion = casting
      ? `Casting abierto: ${casting.nombre}. Apúntate desde esta página y quedarás asociado directamente a este casting de FigurArte.`
      : "Este casting no está disponible o ya se ha cerrado. Consulta los castings abiertos de FigurArte.";
    return {
      meta: [
        { title: titulo },
        { name: "description", content: descripcion },
        { property: "og:title", content: titulo },
        { property: "og:description", content: descripcion },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: NoDisponible,
  notFoundComponent: NoDisponible,
  component: CastingPage,
});

function NoDisponible() {
  return (
    <main className="min-h-screen bg-background">
      <CabeceraPublica ancho="max-w-3xl" />
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <CalendarX2 className="h-10 w-10 text-muted-foreground" />
      <h1 className="mt-4 text-2xl font-black tracking-tight text-foreground">
        Casting no encontrado o ya cerrado
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Puede que el plazo haya terminado o que el enlace ya no sea válido. Consulta los
        castings abiertos en la página principal.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Ver castings abiertos</Link>
      </Button>
      </div>
    </main>
  );
}

function CastingPage() {
  const { casting } = Route.useLoaderData();
  const formRef = useRef<HTMLDivElement>(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  if (!casting) return <NoDisponible />;

  const brief = casting.brief_publico ?? {};
  const categoriaInicial = CATEGORIAS_VALIDAS.includes(
    brief.categoria as CategoriaCandidato,
  )
    ? (brief.categoria as CategoriaCandidato)
    : undefined;

  const datos = [
    { icon: CalendarDays, etiqueta: "Fechas de rodaje", valor: brief.fechas_rodaje },
    { icon: MapPin, etiqueta: "Ubicación", valor: brief.ubicacion },
    { icon: Euro, etiqueta: "Remuneración", valor: brief.remuneracion },
    { icon: Clock, etiqueta: "Cierra", valor: formatFecha(brief.cierre_en) ?? undefined },
  ].filter((d) => Boolean(d.valor));

  function abrirFormulario() {
    setMostrarForm(true);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <main className="min-h-screen bg-background">
      <CabeceraPublica ancho="max-w-3xl" />

      {/* Hero */}
      <header className="border-b border-border bg-secondary text-secondary-foreground">
        <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
          <p className=" inline-block bg-primary px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary-foreground">
            {CATEGORIA_LABEL[brief.categoria ?? ""] ?? "Casting abierto"}
          </p>
          <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-5xl">
            {casting.nombre}
          </h1>
          {brief.subtitulo && (
            <p className="mt-3 max-w-xl text-base opacity-80 sm:text-lg">
              {brief.subtitulo}
            </p>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
        {/* Datos */}
        {datos.length > 0 && (
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {datos.map((d) => (
              <div
                key={d.etiqueta}
                className="flex items-start gap-3 border border-border bg-card p-4"
              >
                <d.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {d.etiqueta}
                  </p>
                  <p className="mt-0.5 break-words font-medium text-card-foreground">
                    {d.valor}
                  </p>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Qué buscamos */}
        {brief.requisitos && brief.requisitos.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-black tracking-tight sm:text-2xl">
              Qué buscamos
            </h2>
            <ul className="mt-4 space-y-2">
              {brief.requisitos.map((req) => (
                <li key={req} className="flex items-start gap-3 text-muted-foreground">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="break-words">{req}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Sobre el papel */}
        {brief.sobre_el_papel && (
          <section className="mt-10">
            <h2 className="text-xl font-black tracking-tight sm:text-2xl">
              Sobre el papel
            </h2>
            <p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">
              {brief.sobre_el_papel}
            </p>
          </section>
        )}

        {/* CTA */}
        <section className="mt-10">
          {!mostrarForm && (
            <Button size="lg" className="w-full" onClick={abrirFormulario}>
              Quiero apuntarme a este casting
            </Button>
          )}
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Al inscribirte quedarás asociado directamente a este casting — el equipo de
            FigurArte te verá ya asignado en el panel, sin pasos adicionales.
          </p>
        </section>

        {/* Formulario embebido */}
        <div ref={formRef} className="scroll-mt-6">
          {mostrarForm && (
            <section className="mt-8 border border-border bg-card p-5 sm:p-8">
              <FormularioCaptacion
                categoriaInicial={categoriaInicial}
                proyectoId={casting.id}
                nombreCasting={casting.nombre}
              />
            </section>
          )}
        </div>

        {/* Acceso rápido */}
        <AccesoRapido proyectoId={casting.id} />
      </div>

      <footer className="border-t border-border bg-secondary py-8 text-center text-xs uppercase tracking-widest text-secondary-foreground/80">
        FIGURARTE · Agencia de casting &amp; producción · www.figurarte.es
      </footer>
    </main>
  );
}

function AccesoRapido({ proyectoId }: { proyectoId: string }) {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"idle" | "enviando" | "enviado">("idle");
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEstado("enviando");
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?proyecto_id=${proyectoId}`,
      },
    });
    if (err) {
      setError("No hemos podido enviar el enlace. Revisa el email e inténtalo de nuevo.");
      setEstado("idle");
      return;
    }
    setEstado("enviado");
  }

  return (
    <section className="mt-10 border border-border bg-muted/40 p-5 sm:p-6">
      <h2 className="text-lg font-black tracking-tight">
        ¿Ya tienes cuenta en FigurArte?
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Inicia sesión y te apuntamos a este casting con un clic — no hace falta rellenar el
        formulario otra vez.
      </p>

      {estado === "enviado" ? (
        <p className="mt-4 flex items-start gap-2 text-sm font-medium text-foreground">
          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          Te hemos enviado un enlace a <strong>{email}</strong>. Ábrelo desde este mismo
          dispositivo y quedarás apuntado a este casting.
        </p>
      ) : (
        <form onSubmit={enviar} className="mt-4 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="email-acceso">Email</Label>
            <Input
              id="email-acceso"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="submit"
            variant="outline"
            className="w-full"
            disabled={estado === "enviando"}
          >
            {estado === "enviando" ? "Enviando..." : "Entrar y apuntarme"}
          </Button>
        </form>
      )}
    </section>
  );
}
