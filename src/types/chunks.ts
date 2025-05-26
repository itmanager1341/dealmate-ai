
export interface DocumentChunk {
  id: string;
  document_id: string;
  deal_id: string;
  chunk_text: string;
  chunk_index: number;
  chunk_size: number;
  start_page?: number;
  end_page?: number;
  section_type?: string;
  section_title?: string;
  metadata: any;
  processed_by_ai: boolean;
  ai_output?: any;
  confidence_score?: number;
  created_at: string;
  updated_at: string;
}

export interface ChunkRelationship {
  id: string;
  parent_chunk_id: string;
  child_chunk_id: string;
  relationship_type: 'sequential' | 'hierarchical' | 'semantic';
  strength: number;
  created_at: string;
}

export interface ExcelToChunkLink {
  id: string;
  xlsx_chunk_id: string;
  document_chunk_id: string;
  relationship_type: 'financial_reference' | 'metric_mention' | 'calculation_source';
  confidence: number;
  created_at: string;
}

export interface ExcelChunk {
  id: string;
  document_id: string;
  sheet_name: string;
  chunk_label: string;
  data: any;
  verified_by_user: boolean;
  created_at: string;
}
