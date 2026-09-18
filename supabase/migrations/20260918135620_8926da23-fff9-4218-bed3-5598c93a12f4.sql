DROP FUNCTION IF EXISTS public.fn_candidatos_publicos();

CREATE OR REPLACE FUNCTION public.fn_candidatos_publicos(p_limit integer DEFAULT 60, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, codigo text, categoria categoria_candidato, genero text, edad integer, provincia text, altura_cm integer, peso_kg integer, fotos text[], talla_camisa text, talla_pantalon text, talla_calzado text, talla_chaqueta text, complexion text, tipo_pelo text, color_cabello text, color_ojos text, tipo_perfil jsonb, habilidades jsonb, carnes_conducir jsonb, idiomas_detalle jsonb, total_disponibles bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    c.id, c.codigo, c.categoria, c.genero, c.edad, c.provincia,
    c.altura_cm, c.peso_kg, c.fotos,
    c.talla_camisa, c.talla_pantalon, c.talla_calzado, c.talla_chaqueta,
    c.complexion, c.tipo_pelo, c.color_cabello, c.color_ojos,
    coalesce(c.tipo_perfil, '[]'::jsonb),
    coalesce(c.habilidades, '[]'::jsonb),
    coalesce(c.carnes_conducir, '[]'::jsonb),
    coalesce(c.idiomas_detalle, '[]'::jsonb),
    count(*) OVER()::bigint
  FROM public.candidatos c
  WHERE c.disponible_publico = true
  ORDER BY c.codigo
  LIMIT LEAST(GREATEST(coalesce(p_limit, 60), 1), 100)
  OFFSET GREATEST(coalesce(p_offset, 0), 0)
$function$;