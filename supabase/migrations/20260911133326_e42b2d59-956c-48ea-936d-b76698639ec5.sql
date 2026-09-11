DROP POLICY IF EXISTS convocatorias_select_publico ON public.convocatorias_rrss;

CREATE POLICY convocatorias_select_staff ON public.convocatorias_rrss
  FOR SELECT TO authenticated
  USING (public.es_staff(auth.uid()));

REVOKE SELECT ON public.convocatorias_rrss FROM anon;

CREATE OR REPLACE FUNCTION public.fn_resolver_enlace_captacion(_codigo text)
RETURNS TABLE(convocatoria_id uuid, categoria categoria_candidato, canal text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT c.id, c.categoria, canal.clave
  FROM public.convocatorias_rrss c
  CROSS JOIN LATERAL (
    SELECT k AS clave
    FROM jsonb_each_text(coalesce(c.enlaces_por_canal, '{}'::jsonb)) AS e(k, v)
    WHERE v = _codigo
    LIMIT 1
  ) AS canal
  WHERE _codigo IS NOT NULL
    AND length(_codigo) BETWEEN 3 AND 40
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.fn_resolver_enlace_captacion(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_resolver_enlace_captacion(text) TO service_role;