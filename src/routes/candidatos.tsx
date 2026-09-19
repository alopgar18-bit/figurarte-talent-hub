import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { Users, ImageOff, SlidersHorizontal, Loader2 } from "lucide-react";
import { CabeceraPublica, PieLegal } from "@/components/publico/CabeceraPublica";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  listarCandidatosPublicos,
  type CandidatoPublico,
} from "@/lib/candidatos-publicos.functions";

const CATEGORIAS = [
  { valor: "actor", etiqueta: "Actores y actrices" },
  { valor: "modelo", etiqueta: "Modelos" },
  { valor: "figurante", etiqueta: "Figurantes" },
  { valor: "casting_plus", etiqueta: "Casting +" },
] as const;

const GENEROS_FILTRO = ["Hombre", "Mujer", "No binario"] as const;

/** Mismos cortes de edad que el menú actual de figurarte.es */
const FRANJAS_EDAD = [
  { clave: "0-18", etiqueta: "0 – 18 años", min: 0, max: 18 },
  { clave: "18-30", etiqueta: "18 – 30 años", min: 18, max: 30 },
  { clave: "30-50", etiqueta: "30 – 50 años", min: 30, max: 50 },
  { clave: "50-100", etiqueta: "50 – 100 años", min: 50, max: 100 },
] as const;

const ETIQUETA_CATEGORIA: Record<string, string> = {
  actor: "Actor",
  modelo: "Modelo",
  figurante: "Figurante",
  casting_plus: "Casting +",
};

const PAGINA = 60;

/** Clave pública del widget de Cloudflare Turnstile (puede ir en el cliente). */
const TURNSTILE_SITE_KEY = "0x4AAAAAAE849WrD8HMgqEHx";
const TURNSTILE_SCRIPT =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (el: HTMLElement, opciones: { sitekey: string; theme?: string; size?: string }) => string;
  getResponse: (id?: string) => string | undefined;
  reset: (id?: string) => void;
};

function turnstileGlobal(): TurnstileApi | undefined {
  return (window as unknown as { turnstile?: TurnstileApi }).turnstile;
}

function cargarScriptTurnstile(): Promise<void> {
  if (turnstileGlobal()) return Promise.resolve();
  const existente = document.querySelector<HTMLScriptElement>(
    `script[src="${TURNSTILE_SCRIPT}"]`,
  );
  if (existente) {
    return new Promise((resolve) => existente.addEventListener("load", () => resolve()));
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar Turnstile"));
    document.head.appendChild(script);
  });
}

/**
 * Widget discreto de Turnstile. Devuelve, vía `onListo`, una función que
 * entrega el token actual y resetea el widget para obtener uno fresco.
 */
function VerificacionTurnstile({
  onListo,
}: {
  onListo: (obtenerToken: () => string | undefined) => void;
}) {
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelado = false;
    let widgetId: string | undefined;

    void cargarScriptTurnstile()
      .then(() => {
        const api = turnstileGlobal();
        if (cancelado || !api || !contenedor.current) return;
        widgetId = api.render(contenedor.current, {
          sitekey: TURNSTILE_SITE_KEY,
          size: "flexible",
        });
        onListo(() => {
          const token = api.getResponse(widgetId);
          api.reset(widgetId);
          return token;
        });
      })
      .catch(() => {
        /* sin verificación disponible: el servidor rechazará la paginación */
      });

    return () => {
      cancelado = true;
    };
  }, [onListo]);

  return <div ref={contenedor} className="max-w-xs" aria-hidden="true" />;
}

