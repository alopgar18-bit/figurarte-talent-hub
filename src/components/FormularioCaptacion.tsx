import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Drama, Camera, Users, Sparkles, Upload, Check } from "lucide-react";
import { RecorteFoto, type AreaRecorte } from "@/components/RecorteFoto";
import { supabase } from "@/integrations/supabase/client";
import { crearCandidatura } from "@/lib/candidatos.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export type CategoriaCandidato = "actor" | "modelo" | "figurante" | "casting_plus";

const CATEGORIAS: {
  valor: CategoriaCandidato;
  titulo: string;
  texto: string;
  icon: typeof Drama;
}[] = [
  { valor: "actor", titulo: "Actor / Actriz", texto: "Interpretación con texto", icon: Drama },
  { valor: "modelo", titulo: "Modelo", texto: "Publicidad, pasarela, editorial", icon: Camera },
  { valor: "figurante", titulo: "Figurante", texto: "Ambiente, escenas grupales", icon: Users },
  { valor: "casting_plus", titulo: "Casting +", texto: "Otros perfiles profesionales", icon: Sparkles },
];

const RANURAS_FOTO = [
  { clave: "rostro", etiqueta: "Foto de rostro" },
  { clave: "cuerpo", etiqueta: "Foto de cuerpo entero" },
  { clave: "extra", etiqueta: "Foto adicional" },
] as const;

type Props = {
  categoriaInicial?: CategoriaCandidato | undefined;
  /** Variante casting: muestra el aviso y asocia al proyecto */
  proyectoId?: string | undefined;
  nombreCasting?: string | undefined;
};

