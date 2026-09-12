import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Drama, Camera, Users, Sparkles, Upload, Check } from "lucide-react";
import { RecorteFoto, type AreaRecorte } from "@/components/RecorteFoto";
import { supabase } from "@/integrations/supabase/client";
import { crearCandidatura } from "@/lib/candidatos.functions";
import { obtenerUrlSubidaFoto } from "@/lib/subida-fotos.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PROVINCIAS_ES,
  TALLAS_CALZADO,
  TALLAS_CAMISA,
  TALLAS_PANTALON,
  provinciaPorCp,
} from "@/lib/catalogos";
import { cn } from "@/lib/utils";

const SIN_VALOR = "__sin_valor__";

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
  /** Trazabilidad de captación en redes */
  convocatoriaId?: string | undefined;
  canal?: "instagram" | "whatsapp" | "web" | undefined;
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

const EXTENSIONES_VALIDAS = ["jpg", "jpeg", "png", "webp", "heic"] as const;
type ExtensionFoto = (typeof EXTENSIONES_VALIDAS)[number];

function extensionDe(file: File): ExtensionFoto {
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  return (EXTENSIONES_VALIDAS as readonly string[]).includes(ext)
    ? (ext as ExtensionFoto)
    : "jpg";
}

export function FormularioCaptacion({
  categoriaInicial,
  proyectoId,
  nombreCasting,
  convocatoriaId,
  canal,
}: Props) {
  const enviar = useServerFn(crearCandidatura);
  const pedirSubida = useServerFn(obtenerUrlSubidaFoto);

  const [categoria, setCategoria] = useState<CategoriaCandidato | null>(
    categoriaInicial ?? null,
  );
  const [nombre, setNombre] = useState("");
  const [altura, setAltura] = useState("");
  const [peso, setPeso] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [provincia, setProvincia] = useState("");
  const [codigoPostal, setCodigoPostal] = useState("");
  const [tallaCamisa, setTallaCamisa] = useState("");
  const [tallaPantalon, setTallaPantalon] = useState("");
  const [tallaCalzado, setTallaCalzado] = useState("");
  const [rgpd, setRgpd] = useState(false);
  const [archivos, setArchivos] = useState<
    Record<string, { file: File; area: AreaRecorte; preview: string } | undefined>
  >({});
  const [recortando, setRecortando] = useState<
    { clave: string; etiqueta: string; file: File } | null
  >(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<{ avisoCasting: boolean } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    

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
        const permiso = await pedirSubida({
          data: { extension: extensionDe(entrada.file) },
        });
        if (permiso.estado === "limite")
          throw new Error("Demasiados intentos de subida. Prueba de nuevo dentro de un rato.");
        if (permiso.estado !== "ok")
          throw new Error("No se pudieron subir las fotos. Inténtalo de nuevo.");

        const { error: upErr } = await supabase.storage
          .from("candidatos-fotos")
          .uploadToSignedUrl(permiso.path, permiso.token, entrada.file);
        if (upErr) throw new Error("No se pudieron subir las fotos. Inténtalo de nuevo.");
        rutas.push(permiso.path);
        recortes[permiso.path] = entrada.area;
      }

      const res = await enviar({
        data: {
          nombre: nombre.trim(),
          categoria,
          email: email.trim(),
          telefono: telefono.trim(),
          ciudad: ciudad.trim() || null,
          provincia: provincia || null,
          codigo_postal: codigoPostal.trim() || null,
          talla_camisa: tallaCamisa || null,
          talla_pantalon: tallaPantalon || null,
          talla_calzado: tallaCalzado || null,
          altura_cm: altura ? Number(altura) : null,
          peso_kg: peso ? Number(peso) : null,
          fotos: rutas,
          fotos_recorte: Object.keys(recortes).length ? recortes : null,
          consentimiento_rgpd: true,
          proyecto_id: proyectoId ?? null,
          convocatoria_id: convocatoriaId ?? null,
          canal: canal ?? null,
        },
      });

      if (res.estado === "limite")
        setError("Demasiados intentos. Prueba de nuevo en unos minutos.");
      else if (res.estado === "error") setError(res.mensaje);
      else setExito({ avisoCasting: res.avisoCasting === true });
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
          Hemos recibido tu solicitud
        </h2>
        <p className="mt-2 text-muted-foreground">
          Revisa tu correo: te hemos enviado los datos de acceso a tu área de
          candidato.
        </p>
        {exito.avisoCasting && (
          <p className="mx-auto mt-4 max-w-md rounded-md border border-primary/40 bg-primary/10 p-4 text-sm">
            Tu candidatura se ha registrado, pero no hemos podido apuntarte
            automáticamente a este casting. Escríbenos o vuelve a intentarlo
            desde tu área de candidato.
          </p>
        )}
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
          <div>
            <Label htmlFor="cp">Código postal</Label>
            <Input
              id="cp"
              inputMode="numeric"
              maxLength={5}
              value={codigoPostal}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 5);
                setCodigoPostal(v);
                const deducida = provinciaPorCp(v);
                if (deducida) setProvincia(deducida);
                if (v.length === 5) {
                  void municipioPorCp(v).then((m) => {
                    if (m) setCiudad(m);
                  });
                }
              }}
              className="mt-2"
              placeholder="29001"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Al escribirlo completamos tu provincia y municipio; puedes cambiarlos.
            </p>
          </div>
          <div>
            <Label htmlFor="provincia">Provincia</Label>
            <Select
              value={provincia || SIN_VALOR}
              onValueChange={(v) => {
                const nueva = v === SIN_VALOR ? "" : v;
                setProvincia(nueva);
                setCiudad("");
              }}
            >
              <SelectTrigger id="provincia" className="mt-2" aria-label="Provincia">
                <SelectValue placeholder="Elige provincia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SIN_VALOR}>Sin especificar</SelectItem>
                {PROVINCIAS_ES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(
            [
              { id: "talla-camisa", etiqueta: "Talla de camisa", valor: tallaCamisa, set: setTallaCamisa, opciones: TALLAS_CAMISA },
              { id: "talla-pantalon", etiqueta: "Talla de pantalón", valor: tallaPantalon, set: setTallaPantalon, opciones: TALLAS_PANTALON },
              { id: "talla-calzado", etiqueta: "Talla de calzado (EU)", valor: tallaCalzado, set: setTallaCalzado, opciones: TALLAS_CALZADO },
            ] as const
          ).map((campo) => (
            <div key={campo.id}>
              <Label htmlFor={campo.id}>{campo.etiqueta}</Label>
              <Select
                value={campo.valor || SIN_VALOR}
                onValueChange={(v) => campo.set(v === SIN_VALOR ? "" : v)}
              >
                <SelectTrigger id={campo.id} className="mt-2" aria-label={campo.etiqueta}>
                  <SelectValue placeholder="Sin especificar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SIN_VALOR}>Sin especificar</SelectItem>
                  {campo.opciones.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
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
          clientes de FIGURARTE, según la{" "}
          <Link to="/privacidad" className="text-primary underline underline-offset-4">
            política de privacidad
          </Link>
          . *
        </Label>
      </div>

      <p className="text-xs text-muted-foreground">
        Consulta también el{" "}
        <Link to="/aviso-legal" className="underline underline-offset-4">
          aviso legal
        </Link>
        . Puedes descargar o eliminar tus datos cuando quieras desde tu área de candidato.
      </p>



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
