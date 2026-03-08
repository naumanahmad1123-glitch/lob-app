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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      fill_a_seat_requests: {
        Row: {
          created_at: string
          id: string
          lob_id: string
          requester_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          lob_id: string
          requester_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          lob_id?: string
          requester_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fill_a_seat_requests_lob_id_fkey"
            columns: ["lob_id"]
            isOneToOne: false
            referencedRelation: "lobs"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          created_by: string | null
          emoji: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          emoji?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          emoji?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      lob_attendance: {
        Row: {
          bailed_at: string | null
          created_at: string
          id: string
          lob_id: string
          outcome: string
          user_id: string
        }
        Insert: {
          bailed_at?: string | null
          created_at?: string
          id?: string
          lob_id: string
          outcome?: string
          user_id: string
        }
        Update: {
          bailed_at?: string | null
          created_at?: string
          id?: string
          lob_id?: string
          outcome?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lob_attendance_lob_id_fkey"
            columns: ["lob_id"]
            isOneToOne: false
            referencedRelation: "lobs"
            referencedColumns: ["id"]
          },
        ]
      }
      lob_comments: {
        Row: {
          created_at: string
          id: string
          lob_id: string
          message: string
          suggested_time: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lob_id: string
          message?: string
          suggested_time?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lob_id?: string
          message?: string
          suggested_time?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lob_comments_lob_id_fkey"
            columns: ["lob_id"]
            isOneToOne: false
            referencedRelation: "lobs"
            referencedColumns: ["id"]
          },
        ]
      }
      lob_guest_invites: {
        Row: {
          created_at: string
          id: string
          invited_by: string
          invited_user_id: string
          lob_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by: string
          invited_user_id: string
          lob_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string
          invited_user_id?: string
          lob_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "lob_guest_invites_lob_id_fkey"
            columns: ["lob_id"]
            isOneToOne: false
            referencedRelation: "lobs"
            referencedColumns: ["id"]
          },
        ]
      }
      lob_responses: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          lob_id: string
          response: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          lob_id: string
          response: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          lob_id?: string
          response?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lob_responses_lob_id_fkey"
            columns: ["lob_id"]
            isOneToOne: false
            referencedRelation: "lobs"
            referencedColumns: ["id"]
          },
        ]
      }
      lob_time_options: {
        Row: {
          created_at: string
          datetime: string
          id: string
          lob_id: string
        }
        Insert: {
          created_at?: string
          datetime: string
          id?: string
          lob_id: string
        }
        Update: {
          created_at?: string
          datetime?: string
          id?: string
          lob_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lob_time_options_lob_id_fkey"
            columns: ["lob_id"]
            isOneToOne: false
            referencedRelation: "lobs"
            referencedColumns: ["id"]
          },
        ]
      }
      lob_time_votes: {
        Row: {
          id: string
          time_option_id: string
          user_id: string
        }
        Insert: {
          id?: string
          time_option_id: string
          user_id: string
        }
        Update: {
          id?: string
          time_option_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lob_time_votes_time_option_id_fkey"
            columns: ["time_option_id"]
            isOneToOne: false
            referencedRelation: "lob_time_options"
            referencedColumns: ["id"]
          },
        ]
      }
      lobs: {
        Row: {
          capacity: number | null
          category: string
          created_at: string
          created_by: string
          deadline: string | null
          description: string | null
          fill_a_seat_active: boolean
          fill_a_seat_spots: number
          flexible_window: string | null
          group_id: string | null
          group_name: string | null
          id: string
          location: string | null
          open_invite_enabled: boolean
          open_invite_max_guests: number
          open_invite_used_guests: number
          quorum: number
          recurrence: string | null
          selected_time: string | null
          status: string
          title: string
          when_mode: string
        }
        Insert: {
          capacity?: number | null
          category?: string
          created_at?: string
          created_by: string
          deadline?: string | null
          description?: string | null
          fill_a_seat_active?: boolean
          fill_a_seat_spots?: number
          flexible_window?: string | null
          group_id?: string | null
          group_name?: string | null
          id?: string
          location?: string | null
          open_invite_enabled?: boolean
          open_invite_max_guests?: number
          open_invite_used_guests?: number
          quorum?: number
          recurrence?: string | null
          selected_time?: string | null
          status?: string
          title: string
          when_mode?: string
        }
        Update: {
          capacity?: number | null
          category?: string
          created_at?: string
          created_by?: string
          deadline?: string | null
          description?: string | null
          fill_a_seat_active?: boolean
          fill_a_seat_spots?: number
          flexible_window?: string | null
          group_id?: string | null
          group_name?: string | null
          id?: string
          location?: string | null
          open_invite_enabled?: boolean
          open_invite_max_guests?: number
          open_invite_used_guests?: number
          quorum?: number
          recurrence?: string | null
          selected_time?: string | null
          status?: string
          title?: string
          when_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "lobs_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string
          city: string | null
          created_at: string
          id: string
          interests: string[]
          is_pro: boolean
          name: string
        }
        Insert: {
          avatar?: string
          city?: string | null
          created_at?: string
          id: string
          interests?: string[]
          is_pro?: boolean
          name?: string
        }
        Update: {
          avatar?: string
          city?: string | null
          created_at?: string
          id?: string
          interests?: string[]
          is_pro?: boolean
          name?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          city: string
          country: string
          created_at: string
          emoji: string
          end_date: string
          id: string
          notify_user_ids: string[]
          show_on_profile: boolean
          start_date: string
          user_id: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          emoji?: string
          end_date: string
          id?: string
          notify_user_ids?: string[]
          show_on_profile?: boolean
          start_date: string
          user_id: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          emoji?: string
          end_date?: string
          id?: string
          notify_user_ids?: string[]
          show_on_profile?: boolean
          start_date?: string
          user_id?: string
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
