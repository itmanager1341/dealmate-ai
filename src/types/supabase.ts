
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      deals: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
          status: 'active' | 'archived' | 'pending'
          company_name: string
          industry: string | null
          description: string | null
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
          status?: 'active' | 'archived' | 'pending'
          company_name: string
          industry?: string | null
          description?: string | null
          created_by: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
          status?: 'active' | 'archived' | 'pending'
          company_name?: string
          industry?: string | null
          description?: string | null
          created_by?: string
        }
      }
      documents: {
        Row: {
          id: string
          deal_id: string
          name: string
          file_path: string
          file_type: 'pdf' | 'docx' | 'xlsx' | 'mp3'
          size: number
          created_at: string
          processed: boolean
          classification: string | null
        }
        Insert: {
          id?: string
          deal_id: string
          name: string
          file_path: string
          file_type: 'pdf' | 'docx' | 'xlsx' | 'mp3'
          size: number
          created_at?: string
          processed?: boolean
          classification?: string | null
        }
        Update: {
          id?: string
          deal_id?: string
          name?: string
          file_path?: string
          file_type?: 'pdf' | 'docx' | 'xlsx' | 'mp3'
          size?: number
          created_at?: string
          processed?: boolean
          classification?: string | null
        }
      }
      deal_metrics: {
        Row: {
          id: string
          deal_id: string
          name: string
          value: number
          unit: string
          year: number
          source_document_id: string | null
        }
        Insert: {
          id?: string
          deal_id: string
          name: string
          value: number
          unit: string
          year: number
          source_document_id?: string | null
        }
        Update: {
          id?: string
          deal_id?: string
          name?: string
          value?: number
          unit?: string
          year?: number
          source_document_id?: string | null
        }
      }
      transcripts: {
        Row: {
          id: string
          deal_id: string
          document_id: string
          content: string
          timestamp: number
          speaker: string | null
        }
        Insert: {
          id?: string
          deal_id: string
          document_id: string
          content: string
          timestamp: number
          speaker?: string | null
        }
        Update: {
          id?: string
          deal_id?: string
          document_id?: string
          content?: string
          timestamp?: number
          speaker?: string | null
        }
      }
      ai_outputs: {
        Row: {
          id: string
          deal_id: string
          content: string
          type: 'analysis' | 'memo' | 'insight'
          created_at: string
          prompt: string | null
        }
        Insert: {
          id?: string
          deal_id: string
          content: string
          type: 'analysis' | 'memo' | 'insight'
          created_at?: string
          prompt?: string | null
        }
        Update: {
          id?: string
          deal_id?: string
          content?: string
          type?: 'analysis' | 'memo' | 'insight'
          created_at?: string
          prompt?: string | null
        }
      }
      cim_analysis: {
        Row: {
          id: string
          deal_id: string
          document_id: string | null
          investment_grade: string
          executive_summary: string | null
          business_model: Json | null
          financial_metrics: Json | null
          key_risks: Json | null
          investment_highlights: string[] | null
          management_questions: string[] | null
          competitive_position: Json | null
          recommendation: Json | null
          raw_ai_response: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          deal_id: string
          document_id?: string | null
          investment_grade: string
          executive_summary?: string | null
          business_model?: Json | null
          financial_metrics?: Json | null
          key_risks?: Json | null
          investment_highlights?: string[] | null
          management_questions?: string[] | null
          competitive_position?: Json | null
          recommendation?: Json | null
          raw_ai_response?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          deal_id?: string
          document_id?: string | null
          investment_grade?: string
          executive_summary?: string | null
          business_model?: Json | null
          financial_metrics?: Json | null
          key_risks?: Json | null
          investment_highlights?: string[] | null
          management_questions?: string[] | null
          competitive_position?: Json | null
          recommendation?: Json | null
          raw_ai_response?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      field_metadata: {
        Row: {
          id: string
          field_pattern: string
          display_label: string
          category: string
          icon_name: string | null
          display_format: string | null
          confidence_score: number
          user_annotations: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          field_pattern: string
          display_label: string
          category: string
          icon_name?: string | null
          display_format?: string | null
          confidence_score?: number
          user_annotations?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          field_pattern?: string
          display_label?: string
          category?: string
          icon_name?: string | null
          display_format?: string | null
          confidence_score?: number
          user_annotations?: Json | null
          created_at?: string
          updated_at?: string
        }
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
