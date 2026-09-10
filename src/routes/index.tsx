import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Clapperboard,
  Drama,
  Camera,
  Sparkles,
  Users,
  HandHelping,
  Database,
  Handshake,
  Phone,
  ArrowRight,
  UserRound,
  Building2,
  ShieldCheck,
  CalendarX2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type BriefPublico = {
  categoria?: string;
  cierre_en?: string;
  ubicacion?: string;
  remuneracion?: string;
};

type CastingAbierto = {
  id: string;
  nombre: string;
  slug_publico: string | null;
  brief_publico: BriefPublico | null;
};

const CATEGORIA_LABEL: Record<string, string> = {
  actor: "Actores y Actrices",
  modelo: "Modelos",
  figurante: "Figurantes",
  casting_plus: "Casting +",
};

function formatFechaCierre(iso?: string): string | null {
  if (!iso) return null;
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return null;
  return fecha.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export const Route = createFileRoute("/")({
  loader: async (): Promise<{ castings: CastingAbierto[] }> => {
    const { data } = await supabase
      .from("proyectos_casting")
      .select("id, nombre, slug_publico, brief_publico")
      .eq("publicado", true)
      .order("creado_en", { ascending: false });
    return { castings: (data as CastingAbierto[] | null) ?? [] };
  },
  head: () => ({
    meta: [
      { title: "FigurArte.es — Agencia de Casting & Producción en Andalucía" },
      {
        name: "description",
        content:
          "Agencia de casting y producción: figurantes, actores, modelos y Casting +. Regístrate en nuestra base de datos o contrata nuestros servicios para tu próxima producción.",
      },
      {
        property: "og:title",
        content: "FigurArte.es — Agencia de Casting & Producción en Andalucía",
      },
      {
        property: "og:description",
        content:
          "Encuentra el perfil que buscas para tu próxima producción, o preséntate como candidato en nuestra base de datos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const categorias = [
  {
    icon: Users,
    categoria: "figurante" as const,
    titulo: "Figurantes",
    texto:
      "Participa como extra en series, películas y producciones audiovisuales. Regístrate en nuestra base de datos.",
  },
  {
    icon: Drama,
    categoria: "actor" as const,
    titulo: "Actores y Actrices",
    texto:
      "Trabaja con nuestra agencia en series, películas y teatro. Participa en nuestros castings.",
  },
  {
    icon: Camera,
    categoria: "modelo" as const,
    titulo: "Modelos",
    texto:
      "Castings de series, películas y publicidad. Mándanos tus fotografías y regístrate.",
  },
  {
    icon: Sparkles,
    categoria: "casting_plus" as const,
    titulo: "Casting +",
    texto:
      "Azafatas, bailarines, fotógrafos, músicos, presentadores — para cualquier evento o producción.",
  },
];

const valores = [
  {
    icon: Users,
    titulo: "Equipo",
    texto:
      "Equipo multidisciplinar con experiencia en el mundo de la comunicación.",
  },
  {
    icon: HandHelping,
    titulo: "Ayuda",
    texto: "Te facilitamos todo lo que necesites en tu proyecto audiovisual.",
  },
  {
    icon: Database,
    titulo: "Gestión",
    texto:
      "Gestionamos castings con nuestra base de datos, personalizada según tus necesidades.",
  },
  {
    icon: Handshake,
    titulo: "Alianza",
    texto:
      "Nuestra alianza con estudios de televisión nos convierte en una alternativa competitiva en Andalucía.",
  },
];

const accesos = [
  {
    icon: UserRound,
    titulo: "Candidato",
    texto: "Ver y actualizar mi ficha",
  },
  {
    icon: Building2,
    titulo: "Cliente",
    texto: "Buscar candidatos y ver dossiers",
  },
  {
    icon: ShieldCheck,
    titulo: "Equipo FigurArte",
    texto: "Coordinador / Administrador",
  },
];

function Home() {
  const { castings } = Route.useLoaderData();

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Nav pública */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="min-w-0 truncate text-lg font-black tracking-tight">
            FigurArte<span className="text-primary">.</span>es
          </Link>
          <nav className="flex shrink-0 items-center gap-1 text-sm font-medium sm:gap-2">
            <a
              href="#casting"
              className="hidden px-3 py-2 text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
            >
              Casting
            </a>
            <a
              href="#nosotros"
              className="hidden px-3 py-2 text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
            >
              Nosotros
            </a>
            <a
              href="#marcas"
              className="hidden px-3 py-2 text-muted-foreground transition-colors hover:text-foreground md:inline-block"
            >
              Para marcas
            </a>
            <a
              href="#contacto"
              className="hidden px-3 py-2 text-muted-foreground transition-colors hover:text-foreground md:inline-block"
            >
              Contacto
            </a>
            <Link
              to="/auth"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Acceso
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border bg-brand-charcoal text-brand-cream">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Casting &amp; Producción
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
            Somos tu agencia de Casting &amp; Producción
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-brand-cream/80">
            Encuentra el perfil que buscas para tu próxima producción, o
            preséntate como candidato en nuestra base de datos.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a
              href="#casting"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Clapperboard className="h-5 w-5" />
              Ver casting abiertos
            </a>
            <a
              href="#marcas"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-brand-cream/30 px-6 py-3 font-semibold text-brand-cream transition-colors hover:bg-brand-cream/10"
            >
              Contratar nuestros servicios
            </a>
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
          Regístrate según tu perfil
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categorias.map((cat) => (
            <article
              key={cat.titulo}
              className="flex flex-col rounded-md border border-border bg-card p-6"
            >
              <cat.icon className="h-8 w-8 shrink-0 text-primary" />
              <h3 className="mt-4 text-xl font-bold">{cat.titulo}</h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">
                {cat.texto}
              </p>
              <Link
                to="/registro"
                search={{ categoria: cat.categoria }}
                className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Regístrate
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Casting abiertos */}
      <section id="casting" className="border-y border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Ahora mismo
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Casting abiertos
          </h2>

          {castings.length === 0 ? (
            <div className="mt-10 flex flex-col items-center rounded-md border border-dashed border-border bg-card px-6 py-14 text-center">
              <CalendarX2 className="h-10 w-10 text-muted-foreground" />
              <p className="mt-4 text-lg font-semibold">
                No hay casting abiertos en este momento
              </p>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Vuelve pronto: publicamos nuevas convocatorias regularmente.
                Mientras tanto, puedes registrarte en nuestra base de datos
                para enterarte antes que nadie.
              </p>
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {castings.map((casting) => {
                const cierre = formatFechaCierre(casting.brief_publico?.cierre_en);
                const categoria =
                  CATEGORIA_LABEL[casting.brief_publico?.categoria ?? ""] ??
                  casting.brief_publico?.categoria;
                return (
                  <article
                    key={casting.id}
                    className="flex flex-col rounded-md border border-border bg-card p-6"
                  >
                    {categoria && (
                      <span className="inline-flex w-fit rounded-sm bg-primary/10 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                        {categoria}
                      </span>
                    )}
                    <h3 className="mt-3 text-xl font-bold">{casting.nombre}</h3>
                    {cierre && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Cierre de inscripción: {cierre}
                      </p>
                    )}
                    <div className="mt-6 flex-1" />
                    {casting.slug_publico ? (
                      <Link
                        to="/casting/$slug"
                        params={{ slug: casting.slug_publico }}
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                      >
                        Ver casting
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <span className="inline-flex items-center justify-center rounded-md bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground">
                        Ver casting
                      </span>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Sobre nosotros */}
      <section id="nosotros" className="bg-brand-charcoal text-brand-cream">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Sobre nosotros
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Por qué FigurArte
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {valores.map((valor) => (
              <article key={valor.titulo}>
                <valor.icon className="h-8 w-8 shrink-0 text-primary" />
                <h3 className="mt-4 text-lg font-bold">{valor.titulo}</h3>
                <p className="mt-2 text-sm text-brand-cream/75">
                  {valor.texto}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Para marcas */}
      <section id="marcas" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="rounded-md border border-border bg-card p-8 sm:p-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Para marcas y productoras
          </p>
          <h2 className="mt-2 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
            Contrata nuestros servicios de casting
          </h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            ¿Tienes un proyecto y necesitas candidatos? Cuéntanos qué buscas y
            nuestro equipo lo revisa para empezar la captación.
          </p>
          <Link
            to="/auth"
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Solicitar un proyecto
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Acceso */}
      <section id="acceso" className="border-y border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Acceso
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Entra según tu perfil
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {accesos.map((acceso) => (
              <Link
                key={acceso.titulo}
                to="/auth"
                className="group flex flex-col rounded-md border border-border bg-card p-6 transition-colors hover:border-primary"
              >
                <acceso.icon className="h-8 w-8 shrink-0 text-primary" />
                <h3 className="mt-4 text-lg font-bold">{acceso.titulo}</h3>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">
                  {acceso.texto}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Entrar
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
          <p className="mt-8 max-w-2xl text-sm text-muted-foreground">
            El acceso es único: al entrar con tu email, la plataforma te lleva
            directamente a tu panel según tu rol.
          </p>
        </div>
      </section>

      {/* Contacto / footer */}
      <footer id="contacto" className="bg-brand-navy text-brand-cream">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 sm:flex-row sm:items-center sm:px-6">
          <div className="min-w-0">
            <p className="text-2xl font-black tracking-tight">
              No dudes, contacta
            </p>
            <p className="mt-2 text-sm text-brand-cream/75">
              FigurArte — Casting &amp; Producción
            </p>
            <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <Link to="/aviso-legal" className="text-brand-cream/75 underline underline-offset-4 hover:text-brand-cream">
                Aviso legal
              </Link>
              <Link to="/privacidad" className="text-brand-cream/75 underline underline-offset-4 hover:text-brand-cream">
                Política de privacidad
              </Link>
            </p>
          </div>

          <a
            href="tel:+34655666899"
            className="inline-flex shrink-0 items-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Phone className="h-5 w-5" />
            655 666 899
          </a>
        </div>
      </footer>
    </main>
  );
}
