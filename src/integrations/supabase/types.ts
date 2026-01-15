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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chord_submissions: {
        Row: {
          created_at: string
          detected_key: string | null
          detected_mode: string | null
          id: string
          moderated_by: string | null
          progression_roman: string[] | null
          status: string
          track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          detected_key?: string | null
          detected_mode?: string | null
          id?: string
          moderated_by?: string | null
          progression_roman?: string[] | null
          status?: string
          track_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          detected_key?: string | null
          detected_mode?: string | null
          id?: string
          moderated_by?: string | null
          progression_roman?: string[] | null
          status?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chord_submissions_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_items: {
        Row: {
          created_at: string
          id: string
          rank: number
          source: string
          track_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rank?: number
          source?: string
          track_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rank?: number
          source?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_items_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          preferred_provider: string | null
          twofa_backup_codes: string[] | null
          twofa_enabled: boolean | null
          twofa_secret: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          preferred_provider?: string | null
          twofa_backup_codes?: string[] | null
          twofa_enabled?: boolean | null
          twofa_secret?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          preferred_provider?: string | null
          twofa_backup_codes?: string[] | null
          twofa_enabled?: boolean | null
          twofa_secret?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      search_cache: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          market: string | null
          query: string
          results: Json
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          market?: string | null
          query: string
          results: Json
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          market?: string | null
          query?: string
          results?: Json
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      tracks: {
        Row: {
          album: string | null
          analysis_source: string | null
          artist: string
          cadence_type: string | null
          confidence_score: number | null
          cover_url: string | null
          created_at: string
          danceability: number | null
          detected_key: string | null
          detected_mode: string | null
          duration_ms: number | null
          energy: number | null
          external_id: string
          id: string
          isrc: string | null
          loop_length_bars: number | null
          preview_url: string | null
          progression_raw: string[] | null
          progression_roman: string[] | null
          provider: string
          spotify_id: string | null
          title: string
          updated_at: string
          url_spotify_app: string | null
          url_spotify_web: string | null
          url_youtube: string | null
          valence: number | null
          youtube_id: string | null
        }
        Insert: {
          album?: string | null
          analysis_source?: string | null
          artist: string
          cadence_type?: string | null
          confidence_score?: number | null
          cover_url?: string | null
          created_at?: string
          danceability?: number | null
          detected_key?: string | null
          detected_mode?: string | null
          duration_ms?: number | null
          energy?: number | null
          external_id: string
          id?: string
          isrc?: string | null
          loop_length_bars?: number | null
          preview_url?: string | null
          progression_raw?: string[] | null
          progression_roman?: string[] | null
          provider: string
          spotify_id?: string | null
          title: string
          updated_at?: string
          url_spotify_app?: string | null
          url_spotify_web?: string | null
          url_youtube?: string | null
          valence?: number | null
          youtube_id?: string | null
        }
        Update: {
          album?: string | null
          analysis_source?: string | null
          artist?: string
          cadence_type?: string | null
          confidence_score?: number | null
          cover_url?: string | null
          created_at?: string
          danceability?: number | null
          detected_key?: string | null
          detected_mode?: string | null
          duration_ms?: number | null
          energy?: number | null
          external_id?: string
          id?: string
          isrc?: string | null
          loop_length_bars?: number | null
          preview_url?: string | null
          progression_raw?: string[] | null
          progression_roman?: string[] | null
          provider?: string
          spotify_id?: string | null
          title?: string
          updated_at?: string
          url_spotify_app?: string | null
          url_spotify_web?: string | null
          url_youtube?: string | null
          valence?: number | null
          youtube_id?: string | null
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          credits_used: number
          id: string
          last_reset: string
          monthly_allowance: number
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_used?: number
          id?: string
          last_reset?: string
          monthly_allowance?: number
          user_id: string
        }
        Update: {
          created_at?: string
          credits_used?: number
          id?: string
          last_reset?: string
          monthly_allowance?: number
          user_id?: string
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          created_at: string
          id: string
          interaction_type: string
          track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_type: string
          track_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_type?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interactions_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_provider_preferences: {
        Row: {
          created_at: string
          id: string
          is_default: boolean | null
          provider: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          provider: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          provider?: string
          user_id?: string
        }
        Relationships: []
      }
      user_providers: {
        Row: {
          access_token: string | null
          connected_at: string
          expires_at: string | null
          id: string
          provider: string
          provider_user_id: string | null
          refresh_token: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          connected_at?: string
          expires_at?: string | null
          id?: string
          provider: string
          provider_user_id?: string | null
          refresh_token?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          connected_at?: string
          expires_at?: string | null
          id?: string
          provider?: string
          provider_user_id?: string | null
          refresh_token?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "admin" | "moderator"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["user", "admin", "moderator"],
    },
  },
} as const
