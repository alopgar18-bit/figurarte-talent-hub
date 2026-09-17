ALTER TABLE public.candidatos
  ADD COLUMN IF NOT EXISTS baja_comunicaciones boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fecha_baja_comunicaciones timestamptz;