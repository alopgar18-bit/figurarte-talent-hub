DROP FUNCTION IF EXISTS public.fn_datos_publicos_candidato(uuid[]);

CREATE OR REPLACE FUNCTION public.fn_datos_publicos_candidato(ids uuid[])
RETURNS TABLE(
  id uuid,
  codigo text,
  nombre text,
  categoria categoria_candidato,
  edad integer,
  provincia text,
  altura_cm integer,
  peso_kg integer,
  fotos text[],
  talla_camisa text,
  anchura_pecho text,
  talla_pantalon text,
  anchura_cintura text,
  talla_calzado text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.codigo, c.nombre, c.categoria, c.edad, c.provincia,
         c.altura_cm, c.peso_kg, c.fotos,
         c.talla_camisa, c.anchura_pecho, c.talla_pantalon,
         c.anchura_cintura, c.talla_calzado
  FROM public.candidatos c
  WHERE c.id = ANY(ids)
$$;

REVOKE ALL ON FUNCTION public.fn_datos_publicos_candidato(uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_datos_publicos_candidato(uuid[]) TO service_role;