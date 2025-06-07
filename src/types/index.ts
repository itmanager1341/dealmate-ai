
export interface User {
  id: string;
  email: string;
  avatar_url?: string;
  full_name?: string;
}

export interface Deal {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'archived' | 'pending';
  company_name: string;
  industry?: string;
  description?: string;
  created_by: string;
}

export interface Document {
  id: string;
  deal_id: string;
  name: string;
  file_path: string;
  file_type: 'pdf' | 'docx' | 'xlsx' | 'mp3';
  size: number;
  created_at: string;
  uploaded_at: string;
  processed: boolean;
  classified_as?: string;
  // Legacy columns for backward compatibility
  file_name?: string;
  storage_path?: string;
}

export interface DealMetric {
  id: string;
  deal_id: string;
  name: string;
  value: number;
  unit: string;
  year: number;
  source_document_id?: string;
}

export interface Transcript {
  id: string;
  deal_id: string;
  document_id: string;
  content: string;
  timestamp: number;
  speaker?: string;
}

export interface AIOutput {
  id: string;
  deal_id: string;
  content: string;
  type: 'analysis' | 'memo' | 'insight';
  created_at: string;
  prompt?: string;
}

// Re-export chunk types
export * from './chunks';

// Re-export model types
export * from './models';

// Export new agent types
export * from './agents';

// Export new tool types
export * from './tools';