export const Route = createFileRoute("/candidatos")({
  loader: async () => ({
    listado: await listarCandidatosPublicos({ data: { limit: PAGINA, offset: 0 } }),
  }),
  head: () => {
    const titulo = "Candidatos disponibles | FigurArte.es";
    const descripcion =
      "Consulta los perfiles verificados y disponibles de FigurArte: actores, modelos, figurantes y Casting +. Filtra por categoría, género y franja de edad.";
    return {
      meta: [
        { title: titulo },
        { name: "description", content: descripcion },
        { property: "og:title", content: titulo },
        { property: "og:description", content: descripcion },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: ErrorListado,
  notFoundComponent: ErrorListado,
  component: CandidatosPublicos,
});

function ErrorListado() {
  return (
    <main className="min-h-screen bg-background">
      <CabeceraPublica />
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-black tracking-tight">
          No hemos podido cargar los candidatos
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Vuelve a intentarlo en unos minutos o escríbenos si el problema continúa.
        </p>
        <Button asChild className="mt-8">
          <Link to="/">Volver al inicio</Link>
        </Button>
      </div>
      <PieLegal />
    </main>
  );
}

function Chip({
  activo,
  onClick,
  deshabilitado,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  deshabilitado?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={deshabilitado}
      aria-pressed={activo}
      className={`rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors ${
        activo
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      } ${deshabilitado ? "cursor-not-allowed opacity-50" : ""}`}
    >
      {children}
    </button>
  );
}

function Tarjeta({ c }: { c: CandidatoPublico }) {
  const datos = [
    c.edad != null ? `${c.edad} años` : null,
    c.altura_cm ? `${c.altura_cm} cm` : null,
    c.peso_kg ? `${c.peso_kg} kg` : null,
  ].filter(Boolean);

  const tallas = [
    c.talla_camisa ? `Camisa ${c.talla_camisa}` : null,
    c.talla_pantalon ? `Pantalón ${c.talla_pantalon}` : null,
    c.talla_calzado ? `Calzado ${c.talla_calzado}` : null,
    c.talla_chaqueta ? `Chaqueta ${c.talla_chaqueta}` : null,
  ].filter((t): t is string => Boolean(t));

  const rasgos = [
    c.complexion,
    c.tipo_pelo,
    c.color_cabello ? `Cabello ${c.color_cabello.toLowerCase()}` : null,
    c.color_ojos ? `Ojos ${c.color_ojos.toLowerCase()}` : null,
  ].filter((t): t is string => Boolean(t));

  return (
    <article className="flex flex-col overflow-hidden border border-border bg-card">
      <div className="aspect-[3/4] w-full bg-muted">
        {c.foto ? (
          <img
            src={c.foto}
            alt={`Perfil de candidato ${c.codigo}`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageOff className="h-8 w-8" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
            {ETIQUETA_CATEGORIA[c.categoria] ?? c.categoria}
          </Badge>
          <span className="font-mono text-sm text-muted-foreground">{c.codigo}</span>
        </div>

        <p className="text-sm font-semibold">
          {[c.genero, c.provincia].filter(Boolean).join(" · ") || "Perfil disponible"}
        </p>

        {datos.length > 0 && (
          <p className="text-sm text-muted-foreground">{datos.join(" · ")}</p>
        )}

        {tallas.length > 0 && (
          <p className="text-xs text-muted-foreground">{tallas.join(" · ")}</p>
        )}

        {rasgos.length > 0 && (
          <p className="text-xs text-muted-foreground">{rasgos.join(" · ")}</p>
        )}

        {(c.tipo_perfil.length > 0 || c.habilidades.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {[...c.tipo_perfil, ...c.habilidades].slice(0, 6).map((t) => (
              <span
                key={t}
                className="border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {c.idiomas.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Idiomas: {c.idiomas.join(", ")}
          </p>
        )}
      </div>
    </article>
  );
}

function CandidatosPublicos() {
  const { listado } = Route.useLoaderData();
  const [categoria, setCategoria] = useState<string | null>(null);
  const [genero, setGenero] = useState<string | null>(null);
  const [franja, setFranja] = useState<string | null>(null);
  const cargarPagina = useServerFn(listarCandidatosPublicos);

  /** null = aún no se ha filtrado, se usa la página inicial del loader */
  const [pagina, setPagina] = useState<{
    candidatos: CandidatoPublico[];
    total: number;
    hayMas: boolean;
  } | null>(null);
  const [cargando, setCargando] = useState(false);
  /** true solo mientras espera una recarga por cambio de filtro (offset 0) */
  const [cargandoFiltro, setCargandoFiltro] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  /** Función que devuelve el token actual de Turnstile y resetea el widget. */
  const obtenerToken = useRef<(() => string | undefined) | null>(null);
  const registrarTurnstile = useRef((fn: () => string | undefined) => {
    obtenerToken.current = fn;
  }).current;

  const base = useMemo(
    () =>
      pagina ??
      (listado.estado === "ok"
        ? {
            candidatos: listado.candidatos,
            total: listado.total,
            hayMas: listado.hayMas,
          }
        : { candidatos: [], total: 0, hayMas: false }),
    [pagina, listado],
  );

  const visibles = base.candidatos;
  const hayFiltros = Boolean(categoria || genero || franja);

  function filtrosServidor(
    cat: string | null,
    gen: string | null,
    fr: string | null,
  ) {
    const rango = FRANJAS_EDAD.find((f) => f.clave === fr);
    return {
      ...(cat ? { categoria: cat } : {}),
      ...(gen ? { genero: gen } : {}),
      ...(rango ? { edadMin: rango.min, edadMax: rango.max } : {}),
    };
  }

  async function pedir(
    cat: string | null,
    gen: string | null,
    fr: string | null,
    offset: number,
  ) {
    const porFiltro = offset === 0;
    setCargando(true);
    setCargandoFiltro(porFiltro);
    setErrorCarga(null);
    try {
      const filtros = filtrosServidor(cat, gen, fr);
      const necesitaToken = offset > 0 || Object.keys(filtros).length > 0;
      const token = necesitaToken ? obtenerToken.current?.() : undefined;
      const res = await cargarPagina({
        data: {
          limit: PAGINA,
          offset,
          ...filtros,
          ...(token ? { turnstileToken: token } : {}),
        },
      });
      if (res.estado === "limitado") {
        setErrorCarga("Demasiadas consultas desde tu conexión. Prueba en unos minutos.");
        return;
      }
      setPagina((prev) =>
        offset > 0 && prev
          ? {
              candidatos: [...prev.candidatos, ...res.candidatos],
              total: res.total,
              hayMas: res.hayMas,
            }
          : { candidatos: res.candidatos, total: res.total, hayMas: res.hayMas },
      );
    } catch {
      setErrorCarga("No hemos podido cargar más candidatos. Inténtalo de nuevo.");
    } finally {
      setCargando(false);
      setCargandoFiltro(false);
    }
  }

  function aplicarFiltros(
    cat: string | null,
    gen: string | null,
    fr: string | null,
  ) {
    setCategoria(cat);
    setGenero(gen);
    setFranja(fr);
    void pedir(cat, gen, fr, 0);
  }

  function cargarMas() {
    void pedir(categoria, genero, franja, visibles.length);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <CabeceraPublica />

      <header className="border-b border-border bg-brand-charcoal text-brand-cream">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Base de datos FigurArte
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">
            Candidatos disponibles
          </h1>
          <p className="mt-5 max-w-2xl text-brand-cream/80">
            Perfiles revisados y verificados por nuestro equipo. Filtra por categoría,
            género y franja de edad; si te interesa alguno, contáctanos indicando su
            referencia.
          </p>
        </div>
      </header>

      <section className="border-b border-border bg-muted/40">
        <div className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filtrar
          </p>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Categoría
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS.map((cat) => (
                <Chip
                  key={cat.valor}
                  activo={categoria === cat.valor}
                  deshabilitado={cargandoFiltro}
                  onClick={() =>
                    aplicarFiltros(
                      categoria === cat.valor ? null : cat.valor,
                      genero,
                      franja,
                    )
                  }
                >
                  {cat.etiqueta}
                </Chip>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Género
            </p>
            <div className="flex flex-wrap gap-2">
              {GENEROS_FILTRO.map((g) => (
                <Chip
                  key={g}
                  activo={genero === g}
                  deshabilitado={cargandoFiltro}
                  onClick={() => aplicarFiltros(categoria, genero === g ? null : g, franja)}
                >
                  {g}
                </Chip>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Franja de edad
            </p>
            <div className="flex flex-wrap gap-2">
              {FRANJAS_EDAD.map((f) => (
                <Chip
                  key={f.clave}
                  activo={franja === f.clave}
                  deshabilitado={cargandoFiltro}
                  onClick={() =>
                    aplicarFiltros(categoria, genero, franja === f.clave ? null : f.clave)
                  }
                >
                  {f.etiqueta}
                </Chip>
              ))}
            </div>
          </div>

          {hayFiltros && (
            <Button
              variant="outline"
              size="sm"
              disabled={cargandoFiltro}
              onClick={() => aplicarFiltros(null, null, null)}
            >
              Quitar filtros
            </Button>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        {listado.estado === "limitado" ? (
          <p className="border border-border bg-card p-6 text-sm">
            Demasiadas consultas desde tu conexión. Prueba de nuevo en unos minutos.
          </p>
        ) : visibles.length === 0 ? (
          <div className="flex flex-col items-center border border-dashed border-border bg-card px-6 py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
            <p className="mt-4 text-lg font-semibold">
              No hay candidatos que encajen con esta búsqueda
            </p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Prueba con otra combinación de filtros, o cuéntanos qué perfil necesitas y
              lo buscamos en toda nuestra base de datos.
            </p>
            <Button asChild className="mt-6">
              <Link to="/registro-cliente">Solicitar un proyecto</Link>
            </Button>
          </div>
        ) : (
          <>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              {cargandoFiltro ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Actualizando…
                </>
              ) : (
                `${visibles.length} de ${base.total} candidatos`
              )}
            </p>
            <div
              className={`mt-6 grid grid-cols-1 gap-4 transition-opacity duration-300 sm:grid-cols-2 lg:grid-cols-4 ${
                cargandoFiltro ? "opacity-40" : "opacity-100"
              }`}
            >
              {visibles.map((c) => (
                <Tarjeta key={c.id} c={c} />
              ))}
            </div>
            {errorCarga && (
              <p className="mt-6 text-sm text-destructive">{errorCarga}</p>
            )}
            {base.hayMas && (
              <div className="mt-10 flex justify-center">
                <Button onClick={cargarMas} disabled={cargando} variant="outline">
                  {cargando ? "Cargando…" : "Cargar más candidatos"}
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      <PieLegal />
    </main>
  );
}
