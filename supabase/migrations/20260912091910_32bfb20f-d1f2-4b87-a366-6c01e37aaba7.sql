CREATE TABLE public.filtros_guardados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL DEFAULT auth.uid(),
  nombre text NOT NULL,
  condiciones jsonb NOT NULL DEFAULT '[]'::jsonb,
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.filtros_guardados TO authenticated;
GRANT ALL ON public.filtros_guardados TO service_role;

ALTER TABLE public.filtros_guardados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "filtros_guardados_select_propios"
  ON public.filtros_guardados FOR SELECT TO authenticated
  USING (usuario_id = auth.uid());

CREATE POLICY "filtros_guardados_insert_propios"
  ON public.filtros_guardados FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "filtros_guardados_update_propios"
  ON public.filtros_guardados FOR UPDATE TO authenticated
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "filtros_guardados_delete_propios"
  ON public.filtros_guardados FOR DELETE TO authenticated
  USING (usuario_id = auth.uid());

CREATE INDEX idx_filtros_guardados_usuario ON public.filtros_guardados (usuario_id, creado_en DESC);

CREATE TRIGGER update_filtros_guardados_updated_at
  BEFORE UPDATE ON public.filtros_guardados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();