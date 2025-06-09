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
          agent_type: string | null
          created_at: string | null
          deal_id: string | null
          document_id: string | null
          error_message: string | null
          id: string
          input_payload: Json | null
          log_type: string | null
          output_payload: Json | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          agent_name?: string | null
          agent_type?: string | null
          created_at?: string | null
          deal_id?: string | null
          document_id?: string | null
          error_message?: string | null
          id?: string
          input_payload?: Json | null
          log_type?: string | null
          output_payload?: Json | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          agent_name?: string | null
          agent_type?: string | null
          created_at?: string | null
          deal_id?: string | null
          document_id?: string | null
          error_message?: string | null
          id?: string
          input_payload?: Json | null
          log_type?: string | null
          output_payload?: Json | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_logs_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_models: {
        Row: {
          compatible_use_cases: string[] | null
          context_window: number | null
          cost_per_input_token: number
          cost_per_output_token: number
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          max_tokens: number | null
          model_id: string
          name: string
          performance_score: number | null
          provider: Database["public"]["Enums"]["ai_provider"]
          speed_score: number | null
          supports_function_calling: boolean | null
          supports_vision: boolean | null
          updated_at: string | null
          use_case: Database["public"]["Enums"]["model_use_case"]
        }
        Insert: {
          compatible_use_cases?: string[] | null
          context_window?: number | null
          cost_per_input_token?: number
          cost_per_output_token?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          max_tokens?: number | null
          model_id: string
          name: string
          performance_score?: number | null
          provider: Database["public"]["Enums"]["ai_provider"]
          speed_score?: number | null
          supports_function_calling?: boolean | null
          supports_vision?: boolean | null
          updated_at?: string | null
          use_case: Database["public"]["Enums"]["model_use_case"]
        }
        Update: {
          compatible_use_cases?: string[] | null
          context_window?: number | null
          cost_per_input_token?: number
          cost_per_output_token?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          max_tokens?: number | null
          model_id?: string
          name?: string
          performance_score?: number | null
          provider?: Database["public"]["Enums"]["ai_provider"]
          speed_score?: number | null
          supports_function_calling?: boolean | null
          supports_vision?: boolean | null
          updated_at?: string | null
          use_case?: Database["public"]["Enums"]["model_use_case"]
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
      chart_elements: {
        Row: {
          chart_type: string
          confidence_score: number
          created_at: string
          data_points: Json | null
          deal_id: string
          description: string | null
          document_id: string
          id: string
          metadata: Json | null
          source_page: number | null
          title: string
          updated_at: string
        }
        Insert: {
          chart_type: string
          confidence_score: number
          created_at?: string
          data_points?: Json | null
          deal_id: string
          description?: string | null
          document_id: string
          id?: string
          metadata?: Json | null
          source_page?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          chart_type?: string
          confidence_score?: number
          created_at?: string
          data_points?: Json | null
          deal_id?: string
          description?: string | null
          document_id?: string
          id?: string
          metadata?: Json | null
          source_page?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_elements_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_elements_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_relationships: {
        Row: {
          chart_id: string
          confidence_score: number
          created_at: string
          id: string
          related_text: string
          relationship_type: string
          updated_at: string
        }
        Insert: {
          chart_id: string
          confidence_score: number
          created_at?: string
          id?: string
          related_text: string
          relationship_type: string
          updated_at?: string
        }
        Update: {
          chart_id?: string
          confidence_score?: number
          created_at?: string
          id?: string
          related_text?: string
          relationship_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_relationships_chart_id_fkey"
            columns: ["chart_id"]
            isOneToOne: false
            referencedRelation: "chart_elements"
            referencedColumns: ["id"]
          },
        ]
      }
      chunk_relationships: {
        Row: {
          child_chunk_id: string
          created_at: string
          id: string
          parent_chunk_id: string
          relationship_type: string
          strength: number | null
        }
        Insert: {
          child_chunk_id: string
          created_at?: string
          id?: string
          parent_chunk_id: string
          relationship_type: string
          strength?: number | null
        }
        Update: {
          child_chunk_id?: string
          created_at?: string
          id?: string
          parent_chunk_id?: string
          relationship_type?: string
          strength?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chunk_relationships_child_chunk_id_fkey"
            columns: ["child_chunk_id"]
            isOneToOne: false
            referencedRelation: "document_chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chunk_relationships_parent_chunk_id_fkey"
            columns: ["parent_chunk_id"]
            isOneToOne: false
            referencedRelation: "document_chunks"
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
            foreignKeyName: "cim_analysis_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
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
      document_chunks: {
        Row: {
          ai_output: Json | null
          chunk_index: number
          chunk_size: number
          chunk_text: string
          confidence_score: number | null
          created_at: string
          deal_id: string
          document_id: string
          end_page: number | null
          id: string
          metadata: Json | null
          processed_by_ai: boolean | null
          section_title: string | null
          section_type: string | null
          start_page: number | null
          updated_at: string
        }
        Insert: {
          ai_output?: Json | null
          chunk_index: number
          chunk_size: number
          chunk_text: string
          confidence_score?: number | null
          created_at?: string
          deal_id: string
          document_id: string
          end_page?: number | null
          id?: string
          metadata?: Json | null
          processed_by_ai?: boolean | null
          section_title?: string | null
          section_type?: string | null
          start_page?: number | null
          updated_at?: string
        }
        Update: {
          ai_output?: Json | null
          chunk_index?: number
          chunk_size?: number
          chunk_text?: string
          confidence_score?: number | null
          created_at?: string
          deal_id?: string
          document_id?: string
          end_page?: number | null
          id?: string
          metadata?: Json | null
          processed_by_ai?: boolean | null
          section_title?: string | null
          section_type?: string | null
          start_page?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_quotes: {
        Row: {
          context: string | null
          created_at: string
          deal_id: string
          document_id: string
          id: string
          metadata: Json | null
          quote_text: string
          quote_type: string
          significance_score: number
          speaker: string | null
          speaker_title: string | null
          updated_at: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          deal_id: string
          document_id: string
          id?: string
          metadata?: Json | null
          quote_text: string
          quote_type: string
          significance_score: number
          speaker?: string | null
          speaker_title?: string | null
          updated_at?: string
        }
        Update: {
          context?: string | null
          created_at?: string
          deal_id?: string
          document_id?: string
          id?: string
          metadata?: Json | null
          quote_text?: string
          quote_type?: string
          significance_score?: number
          speaker?: string | null
          speaker_title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_quotes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_quotes_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
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
      excel_to_chunk_links: {
        Row: {
          confidence: number | null
          created_at: string
          document_chunk_id: string
          id: string
          relationship_type: string
          xlsx_chunk_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          document_chunk_id: string
          id?: string
          relationship_type: string
          xlsx_chunk_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          document_chunk_id?: string
          id?: string
          relationship_type?: string
          xlsx_chunk_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "excel_to_chunk_links_document_chunk_id_fkey"
            columns: ["document_chunk_id"]
            isOneToOne: false
            referencedRelation: "document_chunks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "excel_to_chunk_links_xlsx_chunk_id_fkey"
            columns: ["xlsx_chunk_id"]
            isOneToOne: false
            referencedRelation: "xlsx_chunks"
            referencedColumns: ["id"]
          },
        ]
      }
      field_metadata: {
        Row: {
          category: string
          confidence_score: number
          created_at: string
          display_format: string | null
          display_label: string
          field_pattern: string
          icon_name: string | null
          id: string
          updated_at: string
          user_annotations: Json | null
        }
        Insert: {
          category: string
          confidence_score?: number
          created_at?: string
          display_format?: string | null
          display_label: string
          field_pattern: string
          icon_name?: string | null
          id?: string
          updated_at?: string
          user_annotations?: Json | null
        }
        Update: {
          category?: string
          confidence_score?: number
          created_at?: string
          display_format?: string | null
          display_label?: string
          field_pattern?: string
          icon_name?: string | null
          id?: string
          updated_at?: string
          user_annotations?: Json | null
        }
        Relationships: []
      }
      model_configurations: {
        Row: {
          created_at: string | null
          deal_id: string | null
          id: string
          is_testing_mode: boolean | null
          model_id: string | null
          updated_at: string | null
          use_case: Database["public"]["Enums"]["model_use_case"]
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          deal_id?: string | null
          id?: string
          is_testing_mode?: boolean | null
          model_id?: string | null
          updated_at?: string | null
          use_case: Database["public"]["Enums"]["model_use_case"]
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          deal_id?: string | null
          id?: string
          is_testing_mode?: boolean | null
          model_id?: string | null
          updated_at?: string | null
          use_case?: Database["public"]["Enums"]["model_use_case"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "model_configurations_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
        ]
      }
      model_usage_logs: {
        Row: {
          agent_log_id: string | null
          cost_usd: number | null
          created_at: string | null
          deal_id: string | null
          document_id: string | null
          error_message: string | null
          id: string
          input_tokens: number | null
          model_id: string | null
          output_tokens: number | null
          processing_time_ms: number | null
          success: boolean | null
          total_tokens: number | null
          use_case: Database["public"]["Enums"]["model_use_case"]
          user_id: string | null
        }
        Insert: {
          agent_log_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          deal_id?: string | null
          document_id?: string | null
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          model_id?: string | null
          output_tokens?: number | null
          processing_time_ms?: number | null
          success?: boolean | null
          total_tokens?: number | null
          use_case: Database["public"]["Enums"]["model_use_case"]
          user_id?: string | null
        }
        Update: {
          agent_log_id?: string | null
          cost_usd?: number | null
          created_at?: string | null
          deal_id?: string | null
          document_id?: string | null
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          model_id?: string | null
          output_tokens?: number | null
          processing_time_ms?: number | null
          success?: boolean | null
          total_tokens?: number | null
          use_case?: Database["public"]["Enums"]["model_use_case"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "model_usage_logs_agent_log_id_fkey"
            columns: ["agent_log_id"]
            isOneToOne: false
            referencedRelation: "agent_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_usage_logs_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
        ]
      }
      processing_jobs: {
        Row: {
          agent_results: Json | null
          completed_at: string | null
          created_at: string
          current_step: string | null
          deal_id: string
          document_id: string | null
          error_message: string | null
          id: string
          job_type: string
          progress: number
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_results?: Json | null
          completed_at?: string | null
          created_at?: string
          current_step?: string | null
          deal_id: string
          document_id?: string | null
          error_message?: string | null
          id?: string
          job_type?: string
          progress?: number
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_results?: Json | null
          completed_at?: string | null
          created_at?: string
          current_step?: string | null
          deal_id?: string
          document_id?: string | null
          error_message?: string | null
          id?: string
          job_type?: string
          progress?: number
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "processing_jobs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_relationships: {
        Row: {
          confidence_score: number
          created_at: string
          id: string
          quote_id: string
          related_metric: string
          relationship_type: string
          updated_at: string
        }
        Insert: {
          confidence_score: number
          created_at?: string
          id?: string
          quote_id: string
          related_metric: string
          relationship_type: string
          updated_at?: string
        }
        Update: {
          confidence_score?: number
          created_at?: string
          id?: string
          quote_id?: string
          related_metric?: string
          relationship_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_relationships_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "document_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      tools: {
        Row: {
          cost_estimate: number
          created_at: string
          description: string | null
          id: string
          model_use_case: Database["public"]["Enums"]["model_use_case"]
          name: string
          required_kwargs: string[]
          version: number
        }
        Insert: {
          cost_estimate?: number
          created_at?: string
          description?: string | null
          id?: string
          model_use_case?: Database["public"]["Enums"]["model_use_case"]
          name: string
          required_kwargs?: string[]
          version?: number
        }
        Update: {
          cost_estimate?: number
          created_at?: string
          description?: string | null
          id?: string
          model_use_case?: Database["public"]["Enums"]["model_use_case"]
          name?: string
          required_kwargs?: string[]
          version?: number
        }
        Relationships: []
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
      calculate_usage_cost: {
        Args: {
          input_tokens: number
          output_tokens: number
          cost_per_input_token: number
          cost_per_output_token: number
        }
        Returns: number
      }
      get_effective_model_config: {
        Args: {
          p_user_id: string
          p_deal_id: string
          p_use_case: Database["public"]["Enums"]["model_use_case"]
        }
        Returns: string
      }
    }
    Enums: {
      ai_provider: "openai" | "anthropic" | "google" | "local"
      model_use_case:
        | "cim_analysis"
        | "document_processing"
        | "excel_analysis"
        | "audio_transcription"
        | "memo_generation"
        | "general_analysis"
        | "generic"
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
    Enums: {
      ai_provider: ["openai", "anthropic", "google", "local"],
      model_use_case: [
        "cim_analysis",
        "document_processing",
        "excel_analysis",
        "audio_transcription",
        "memo_generation",
        "general_analysis",
        "generic",
      ],
    },
  },
} as const
