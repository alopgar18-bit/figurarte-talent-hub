-- A1: unificar talla de pie en talla_calzado
UPDATE public.candidatos
SET talla_calzado = talla_zapato
WHERE (talla_calzado IS NULL OR btrim(talla_calzado) = '')
  AND talla_zapato IS NOT NULL AND btrim(talla_zapato) <> '';

DROP FUNCTION IF EXISTS public.fn_datos_publicos_candidato(uuid[]);

ALTER TABLE public.candidatos DROP COLUMN talla_zapato;

-- A3: anchura_pecho / anchura_cintura como enteros (cm)
ALTER TABLE public.candidatos
  ALTER COLUMN anchura_pecho TYPE integer
    USING NULLIF(regexp_replace(anchura_pecho, '[^0-9]', '', 'g'), '')::integer,
  ALTER COLUMN anchura_cintura TYPE integer
    USING NULLIF(regexp_replace(anchura_cintura, '[^0-9]', '', 'g'), '')::integer;

CREATE FUNCTION public.fn_datos_publicos_candidato(ids uuid[])
RETURNS TABLE(
  id uuid, codigo text, categoria categoria_candidato, edad integer, provincia text,
  altura_cm integer, peso_kg integer, fotos text[], talla_camisa text, anchura_pecho integer,
  talla_pantalon text, anchura_cintura integer, talla_calzado text, tipo_perfil jsonb,
  habilidades jsonb, carnes_conducir jsonb, idiomas_detalle jsonb, complexion text,
  tipo_pelo text, origen_etnia text, talla_chaqueta text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  select
    c.id,
    c.codigo,
    c.categoria,
    c.edad,
    c.provincia,
    c.altura_cm,
    c.peso_kg,
    c.fotos,
    c.talla_camisa,
    c.anchura_pecho,
    c.talla_pantalon,
    c.anchura_cintura,
    c.talla_calzado,
    coalesce(c.tipo_perfil, '[]'::jsonb),
    coalesce(c.habilidades, '[]'::jsonb),
    coalesce(c.carnes_conducir, '[]'::jsonb),
    coalesce(c.idiomas_detalle, '[]'::jsonb),
    c.complexion,
    c.tipo_pelo,
    c.origen_etnia,
    c.talla_chaqueta
  from public.candidatos c
  where c.id = any(ids)
$function$;

REVOKE ALL ON FUNCTION public.fn_datos_publicos_candidato(uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_datos_publicos_candidato(uuid[]) TO service_role;