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
      candidatos: {
        Row: {
          actualizado_en: string
          altura_cm: number | null
          categoria: Database["public"]["Enums"]["categoria_candidato"]
          ciudad: string | null
          codigo: string
          consentimiento_rgpd: boolean
          creado_en: string
          disponible: boolean
          edad: number | null
          email: string | null
          fecha_consentimiento: string | null
          fotos: string[]
          id: string
          nombre: string
          peso_kg: number | null
          provincia: string | null
          telefono: string | null
          video_privacy: string
          video_youtube_id: string | null
          video_youtube_url: string | null
        }
        Insert: {
          actualizado_en?: string
          altura_cm?: number | null
          categoria: Database["public"]["Enums"]["categoria_candidato"]
          ciudad?: string | null
          codigo?: string
          consentimiento_rgpd?: boolean
          creado_en?: string
          disponible?: boolean
          edad?: number | null
          email?: string | null
          fecha_consentimiento?: string | null
          fotos?: string[]
          id?: string
          nombre: string
          peso_kg?: number | null
          provincia?: string | null
          telefono?: string | null
          video_privacy?: string
          video_youtube_id?: string | null
          video_youtube_url?: string | null
        }
        Update: {
          actualizado_en?: string
          altura_cm?: number | null
          categoria?: Database["public"]["Enums"]["categoria_candidato"]
          ciudad?: string | null
          codigo?: string
          consentimiento_rgpd?: boolean
          creado_en?: string
          disponible?: boolean
          edad?: number | null
          email?: string | null
          fecha_consentimiento?: string | null
          fotos?: string[]
          id?: string
          nombre?: string
          peso_kg?: number | null
          provincia?: string | null
          telefono?: string | null
          video_privacy?: string
          video_youtube_id?: string | null
          video_youtube_url?: string | null
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
          estado?: Database["public"]["Enums"]["estado_proyecto"]
          id?: string
          nombre?: string
          publicado?: boolean
          slug_publico?: string | null
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          cliente_id: string | null
          creado_en: string
          email: string
          id: string
          rol: Database["public"]["Enums"]["rol_usuario"]
          ultimo_acceso: string | null
        }
        Insert: {
          cliente_id?: string | null
          creado_en?: string
          email: string
          id?: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          ultimo_acceso?: string | null
        }
        Update: {
          cliente_id?: string | null
          creado_en?: string
          email?: string
          id?: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          ultimo_acceso?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      categoria_candidato: "actor" | "modelo" | "figurante" | "casting_plus"
      estado_proyecto: "borrador" | "en_curso" | "cerrado"
      estado_proyecto_candidato: "preseleccionado" | "enviado" | "contratado"
      origen_proyecto_candidato: "manual" | "web_directa"
      rol_usuario:
        | "superadmin"
        | "admin_figurarte"
        | "coordinador"
        | "validador"
        | "cliente"
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
      categoria_candidato: ["actor", "modelo", "figurante", "casting_plus"],
      estado_proyecto: ["borrador", "en_curso", "cerrado"],
      estado_proyecto_candidato: ["preseleccionado", "enviado", "contratado"],
      origen_proyecto_candidato: ["manual", "web_directa"],
      rol_usuario: [
        "superadmin",
        "admin_figurarte",
        "coordinador",
        "validador",
        "cliente",
      ],
    },
  },
} as const
