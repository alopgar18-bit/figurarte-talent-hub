ALTER TABLE public.candidatos ADD COLUMN IF NOT EXISTS revisado_publico boolean NOT NULL DEFAULT false;

-- Los candidatos ya publicados o ya tocados por el equipo se consideran revisados.
UPDATE public.candidatos SET revisado_publico = true WHERE disponible_publico = true;