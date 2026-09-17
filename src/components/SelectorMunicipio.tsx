import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { municipiosDeProvincia, normalizar } from "@/lib/municipios";

/**
 * Buscador de municipios limitado a la provincia ya elegida.
 * Sin provincia no muestra lista: lo indica y no descarga los 8.132 municipios.
 */
export function SelectorMunicipio({
  id,
  provincia,
  valor,
  onChange,
  className,
}: {
  id?: string;
  provincia: string;
  valor: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [opciones, setOpciones] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    let activo = true;
    if (!provincia) {
      setOpciones([]);
      return;
    }
    setCargando(true);
    municipiosDeProvincia(provincia).then((lista) => {
      if (!activo) return;
      setOpciones(lista);
      setCargando(false);
    });
    return () => {
      activo = false;
    };
  }, [provincia]);

  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim());
    const lista = q ? opciones.filter((m) => normalizar(m).includes(q)) : opciones;
    return lista.slice(0, 200);
  }, [opciones, busqueda]);

  const sinProvincia = !provincia;

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={abierto}
          disabled={sinProvincia}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className={cn(!valor && "text-muted-foreground")}>
            {valor ||
              (sinProvincia ? "Elige antes la provincia" : "Busca tu municipio…")}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(20rem,calc(100vw-2rem))] p-0" align="start">
        <div className="border-b border-border p-2">
          <Input
            autoFocus
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={`Buscar en ${provincia}…`}
            aria-label="Buscar municipio"
          />
        </div>
        <div className="max-h-64 overflow-y-auto py-1">
          {cargando ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Cargando municipios…</p>
          ) : visibles.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              Ningún municipio coincide.
            </p>
          ) : (
            visibles.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  onChange(m);
                  setAbierto(false);
                  setBusqueda("");
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <Check
                  className={cn("h-4 w-4", valor === m ? "opacity-100" : "opacity-0")}
                />
                {m}
              </button>
            ))
          )}
        </div>
        {valor && (
          <div className="border-t border-border p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onChange("");
                setAbierto(false);
              }}
            >
              Quitar municipio
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
