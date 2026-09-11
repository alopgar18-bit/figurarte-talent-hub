DROP FUNCTION public.fn_datos_publicos_candidato(uuid[]);

CREATE FUNCTION public.fn_datos_publicos_candidato(ids uuid[])
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
   talla_calzado text,
   tipo_perfil jsonb,
   habilidades jsonb,
   carnes_conducir jsonb,
   idiomas_detalle jsonb,
   complexion text,
   tipo_pelo text,
   origen_etnia text,
   talla_chaqueta text,
   talla_zapato text
 )
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    c.id,
    c.codigo,
    c.nombre,
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
    c.talla_chaqueta,
    c.talla_zapato
  from public.candidatos c
  where c.id = any(ids)
$function$;

REVOKE ALL ON FUNCTION public.fn_datos_publicos_candidato(uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_datos_publicos_candidato(uuid[]) TO service_role;