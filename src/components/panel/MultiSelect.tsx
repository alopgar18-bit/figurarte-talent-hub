import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Filtro desplegable con selección múltiple (casillas). */
export function MultiSelect({
  etiqueta,
  opciones,
  seleccionados,
  alCambiar,
}: {
  etiqueta: string;
  opciones: { valor: string; etiqueta: string }[];
  seleccionados: string[];
  alCambiar: (valores: string[]) => void;
}) {
  function alternar(valor: string) {
    alCambiar(
      seleccionados.includes(valor)
        ? seleccionados.filter((v) => v !== valor)
        : [...seleccionados, valor],
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="justify-between">
          {etiqueta}
          {seleccionados.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {seleccionados.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
        <DropdownMenuLabel>{etiqueta}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {opciones.map((o) => (
          <DropdownMenuCheckboxItem
            key={o.valor}
            checked={seleccionados.includes(o.valor)}
            onCheckedChange={() => alternar(o.valor)}
            onSelect={(e) => e.preventDefault()}
          >
            {o.etiqueta}
          </DropdownMenuCheckboxItem>
        ))}
        {seleccionados.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={false}
              onCheckedChange={() => alCambiar([])}
              onSelect={(e) => e.preventDefault()}
            >
              Limpiar selección
            </DropdownMenuCheckboxItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