/** Genera una miniatura 3:4 en el navegador, solo para previsualizar. */
async function generarPreview(file: File, area: AreaRecorte): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("imagen no válida"));
      el.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (!ctx) return url;
    ctx.drawImage(
      img,
      area.x,
      area.y,
      area.width,
      area.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    return canvas.toDataURL("image/jpeg", 0.8);
  } catch {
    return url;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function rutaAleatoria(file: File) {
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().slice(0, 5);
  return `${crypto.randomUUID()}/${crypto.randomUUID()}.${ext}`;
}

export function FormularioCaptacion({
  categoriaInicial,
  proyectoId,
  nombreCasting,
}: Props) {
  const enviar = useServerFn(crearCandidatura);

  const [categoria, setCategoria] = useState<CategoriaCandidato | null>(
    categoriaInicial ?? null,
  );
  const [nombre, setNombre] = useState("");
  const [altura, setAltura] = useState("");
  const [peso, setPeso] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [rgpd, setRgpd] = useState(false);
  const [archivos, setArchivos] = useState<
    Record<string, { file: File; area: AreaRecorte; preview: string } | undefined>
  >({});
  const [recortando, setRecortando] = useState<
    { clave: string; etiqueta: string; file: File } | null
  >(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicado, setDuplicado] = useState(false);
  const [exito, setExito] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDuplicado(false);

    if (!categoria) return setError("Elige una categoría para continuar.");
    if (nombre.trim().length < 2) return setError("Escribe tu nombre completo.");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Escribe un email válido.");
    if (telefono.trim().length < 6) return setError("Escribe un teléfono válido.");
    if (!rgpd) return setError("Debes aceptar la cesión de datos y fotografías.");

    setEnviando(true);
    try {
      const rutas: string[] = [];
      const recortes: Record<string, AreaRecorte> = {};
      for (const ranura of RANURAS_FOTO) {
        const entrada = archivos[ranura.clave];
        if (!entrada) continue;
        const path = rutaAleatoria(entrada.file);
        const { error: upErr } = await supabase.storage
          .from("candidatos-fotos")
          .upload(path, entrada.file, { upsert: false });
        if (upErr) throw new Error("No se pudieron subir las fotos. Inténtalo de nuevo.");
        rutas.push(path);
        recortes[path] = entrada.area;
      }

      const res = await enviar({
        data: {
          nombre: nombre.trim(),
          categoria,
          email: email.trim(),
          telefono: telefono.trim(),
          ciudad: ciudad.trim() || null,
          altura_cm: altura ? Number(altura) : null,
          peso_kg: peso ? Number(peso) : null,
          fotos: rutas,
          fotos_recorte: Object.keys(recortes).length ? recortes : null,
          consentimiento_rgpd: true,
          proyecto_id: proyectoId ?? null,
        },
      });

      if (res.estado === "duplicado") setDuplicado(true);
      else if (res.estado === "error") setError(res.mensaje);
      else setExito(res.codigo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo ha fallado. Inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  if (exito) {
    return (
      <div className="rounded-md border border-border bg-card p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Check className="h-6 w-6 text-primary" />
        </div>
        <h2 className="mt-4 text-2xl font-black tracking-tight">
          Candidatura recibida
        </h2>
        <p className="mt-2 text-muted-foreground">
          En breve revisamos tu perfil. Tu referencia es{" "}
          <span className="font-semibold text-foreground">{exito}</span>.
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          Termina de completar tu perfil cuando quieras entrando en tu área de
          candidato: apellidos, datos físicos, habilidades e idiomas ayudan a que
          te encontremos para más castings.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link to="/auth">Acceder a mi ficha</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Volver al inicio</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-10">
      {recortando && (
        <RecorteFoto
          file={recortando.file}
          titulo={recortando.etiqueta}
          onCancelar={() => setRecortando(null)}
          onConfirmar={async (area) => {
            const actual = recortando;
            setRecortando(null);
            const preview = await generarPreview(actual.file, area);
            setArchivos((prev) => ({
              ...prev,
              [actual.clave]: { file: actual.file, area, preview },
            }));
          }}
        />
      )}

      {nombreCasting && (
        <div className="rounded-md border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-semibold text-foreground">
          Te apuntas a: {nombreCasting}
        </div>
      )}

      {/* Paso 1 */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-primary">
          Paso 1 — Categoría
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIAS.map((cat) => {
            const activa = categoria === cat.valor;
            return (
              <button
                key={cat.valor}
                type="button"
                aria-pressed={activa}
                onClick={() => setCategoria(cat.valor)}
                className={cn(
                  "flex flex-col rounded-md border bg-card p-5 text-left transition-colors",
                  activa
                    ? "border-primary ring-1 ring-primary"
                    : "border-border hover:border-primary/60",
                )}
              >
                <cat.icon className="h-7 w-7 text-primary" />
                <span className="mt-3 font-bold">{cat.titulo}</span>
                <span className="mt-1 text-sm text-muted-foreground">{cat.texto}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Paso 2 */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-primary">
          Paso 2 — Datos y medidas
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="nombre">Nombre completo *</Label>
            <Input id="nombre" value={nombre} maxLength={120} onChange={(e) => setNombre(e.target.value)} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="altura">Altura (cm)</Label>
            <Input id="altura" type="number" inputMode="numeric" value={altura} onChange={(e) => setAltura(e.target.value)} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="peso">Peso (kg)</Label>
            <Input id="peso" type="number" inputMode="numeric" value={peso} onChange={(e) => setPeso(e.target.value)} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="telefono">Teléfono *</Label>
            <Input id="telefono" type="tel" value={telefono} maxLength={30} onChange={(e) => setTelefono(e.target.value)} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input id="email" type="email" value={email} maxLength={255} onChange={(e) => setEmail(e.target.value)} className="mt-2" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="ciudad">Ciudad</Label>
            <Input id="ciudad" value={ciudad} maxLength={120} onChange={(e) => setCiudad(e.target.value)} className="mt-2" />
          </div>
        </div>
      </section>

      {/* Paso 3 */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-primary">
          Paso 3 — Fotos
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {RANURAS_FOTO.map((ranura) => {
            const entrada = archivos[ranura.clave];
            return (
              <div
                key={ranura.clave}
                className="rounded-md border border-dashed border-border bg-card p-3 text-center"
              >
                <label className="block cursor-pointer">
                  <span className="sr-only">{ranura.etiqueta}</span>
                  {entrada ? (
                    <img
                      src={entrada.preview}
                      alt={`Vista previa de ${ranura.etiqueta.toLowerCase()}`}
                      className="mx-auto aspect-[3/4] w-full max-w-[200px] rounded-sm object-cover"
                    />
                  ) : (
                    <span className="mx-auto flex aspect-[3/4] w-full max-w-[200px] flex-col items-center justify-center gap-2 rounded-sm bg-muted/50 text-muted-foreground transition-colors hover:text-primary">
                      <Upload className="h-7 w-7" />
                      <span className="text-xs">JPG o PNG, máx. 10 MB</span>
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (!f) return;
                      setRecortando({
                        clave: ranura.clave,
                        etiqueta: ranura.etiqueta,
                        file: f,
                      });
                    }}
                  />
                  <span className="mt-3 block text-sm font-semibold">
                    {ranura.etiqueta}
                  </span>
                  <span className="mt-1 block text-xs text-primary underline">
                    {entrada ? "Cambiar foto" : "Elegir foto"}
                  </span>
                </label>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Las imágenes se recortan y dimensionan automáticamente al formato de
          dossier — sin errores de carga.
        </p>
      </section>

      {/* RGPD */}
      <div className="flex items-start gap-3 rounded-md border border-border bg-muted/40 p-4">
        <Checkbox
          id="rgpd"
          checked={rgpd}
          onCheckedChange={(v) => setRgpd(v === true)}
          className="mt-0.5"
        />
        <Label htmlFor="rgpd" className="text-sm font-normal leading-relaxed">
          Acepto la cesión de mis datos y fotografías para su presentación a
          clientes de FIGURARTE, según la política de privacidad. *
        </Label>
      </div>

      {duplicado && (
        <div className="rounded-md border border-primary/40 bg-primary/10 p-4 text-sm">
          Ya tienes una ficha con este email. Accede con tu enlace mágico en{" "}
          <Link to="/auth" className="font-semibold text-primary underline">
            /auth
          </Link>{" "}
          para verla o actualizarla.
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" size="lg" disabled={enviando} className="w-full sm:w-auto">
        {enviando ? "Enviando…" : "Enviar candidatura"}
      </Button>
    </form>
  );
}
