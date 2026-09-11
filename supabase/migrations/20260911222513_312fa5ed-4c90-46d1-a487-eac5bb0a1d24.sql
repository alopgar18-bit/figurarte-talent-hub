-- 1. Marca de publicación pública (distinta de `disponible`)
ALTER TABLE public.candidatos
  ADD COLUMN IF NOT EXISTS disponible_publico boolean NOT NULL DEFAULT false;

-- Solo admin/superadmin puede cambiar el flag. Una policy permisiva no puede
-- restringir una columna concreta (las policies se combinan con OR), así que
-- la restricción real se impone con un trigger.
CREATE OR REPLACE FUNCTION public.fn_guardia_disponible_publico()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.disponible_publico IS DISTINCT FROM OLD.disponible_publico
     AND auth.uid() IS NOT NULL
     AND NOT public.es_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Solo un administrador puede publicar o despublicar un candidato';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guardia_disponible_publico ON public.candidatos;
CREATE TRIGGER trg_guardia_disponible_publico
  BEFORE UPDATE ON public.candidatos
  FOR EACH ROW EXECUTE FUNCTION public.fn_guardia_disponible_publico();

-- Policy propia y específica de UPDATE para admins (no sustituye ni relaja las existentes)
CREATE POLICY "candidatos_update_publicacion_admin"
  ON public.candidatos FOR UPDATE TO authenticated
  USING (public.es_admin(auth.uid()))
  WITH CHECK (public.es_admin(auth.uid()));

-- 2. Datos que puede ver cualquiera en la vista pública nueva.
--    Excluye explícitamente origen_etnia y color_piel (categoría especial)
--    y cualquier dato de contacto o identificativo.
CREATE OR REPLACE FUNCTION public.fn_candidatos_publicos()
RETURNS TABLE(
  id uuid, codigo text, categoria categoria_candidato, genero text, edad integer,
  provincia text, altura_cm integer, peso_kg integer, fotos text[],
  talla_camisa text, talla_pantalon text, talla_calzado text, talla_chaqueta text,
  complexion text, tipo_pelo text, color_cabello text, color_ojos text,
  tipo_perfil jsonb, habilidades jsonb, carnes_conducir jsonb, idiomas_detalle jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id, c.codigo, c.categoria, c.genero, c.edad, c.provincia,
    c.altura_cm, c.peso_kg, c.fotos,
    c.talla_camisa, c.talla_pantalon, c.talla_calzado, c.talla_chaqueta,
    c.complexion, c.tipo_pelo, c.color_cabello, c.color_ojos,
    coalesce(c.tipo_perfil, '[]'::jsonb),
    coalesce(c.habilidades, '[]'::jsonb),
    coalesce(c.carnes_conducir, '[]'::jsonb),
    coalesce(c.idiomas_detalle, '[]'::jsonb)
  FROM public.candidatos c
  WHERE c.disponible_publico = true
  ORDER BY c.codigo
  LIMIT 500
$$;

REVOKE ALL ON FUNCTION public.fn_candidatos_publicos() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_candidatos_publicos() TO service_role;

-- 3. Programas de TV
CREATE TABLE IF NOT EXISTS public.programas_tv (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  imagen_url text,
  link_formulario text NOT NULL,
  activo boolean NOT NULL DEFAULT true,
  orden integer NOT NULL DEFAULT 0,
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.programas_tv TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.programas_tv TO authenticated;
GRANT ALL ON public.programas_tv TO service_role;

ALTER TABLE public.programas_tv ENABLE ROW LEVEL SECURITY;

CREATE POLICY "programas_tv_select_publico"
  ON public.programas_tv FOR SELECT TO anon, authenticated
  USING (activo = true);

CREATE POLICY "programas_tv_select_staff"
  ON public.programas_tv FOR SELECT TO authenticated
  USING (public.es_staff(auth.uid()));

CREATE POLICY "programas_tv_insert_staff"
  ON public.programas_tv FOR INSERT TO authenticated
  WITH CHECK (public.es_staff(auth.uid()));

CREATE POLICY "programas_tv_update_staff"
  ON public.programas_tv FOR UPDATE TO authenticated
  USING (public.es_staff(auth.uid()))
  WITH CHECK (public.es_staff(auth.uid()));

CREATE POLICY "programas_tv_delete_staff"
  ON public.programas_tv FOR DELETE TO authenticated
  USING (public.es_admin(auth.uid()));

CREATE TRIGGER update_programas_tv_updated_at
  BEFORE UPDATE ON public.programas_tv
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();