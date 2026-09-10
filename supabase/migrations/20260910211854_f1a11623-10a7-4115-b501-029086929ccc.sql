DROP POLICY IF EXISTS dossiers_select_publico ON public.dossiers;

CREATE OR REPLACE FUNCTION public.fn_dossier_publico(_slug text)
RETURNS TABLE(
  id uuid,
  proyecto_id uuid,
  candidatos_incluidos uuid[],
  fecha_caducidad timestamptz,
  creado_en timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.id, d.proyecto_id, d.candidatos_incluidos, d.fecha_caducidad, d.creado_en
  FROM public.dossiers d
  WHERE d.slug_publico = _slug
    AND _slug IS NOT NULL
    AND length(_slug) >= 8
    AND (d.fecha_caducidad IS NULL OR d.fecha_caducidad > now())
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.fn_dossier_publico(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_dossier_publico(text) TO service_role;

DROP POLICY IF EXISTS fotos_candidatos_subida_publica ON storage.objects;

ALTER TABLE public.proyectos_casting
  ADD CONSTRAINT proyectos_casting_cliente_id_fkey
  FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE SET NULL;

ALTER TABLE public.usuarios
  ADD CONSTRAINT usuarios_cliente_id_fkey
  FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE SET NULL;