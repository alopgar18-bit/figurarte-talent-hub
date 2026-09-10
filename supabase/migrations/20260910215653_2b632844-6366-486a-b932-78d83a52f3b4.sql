ALTER TABLE public.candidatos
  ADD COLUMN IF NOT EXISTS talla_camisa text,
  ADD COLUMN IF NOT EXISTS anchura_pecho text,
  ADD COLUMN IF NOT EXISTS talla_pantalon text,
  ADD COLUMN IF NOT EXISTS anchura_cintura text,
  ADD COLUMN IF NOT EXISTS talla_calzado text;