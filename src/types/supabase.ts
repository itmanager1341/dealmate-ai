
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
