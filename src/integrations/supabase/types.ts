export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accesos_invitados: {
        Row: {
          caduca_en: string | null
          cliente_id: string
          creado_en: string
          estado: Database["public"]["Enums"]["estado_acceso_invitado"]
          id: string
          proyecto_id: string | null
          ultima_visita: string | null
        }
        Insert: {
          caduca_en?: string | null
          cliente_id: string
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_acceso_invitado"]
          id?: string
          proyecto_id?: string | null
          ultima_visita?: string | null
        }
        Update: {
          caduca_en?: string | null
          cliente_id?: string
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_acceso_invitado"]
          id?: string
          proyecto_id?: string | null
          ultima_visita?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accesos_invitados_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accesos_invitados_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos_casting"
            referencedColumns: ["id"]
          },
        ]
      }
      asignaciones_pendientes_rgpd: {
        Row: {
          candidato_id: string
          creado_en: string
          id: string
          proyecto_id: string
        }
        Insert: {
          candidato_id: string
          creado_en?: string
          id?: string
          proyecto_id: string
        }
        Update: {
          candidato_id?: string
          creado_en?: string
          id?: string
          proyecto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asignaciones_pendientes_rgpd_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "candidatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_pendientes_rgpd_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos_casting"
            referencedColumns: ["id"]
          },
        ]
      }
      campos_personalizados: {
        Row: {
          categoria_aplicable:
            | Database["public"]["Enums"]["categoria_candidato"]
            | null
          creado_en: string
          creado_por: string | null
          id: string
          nombre: string
          tipo: Database["public"]["Enums"]["tipo_campo_personalizado"]
        }
        Insert: {
          categoria_aplicable?:
            | Database["public"]["Enums"]["categoria_candidato"]
            | null
          creado_en?: string
          creado_por?: string | null
          id?: string
          nombre: string
          tipo?: Database["public"]["Enums"]["tipo_campo_personalizado"]
        }
        Update: {
          categoria_aplicable?:
            | Database["public"]["Enums"]["categoria_candidato"]
            | null
          creado_en?: string
          creado_por?: string | null
          id?: string
          nombre?: string
          tipo?: Database["public"]["Enums"]["tipo_campo_personalizado"]
        }
        Relationships: []
      }
      candidato_campos_valor: {
        Row: {
          campo_id: string
          candidato_id: string
          creado_en: string
          valor: string | null
        }
        Insert: {
          campo_id: string
          candidato_id: string
          creado_en?: string
          valor?: string | null
        }
        Update: {
          campo_id?: string
          candidato_id?: string
          creado_en?: string
          valor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidato_campos_valor_campo_id_fkey"
            columns: ["campo_id"]
            isOneToOne: false
            referencedRelation: "campos_personalizados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidato_campos_valor_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "candidatos"
            referencedColumns: ["id"]
          },
        ]
      }
      candidatos: {
        Row: {
          acentos: string | null
          actualizado_en: string
          albino: boolean | null
          altura_cm: number | null
          anchura_cintura: number | null
          anchura_pecho: number | null
          apellidos: string | null
          baila: boolean | null
          baja_comunicaciones: boolean
          barbudo: boolean | null
          canta: boolean | null
          capacidad_diversa: boolean | null
          capacidad_diversa_obs: string | null
          capacidad_diversa_tipo: string | null
          carnes_conducir: Json | null
          categoria: Database["public"]["Enums"]["categoria_candidato"]
          ciudad: string | null
          codigo: string
          codigo_postal: string | null
          color_cabello: string | null
          color_ojos: string | null
          color_piel: string | null
          complexion: string | null
          consentimiento_rgpd: boolean
          creado_en: string
          disponible: boolean
          disponible_publico: boolean
          dni: string | null
          domicilio_fiscal_cp: string | null
          domicilio_fiscal_direccion: string | null
          domicilio_fiscal_localidad: string | null
          domicilio_fiscal_pais: string | null
          domicilio_fiscal_provincia: string | null
          edad: number | null
          email: string | null
          email_2: string | null
          enlaces: Json | null
          estudios: Json | null
          facebook_url: string | null
          fecha_baja_comunicaciones: string | null
          fecha_consentimiento: string | null
          fecha_nacimiento: string | null
          fotos: string[]
          fotos_recorte: Json | null
          genero: string | null
          habilidad_especial: string | null
          habilidades: Json | null
          hace_deporte: boolean | null
          id: string
          idiomas: string | null
          idiomas_detalle: Json | null
          instagram_url: string | null
          linkedin_url: string | null
          lugar_nacimiento: string | null
          monta_a_caballo: boolean | null
          nacionalidad: string | null
          nacionalidad_multiple: string | null
          nombre: string
          notas_migracion: string | null
          numero_seguridad_social: string | null
          origen_etnia: string | null
          otras_residencias: Json | null
          pais_origen: string | null
          pasaporte: string | null
          peso_kg: number | null
          profesion: string | null
          provincia: string | null
          ref_legado: number | null
          representacion: string | null
          revisado_publico: boolean
          talla_calzado: string | null
          talla_camisa: string | null
          talla_chaqueta: string | null
          talla_pantalon: string | null
          telefono: string | null
          telefono_2: string | null
          tiene_carnet_conducir: boolean | null
          tiene_cicatrices: boolean | null
          tiene_ortodoncia: boolean | null
          tiene_tatuajes: boolean | null
          tiene_titulo_patron_barco: boolean | null
          tiktok_url: string | null
          tipo_pelo: string | null
          tipo_perfil: Json | null
          toca_instrumentos: boolean | null
          tutor_apellidos: string | null
          tutor_dni: string | null
          tutor_nombre: string | null
          twitch_url: string | null
          twitter_url: string | null
          user_id: string | null
          video_book_url: string | null
          video_privacy: string
          video_youtube_id: string | null
          video_youtube_url: string | null
          web_url: string | null
          youtube_url: string | null
        }
        Insert: {
          acentos?: string | null
          actualizado_en?: string
          albino?: boolean | null
          altura_cm?: number | null
          anchura_cintura?: number | null
          anchura_pecho?: number | null
          apellidos?: string | null
          baila?: boolean | null
          baja_comunicaciones?: boolean
          barbudo?: boolean | null
          canta?: boolean | null
          capacidad_diversa?: boolean | null
          capacidad_diversa_obs?: string | null
          capacidad_diversa_tipo?: string | null
          carnes_conducir?: Json | null
          categoria: Database["public"]["Enums"]["categoria_candidato"]
          ciudad?: string | null
          codigo?: string
          codigo_postal?: string | null
          color_cabello?: string | null
          color_ojos?: string | null
          color_piel?: string | null
          complexion?: string | null
          consentimiento_rgpd?: boolean
          creado_en?: string
          disponible?: boolean
          disponible_publico?: boolean
          dni?: string | null
          domicilio_fiscal_cp?: string | null
          domicilio_fiscal_direccion?: string | null
          domicilio_fiscal_localidad?: string | null
          domicilio_fiscal_pais?: string | null
          domicilio_fiscal_provincia?: string | null
          edad?: number | null
          email?: string | null
          email_2?: string | null
          enlaces?: Json | null
          estudios?: Json | null
          facebook_url?: string | null
          fecha_baja_comunicaciones?: string | null
          fecha_consentimiento?: string | null
          fecha_nacimiento?: string | null
          fotos?: string[]
          fotos_recorte?: Json | null
          genero?: string | null
          habilidad_especial?: string | null
          habilidades?: Json | null
          hace_deporte?: boolean | null
          id?: string
          idiomas?: string | null
          idiomas_detalle?: Json | null
          instagram_url?: string | null
          linkedin_url?: string | null
          lugar_nacimiento?: string | null
          monta_a_caballo?: boolean | null
          nacionalidad?: string | null
          nacionalidad_multiple?: string | null
          nombre: string
          notas_migracion?: string | null
          numero_seguridad_social?: string | null
          origen_etnia?: string | null
          otras_residencias?: Json | null
          pais_origen?: string | null
          pasaporte?: string | null
          peso_kg?: number | null
          profesion?: string | null
          provincia?: string | null
          ref_legado?: number | null
          representacion?: string | null
          revisado_publico?: boolean
          talla_calzado?: string | null
          talla_camisa?: string | null
          talla_chaqueta?: string | null
          talla_pantalon?: string | null
          telefono?: string | null
          telefono_2?: string | null
          tiene_carnet_conducir?: boolean | null
          tiene_cicatrices?: boolean | null
          tiene_ortodoncia?: boolean | null
          tiene_tatuajes?: boolean | null
          tiene_titulo_patron_barco?: boolean | null
          tiktok_url?: string | null
          tipo_pelo?: string | null
          tipo_perfil?: Json | null
          toca_instrumentos?: boolean | null
          tutor_apellidos?: string | null
          tutor_dni?: string | null
          tutor_nombre?: string | null
          twitch_url?: string | null
          twitter_url?: string | null
          user_id?: string | null
          video_book_url?: string | null
          video_privacy?: string
          video_youtube_id?: string | null
          video_youtube_url?: string | null
          web_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          acentos?: string | null
          actualizado_en?: string
          albino?: boolean | null
          altura_cm?: number | null
          anchura_cintura?: number | null
          anchura_pecho?: number | null
          apellidos?: string | null
          baila?: boolean | null
          baja_comunicaciones?: boolean
          barbudo?: boolean | null
          canta?: boolean | null
          capacidad_diversa?: boolean | null
          capacidad_diversa_obs?: string | null
          capacidad_diversa_tipo?: string | null
          carnes_conducir?: Json | null
          categoria?: Database["public"]["Enums"]["categoria_candidato"]
          ciudad?: string | null
          codigo?: string
          codigo_postal?: string | null
          color_cabello?: string | null
          color_ojos?: string | null
          color_piel?: string | null
          complexion?: string | null
          consentimiento_rgpd?: boolean
          creado_en?: string
          disponible?: boolean
          disponible_publico?: boolean
          dni?: string | null
          domicilio_fiscal_cp?: string | null
          domicilio_fiscal_direccion?: string | null
          domicilio_fiscal_localidad?: string | null
          domicilio_fiscal_pais?: string | null
          domicilio_fiscal_provincia?: string | null
          edad?: number | null
          email?: string | null
          email_2?: string | null
          enlaces?: Json | null
          estudios?: Json | null
          facebook_url?: string | null
          fecha_baja_comunicaciones?: string | null
          fecha_consentimiento?: string | null
          fecha_nacimiento?: string | null
          fotos?: string[]
          fotos_recorte?: Json | null
          genero?: string | null
          habilidad_especial?: string | null
          habilidades?: Json | null
          hace_deporte?: boolean | null
          id?: string
          idiomas?: string | null
          idiomas_detalle?: Json | null
          instagram_url?: string | null
          linkedin_url?: string | null
          lugar_nacimiento?: string | null
          monta_a_caballo?: boolean | null
          nacionalidad?: string | null
          nacionalidad_multiple?: string | null
          nombre?: string
          notas_migracion?: string | null
          numero_seguridad_social?: string | null
          origen_etnia?: string | null
          otras_residencias?: Json | null
          pais_origen?: string | null
          pasaporte?: string | null
          peso_kg?: number | null
          profesion?: string | null
          provincia?: string | null
          ref_legado?: number | null
          representacion?: string | null
          revisado_publico?: boolean
          talla_calzado?: string | null
          talla_camisa?: string | null
          talla_chaqueta?: string | null
          talla_pantalon?: string | null
          telefono?: string | null
          telefono_2?: string | null
          tiene_carnet_conducir?: boolean | null
          tiene_cicatrices?: boolean | null
          tiene_ortodoncia?: boolean | null
          tiene_tatuajes?: boolean | null
          tiene_titulo_patron_barco?: boolean | null
          tiktok_url?: string | null
          tipo_pelo?: string | null
          tipo_perfil?: Json | null
          toca_instrumentos?: boolean | null
          tutor_apellidos?: string | null
          tutor_dni?: string | null
          tutor_nombre?: string | null
          twitch_url?: string | null
          twitter_url?: string | null
          user_id?: string | null
          video_book_url?: string | null
          video_privacy?: string
          video_youtube_id?: string | null
          video_youtube_url?: string | null
          web_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          condiciones: string | null
          contactos: Json
          creado_en: string
          id: string
          plantilla_dossier: Json
          razon_social: string
          sector: string | null
        }
        Insert: {
          condiciones?: string | null
          contactos?: Json
          creado_en?: string
          id?: string
          plantilla_dossier?: Json
          razon_social: string
          sector?: string | null
        }
        Update: {
          condiciones?: string | null
          contactos?: Json
          creado_en?: string
          id?: string
          plantilla_dossier?: Json
          razon_social?: string
          sector?: string | null
        }
        Relationships: []
      }
      comunicaciones: {
        Row: {
          canal: string
          candidato_id: string | null
          cliente_id: string | null
          contenido: string | null
          creado_en: string
          destinatario_tipo: string
          enviado_en: string
          id: string
          origen: string
          proyecto_id: string | null
          tipo: string
        }
        Insert: {
          canal?: string
          candidato_id?: string | null
          cliente_id?: string | null
          contenido?: string | null
          creado_en?: string
          destinatario_tipo?: string
          enviado_en?: string
          id?: string
          origen?: string
          proyecto_id?: string | null
          tipo: string
        }
        Update: {
          canal?: string
          candidato_id?: string | null
          cliente_id?: string | null
          contenido?: string | null
          creado_en?: string
          destinatario_tipo?: string
          enviado_en?: string
          id?: string
          origen?: string
          proyecto_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "comunicaciones_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "candidatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunicaciones_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comunicaciones_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos_casting"
            referencedColumns: ["id"]
          },
        ]
      }
      convocatorias_rrss: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_candidato"]
          creado_en: string
          enlaces_por_canal: Json
          fecha_cierre: string | null
          id: string
          imagen_generada_url: string | null
          nombre: string
          texto_generado: string
        }
        Insert: {
          categoria: Database["public"]["Enums"]["categoria_candidato"]
          creado_en?: string
          enlaces_por_canal?: Json
          fecha_cierre?: string | null
          id?: string
          imagen_generada_url?: string | null
          nombre: string
          texto_generado?: string
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_candidato"]
          creado_en?: string
          enlaces_por_canal?: Json
          fecha_cierre?: string | null
          id?: string
          imagen_generada_url?: string | null
          nombre?: string
          texto_generado?: string
        }
        Relationships: []
      }
      dossiers: {
        Row: {
          candidatos_incluidos: string[]
          creado_en: string
          creado_por: string | null
          fecha_caducidad: string | null
          id: string
          incluye_pdf: boolean
          incluye_word: boolean
          proyecto_id: string
          slug_publico: string | null
        }
        Insert: {
          candidatos_incluidos?: string[]
          creado_en?: string
          creado_por?: string | null
          fecha_caducidad?: string | null
          id?: string
          incluye_pdf?: boolean
          incluye_word?: boolean
          proyecto_id: string
          slug_publico?: string | null
        }
        Update: {
          candidatos_incluidos?: string[]
          creado_en?: string
          creado_por?: string | null
          fecha_caducidad?: string | null
          id?: string
          incluye_pdf?: boolean
          incluye_word?: boolean
          proyecto_id?: string
          slug_publico?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dossiers_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos_casting"
            referencedColumns: ["id"]
          },
        ]
      }
      filtros_guardados: {
        Row: {
          actualizado_en: string
          condiciones: Json
          creado_en: string
          id: string
          nombre: string
          usuario_id: string
        }
        Insert: {
          actualizado_en?: string
          condiciones?: Json
          creado_en?: string
          id?: string
          nombre: string
          usuario_id?: string
        }
        Update: {
          actualizado_en?: string
          condiciones?: Json
          creado_en?: string
          id?: string
          nombre?: string
          usuario_id?: string
        }
        Relationships: []
      }
      plantillas_comunicacion: {
        Row: {
          activo: boolean
          actualizado_en: string
          asunto: string | null
          canal: string
          creado_en: string
          cuerpo: string | null
          evento: string
          id: string
          plantilla_wati: string | null
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string
          asunto?: string | null
          canal: string
          creado_en?: string
          cuerpo?: string | null
          evento: string
          id?: string
          plantilla_wati?: string | null
        }
        Update: {
          activo?: boolean
          actualizado_en?: string
          asunto?: string | null
          canal?: string
          creado_en?: string
          cuerpo?: string | null
          evento?: string
          id?: string
          plantilla_wati?: string | null
        }
        Relationships: []
      }
      programas_tv: {
        Row: {
          activo: boolean
          actualizado_en: string
          creado_en: string
          id: string
          imagen_url: string | null
          link_formulario: string
          nombre: string
          orden: number
        }
        Insert: {
          activo?: boolean
          actualizado_en?: string
          creado_en?: string
          id?: string
          imagen_url?: string | null
          link_formulario: string
          nombre: string
          orden?: number
        }
        Update: {
          activo?: boolean
          actualizado_en?: string
          creado_en?: string
          id?: string
          imagen_url?: string | null
          link_formulario?: string
          nombre?: string
          orden?: number
        }
        Relationships: []
      }
      proyecto_candidatos: {
        Row: {
          candidato_id: string
          creado_en: string
          estado: Database["public"]["Enums"]["estado_proyecto_candidato"]
          origen: Database["public"]["Enums"]["origen_proyecto_candidato"]
          proyecto_id: string
        }
        Insert: {
          candidato_id: string
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_proyecto_candidato"]
          origen?: Database["public"]["Enums"]["origen_proyecto_candidato"]
          proyecto_id: string
        }
        Update: {
          candidato_id?: string
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_proyecto_candidato"]
          origen?: Database["public"]["Enums"]["origen_proyecto_candidato"]
          proyecto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proyecto_candidatos_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "candidatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyecto_candidatos_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos_casting"
            referencedColumns: ["id"]
          },
        ]
      }
      proyectos_casting: {
        Row: {
          brief_publico: Json | null
          campos_personalizados_activados: string[]
          cliente_id: string | null
          creado_en: string
          criterios_busqueda: Json
          estado: Database["public"]["Enums"]["estado_proyecto"]
          id: string
          nombre: string
          publicado: boolean
          slug_publico: string | null
        }
        Insert: {
          brief_publico?: Json | null
          campos_personalizados_activados?: string[]
          cliente_id?: string | null
          creado_en?: string
          criterios_busqueda?: Json
          estado?: Database["public"]["Enums"]["estado_proyecto"]
          id?: string
          nombre: string
          publicado?: boolean
          slug_publico?: string | null
        }
        Update: {
          brief_publico?: Json | null
          campos_personalizados_activados?: string[]
          cliente_id?: string | null
          creado_en?: string
          criterios_busqueda?: Json
          estado?: Database["public"]["Enums"]["estado_proyecto"]
          id?: string
          nombre?: string
          publicado?: boolean
          slug_publico?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proyectos_casting_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      registro_accesos: {
        Row: {
          accion: Database["public"]["Enums"]["accion_registro_acceso"]
          actor_email: string | null
          actor_user_id: string | null
          candidato_id: string | null
          creado_en: string
          detalle: string | null
          id: string
        }
        Insert: {
          accion: Database["public"]["Enums"]["accion_registro_acceso"]
          actor_email?: string | null
          actor_user_id?: string | null
          candidato_id?: string | null
          creado_en?: string
          detalle?: string | null
          id?: string
        }
        Update: {
          accion?: Database["public"]["Enums"]["accion_registro_acceso"]
          actor_email?: string | null
          actor_user_id?: string | null
          candidato_id?: string | null
          creado_en?: string
          detalle?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registro_accesos_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "candidatos"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_captacion: {
        Row: {
          canal: string
          candidato_id: string
          convocatoria_id: string
          fecha: string
          id: string
        }
        Insert: {
          canal: string
          candidato_id: string
          convocatoria_id: string
          fecha?: string
          id?: string
        }
        Update: {
          canal?: string
          candidato_id?: string
          convocatoria_id?: string
          fecha?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registros_captacion_candidato_id_fkey"
            columns: ["candidato_id"]
            isOneToOne: false
            referencedRelation: "candidatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_captacion_convocatoria_id_fkey"
            columns: ["convocatoria_id"]
            isOneToOne: false
            referencedRelation: "convocatorias_rrss"
            referencedColumns: ["id"]
          },
        ]
      }
      solicitudes_proyecto: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_candidato"]
          cliente_id: string
          descripcion: string | null
          estado: Database["public"]["Enums"]["estado_solicitud_proyecto"]
          fecha_necesaria: string | null
          id: string
          nombre_proyecto: string
          num_candidatos_aprox: number | null
          recibida_en: string
        }
        Insert: {
          categoria: Database["public"]["Enums"]["categoria_candidato"]
          cliente_id: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_solicitud_proyecto"]
          fecha_necesaria?: string | null
          id?: string
          nombre_proyecto: string
          num_candidatos_aprox?: number | null
          recibida_en?: string
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_candidato"]
          cliente_id?: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_solicitud_proyecto"]
          fecha_necesaria?: string | null
          id?: string
          nombre_proyecto?: string
          num_candidatos_aprox?: number | null
          recibida_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "solicitudes_proyecto_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          cliente_id: string | null
          creado_en: string
          email: string
          id: string
          rol: Database["public"]["Enums"]["rol_usuario"]
          ultimo_acceso: string | null
          user_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          creado_en?: string
          email: string
          id?: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          ultimo_acceso?: string | null
          user_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          creado_en?: string
          email?: string
          id?: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          ultimo_acceso?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      es_admin: { Args: { _user_id: string }; Returns: boolean }
      es_staff: { Args: { _user_id: string }; Returns: boolean }
      fn_candidatos_publicos: {
        Args: {
          p_categoria?: Database["public"]["Enums"]["categoria_candidato"]
          p_edad_max?: number
          p_edad_min?: number
          p_genero?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          altura_cm: number
          carnes_conducir: Json
          categoria: Database["public"]["Enums"]["categoria_candidato"]
          codigo: string
          color_cabello: string
          color_ojos: string
          complexion: string
          edad: number
          fotos: string[]
          genero: string
          habilidades: Json
          id: string
          idiomas_detalle: Json
          peso_kg: number
          provincia: string
          talla_calzado: string
          talla_camisa: string
          talla_chaqueta: string
          talla_pantalon: string
          tipo_pelo: string
          tipo_perfil: Json
          total_disponibles: number
        }[]
      }
      fn_datos_publicos_candidato: {
        Args: { ids: string[] }
        Returns: {
          altura_cm: number
          anchura_cintura: number
          anchura_pecho: number
          carnes_conducir: Json
          categoria: Database["public"]["Enums"]["categoria_candidato"]
          codigo: string
          complexion: string
          edad: number
          fotos: string[]
          habilidades: Json
          id: string
          idiomas_detalle: Json
          origen_etnia: string
          peso_kg: number
          provincia: string
          talla_calzado: string
          talla_camisa: string
          talla_chaqueta: string
          talla_pantalon: string
          tipo_pelo: string
          tipo_perfil: Json
        }[]
      }
      fn_dossier_publico: {
        Args: { _slug: string }
        Returns: {
          candidatos_incluidos: string[]
          creado_en: string
          fecha_caducidad: string
          id: string
          proyecto_id: string
        }[]
      }
      fn_resolver_enlace_captacion: {
        Args: { _codigo: string }
        Returns: {
          canal: string
          categoria: Database["public"]["Enums"]["categoria_candidato"]
          convocatoria_id: string
        }[]
      }
      mi_cliente_id: { Args: never; Returns: string }
      obtener_rol: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["rol_usuario"]
      }
      tiene_rol: {
        Args: {
          _rol: Database["public"]["Enums"]["rol_usuario"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      accion_registro_acceso:
        | "vio_ficha"
        | "genero_dossier"
        | "exporto_excel"
        | "borro_candidato"
      categoria_candidato: "actor" | "modelo" | "figurante" | "casting_plus"
      estado_acceso_invitado: "activo" | "caducado"
      estado_proyecto: "borrador" | "en_curso" | "cerrado"
      estado_proyecto_candidato:
        | "preseleccionado"
        | "enviado"
        | "contratado"
        | "descartado"
        | "rechazado_por_candidato"
        | "pendiente_validacion"
      estado_solicitud_proyecto: "pendiente" | "revisada" | "convertida"
      origen_proyecto_candidato: "manual" | "web_directa"
      rol_usuario:
        | "superadmin"
        | "admin_figurarte"
        | "coordinador"
        | "validador"
        | "cliente"
      tipo_campo_personalizado: "texto" | "numero"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      accion_registro_acceso: [
        "vio_ficha",
        "genero_dossier",
        "exporto_excel",
        "borro_candidato",
      ],
      categoria_candidato: ["actor", "modelo", "figurante", "casting_plus"],
      estado_acceso_invitado: ["activo", "caducado"],
      estado_proyecto: ["borrador", "en_curso", "cerrado"],
      estado_proyecto_candidato: [
        "preseleccionado",
        "enviado",
        "contratado",
        "descartado",
        "rechazado_por_candidato",
        "pendiente_validacion",
      ],
      estado_solicitud_proyecto: ["pendiente", "revisada", "convertida"],
      origen_proyecto_candidato: ["manual", "web_directa"],
      rol_usuario: [
        "superadmin",
        "admin_figurarte",
        "coordinador",
        "validador",
        "cliente",
      ],
      tipo_campo_personalizado: ["texto", "numero"],
    },
  },
} as const
