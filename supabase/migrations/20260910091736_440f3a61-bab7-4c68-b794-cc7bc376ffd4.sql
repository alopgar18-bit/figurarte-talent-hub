
-- ENUMS
CREATE TYPE public.rol_usuario AS ENUM ('superadmin','admin_figurarte','coordinador','validador','cliente');
CREATE TYPE public.categoria_candidato AS ENUM ('actor','modelo','figurante','casting_plus');
CREATE TYPE public.estado_proyecto AS ENUM ('borrador','en_curso','cerrado');
CREATE TYPE public.estado_proyecto_candidato AS ENUM ('preseleccionado','enviado','contratado');
CREATE TYPE public.origen_proyecto_candidato AS ENUM ('manual','web_directa');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.actualizado_en = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

-- 1. USUARIOS
CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  rol public.rol_usuario NOT NULL DEFAULT 'coordinador',
  cliente_id UUID,
  ultimo_acceso TIMESTAMPTZ,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.usuarios TO authenticated;
GRANT ALL ON public.usuarios TO service_role;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usuarios_select_autenticados" ON public.usuarios
  FOR SELECT TO authenticated USING (true);

-- 2. CANDIDATOS
CREATE SEQUENCE public.candidatos_codigo_seq;
CREATE TABLE public.candidatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE DEFAULT 'FIG-' || lpad(nextval('public.candidatos_codigo_seq')::text, 5, '0'),
  nombre TEXT NOT NULL,
  categoria public.categoria_candidato NOT NULL,
  edad INTEGER,
  provincia TEXT,
  altura_cm INTEGER,
  peso_kg INTEGER,
  disponible BOOLEAN NOT NULL DEFAULT true,
  fotos TEXT[] NOT NULL DEFAULT '{}',
  video_youtube_id TEXT,
  video_youtube_url TEXT,
  video_privacy TEXT NOT NULL DEFAULT 'unlisted',
  consentimiento_rgpd BOOLEAN NOT NULL DEFAULT false,
  fecha_consentimiento TIMESTAMPTZ,
  email TEXT,
  telefono TEXT,
  ciudad TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT USAGE, SELECT ON SEQUENCE public.candidatos_codigo_seq TO service_role;
GRANT SELECT ON public.candidatos TO authenticated;
GRANT ALL ON public.candidatos TO service_role;
ALTER TABLE public.candidatos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "candidatos_select_autenticados" ON public.candidatos
  FOR SELECT TO authenticated USING (true);
CREATE TRIGGER update_candidatos_updated_at BEFORE UPDATE ON public.candidatos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. PROYECTOS_CASTING
CREATE TABLE public.proyectos_casting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  cliente_id UUID,
  estado public.estado_proyecto NOT NULL DEFAULT 'borrador',
  campos_personalizados_activados UUID[] NOT NULL DEFAULT '{}',
  publicado BOOLEAN NOT NULL DEFAULT false,
  slug_publico TEXT UNIQUE,
  brief_publico JSONB,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.proyectos_casting TO anon;
GRANT SELECT ON public.proyectos_casting TO authenticated;
GRANT ALL ON public.proyectos_casting TO service_role;
ALTER TABLE public.proyectos_casting ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proyectos_publicados_visibles" ON public.proyectos_casting
  FOR SELECT TO anon USING (publicado = true);
CREATE POLICY "proyectos_select_autenticados" ON public.proyectos_casting
  FOR SELECT TO authenticated USING (true);

-- 4. PROYECTO_CANDIDATOS
CREATE TABLE public.proyecto_candidatos (
  proyecto_id UUID NOT NULL REFERENCES public.proyectos_casting(id) ON DELETE CASCADE,
  candidato_id UUID NOT NULL REFERENCES public.candidatos(id) ON DELETE CASCADE,
  estado public.estado_proyecto_candidato NOT NULL DEFAULT 'preseleccionado',
  origen public.origen_proyecto_candidato NOT NULL DEFAULT 'manual',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (proyecto_id, candidato_id)
);
GRANT SELECT ON public.proyecto_candidatos TO authenticated;
GRANT ALL ON public.proyecto_candidatos TO service_role;
ALTER TABLE public.proyecto_candidatos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proyecto_candidatos_select_autenticados" ON public.proyecto_candidatos
  FOR SELECT TO authenticated USING (true);
