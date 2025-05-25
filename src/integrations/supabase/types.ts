export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agent_logs: {
        Row: {
          agent_name: string | null
          created_at: string | null
          error_message: string | null
          id: string
          input_payload: Json | null
          output_payload: Json | null
          status: string | null
        }
        Insert: {
          agent_name?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_payload?: Json | null
          output_payload?: Json | null
          status?: string | null
        }
        Update: {
          agent_name?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_payload?: Json | null
          output_payload?: Json | null
          status?: string | null
        }
        Relationships: []
      }
      ai_outputs: {
        Row: {
          agent_type: string | null
          chunk_id: string | null
          created_at: string | null
          created_by: string | null
          deal_id: string | null
          document_id: string | null
          id: string
          output_json: Json | null
          output_text: string | null
          output_type: string | null
        }
        Insert: {
          agent_type?: string | null
          chunk_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          document_id?: string | null
          id?: string
          output_json?: Json | null
          output_text?: string | null
          output_type?: string | null
        }
        Update: {
          agent_type?: string | null
          chunk_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          document_id?: string | null
          id?: string
          output_json?: Json | null
          output_text?: string | null
          output_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_outputs_chunk_id_fkey"
            columns: ["chunk_id"]
            isOneToOne: false
            referencedRelation: "xlsx_chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_outputs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_outputs_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_outputs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      cim_analysis: {
        Row: {
          business_model: Json | null
          competitive_position: Json | null
          created_at: string
          deal_id: string
          document_id: string | null
          executive_summary: string | null
          financial_metrics: Json | null
          id: string
          investment_grade: string
          investment_highlights: string[] | null
          key_risks: Json | null
          management_questions: string[] | null
          raw_ai_response: Json | null
          recommendation: Json | null
          updated_at: string
        }
        Insert: {
          business_model?: Json | null
          competitive_position?: Json | null
          created_at?: string
          deal_id: string
          document_id?: string | null
          executive_summary?: string | null
          financial_metrics?: Json | null
          id?: string
          investment_grade: string
          investment_highlights?: string[] | null
          key_risks?: Json | null
          management_questions?: string[] | null
          raw_ai_response?: Json | null
          recommendation?: Json | null
          updated_at?: string
        }
        Update: {
          business_model?: Json | null
          competitive_position?: Json | null
          created_at?: string
          deal_id?: string
          document_id?: string | null
          executive_summary?: string | null
          financial_metrics?: Json | null
          id?: string
          investment_grade?: string
          investment_highlights?: string[] | null
          key_risks?: Json | null
          management_questions?: string[] | null
          raw_ai_response?: Json | null
          recommendation?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_cim_analysis_deal_id"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cim_analysis_document_id"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      comparisons: {
        Row: {
          comparison_json: Json | null
          created_at: string | null
          deal_ids: string[] | null
          id: string
          name: string | null
          user_id: string | null
        }
        Insert: {
          comparison_json?: Json | null
          created_at?: string | null
          deal_ids?: string[] | null
          id?: string
          name?: string | null
          user_id?: string | null
        }
        Update: {
          comparison_json?: Json | null
          created_at?: string | null
          deal_ids?: string[] | null
          id?: string
          name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comparisons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_metrics: {
        Row: {
          created_at: string | null
          deal_id: string | null
          id: string
          metric_name: string | null
          metric_unit: string | null
          metric_value: number | null
          pinned: boolean | null
          source_chunk_id: string | null
        }
        Insert: {
          created_at?: string | null
          deal_id?: string | null
          id?: string
          metric_name?: string | null
          metric_unit?: string | null
          metric_value?: number | null
          pinned?: boolean | null
          source_chunk_id?: string | null
        }
        Update: {
          created_at?: string | null
          deal_id?: string | null
          id?: string
          metric_name?: string | null
          metric_unit?: string | null
          metric_value?: number | null
          pinned?: boolean | null
          source_chunk_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_metrics_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_metrics_source_chunk_id_fkey"
            columns: ["source_chunk_id"]
            isOneToOne: false
            referencedRelation: "xlsx_chunks"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          company_name: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          industry: string | null
          name: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          name: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          name?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          classified_as: string | null
          deal_id: string | null
          file_name: string | null
          file_path: string | null
          file_type: string | null
          id: string
          is_audio: boolean | null
          name: string | null
          processed: boolean | null
          size: number | null
          storage_path: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          classified_as?: string | null
          deal_id?: string | null
          file_name?: string | null
          file_path?: string | null
          file_type?: string | null
          id?: string
          is_audio?: boolean | null
          name?: string | null
          processed?: boolean | null
          size?: number | null
          storage_path?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          classified_as?: string | null
          deal_id?: string | null
          file_name?: string | null
          file_path?: string | null
          file_type?: string | null
          id?: string
          is_audio?: boolean | null
          name?: string | null
          processed?: boolean | null
          size?: number | null
          storage_path?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transcripts: {
        Row: {
          content: string | null
          created_at: string | null
          document_id: string | null
          id: string
          timestamps: Json | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          timestamps?: Json | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          timestamps?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      xlsx_chunks: {
        Row: {
          chunk_label: string | null
          created_at: string | null
          data: Json | null
          document_id: string | null
          id: string
          sheet_name: string | null
          verified_by_user: boolean | null
        }
        Insert: {
          chunk_label?: string | null
          created_at?: string | null
          data?: Json | null
          document_id?: string | null
          id?: string
          sheet_name?: string | null
          verified_by_user?: boolean | null
        }
        Update: {
          chunk_label?: string | null
          created_at?: string | null
          data?: Json | null
          document_id?: string | null
          id?: string
          sheet_name?: string | null
          verified_by_user?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "xlsx_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
