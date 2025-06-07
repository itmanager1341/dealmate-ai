
import type { ModelUseCase } from './models';

export type ToolCategory = 
  | 'text_processing'
  | 'data_extraction' 
  | 'validation'
  | 'error_handling'
  | 'format_conversion'
  | 'analysis'
  | 'visualization'
  | 'integration';

export interface Tool {
  id: string;
  name: string;
  description?: string;
  model_use_case: ModelUseCase;
  category: ToolCategory;
  version: number;
  required_kwargs: string[];
  optional_kwargs?: string[];
  cost_estimate: number;
  execution_time_estimate_ms: number;
  reliability_score: number;
  created_at: string;
  is_active: boolean;
}

export interface ToolExecution {
  id: string;
  tool_id: string;
  agent_log_id?: string;
  execution_context: {
    deal_id?: string;
    document_id?: string;
    user_id?: string;
  };
  input_parameters: Record<string, any>;
  output_result?: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  processing_time_ms?: number;
  cost_usd?: number;
  error_message?: string;
  success: boolean;
}

export interface ToolRegistry {
  tools: Tool[];
  categories: Record<ToolCategory, Tool[]>;
  by_use_case: Record<ModelUseCase, Tool[]>;
  recommendations: {
    most_reliable: Tool[];
    fastest: Tool[];
    most_cost_effective: Tool[];
  };
}

export interface ToolUsageStats {
  tool_id: string;
  total_executions: number;
  success_rate: number;
  avg_processing_time_ms: number;
  avg_cost_usd: number;
  reliability_trend: 'improving' | 'stable' | 'declining';
  last_used: string;
  usage_frequency: 'high' | 'medium' | 'low';
}
