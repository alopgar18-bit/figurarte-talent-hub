CREATE OR REPLACE FUNCTION public.fn_datos_publicos_candidato(ids uuid[])
RETURNS TABLE (
  id uuid,
  codigo text,
  nombre text,
  categoria public.categoria_candidato,
  edad integer,
  provincia text,
  altura_cm integer,
  peso_kg integer,
  fotos text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.codigo,
    c.nombre,
    c.categoria,
    c.edad,
    c.provincia,
    c.altura_cm,
    c.peso_kg,
    c.fotos
  FROM public.candidatos AS c
  WHERE c.id = ANY(ids)
$$;

REVOKE ALL ON FUNCTION public.fn_datos_publicos_candidato(uuid[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_datos_publicos_candidato(uuid[]) FROM anon;
REVOKE ALL ON FUNCTION public.fn_datos_publicos_candidato(uuid[]) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.fn_datos_publicos_candidato(uuid[]) TO service_role;