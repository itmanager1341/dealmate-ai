
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'local';

export type ModelUseCase = 
  | 'cim_analysis' 
  | 'document_processing' 
  | 'excel_analysis' 
  | 'audio_transcription' 
  | 'memo_generation' 
  | 'general_analysis';

export interface ModelRecommendation {
  level: 'recommended' | 'acceptable' | 'not_recommended';
  reason: string;
  costEfficiency: 'high' | 'medium' | 'low';
  qualityRating: number; // 1-10
}

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  model_id: string;
  use_case: ModelUseCase;
  cost_per_input_token: number;
  cost_per_output_token: number;
  max_tokens: number;
  context_window: number;
  supports_vision: boolean;
  supports_function_calling: boolean;
  is_active: boolean;
  is_default: boolean;
  performance_score: number;
  speed_score: number;
  created_at: string;
  updated_at: string;
  // Enhanced fields from backend
  compatible_use_cases?: string[];
  description?: string;
  tokens_per_second?: number;
  best_for?: string[];
  limitations?: string[];
  recommendation?: ModelRecommendation;
}

export interface ModelUsageLog {
  id: string;
  deal_id?: string;
  document_id?: string;
  agent_log_id?: string;
  model_id: string;
  use_case: ModelUseCase;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_usd: number;
  processing_time_ms: number;
  success: boolean;
  error_message?: string;
  user_id?: string;
  created_at: string;
}

export interface ModelConfiguration {
  id: string;
  user_id?: string;
  deal_id?: string;
  use_case: ModelUseCase;
  model_id: string;
  is_testing_mode: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModelUsageStats {
  total_requests: number;
  total_tokens: number;
  total_cost: number;
  avg_processing_time: number;
  success_rate: number;
  cost_by_model: Record<string, number>;
  usage_by_case: Record<ModelUseCase, number>;
}

export interface BulkConfigurationUpdate {
  useCase?: ModelUseCase;
  modelId?: string;
  isTestingMode?: boolean;
  applyToAll?: boolean;
}

export type ConfigurationPreset = 'cost-optimized' | 'performance-optimized' | 'balanced' | 'recommended';

// Enhanced Performance Metrics from backend
export interface ModelPerformanceMetrics {
  model_id: string;
  use_case: ModelUseCase;
  success_rate: number;
  avg_processing_time_ms: number;
  avg_cost_per_request: number;
  total_requests: number;
  error_rate: number;
  quality_score?: number;
  user_satisfaction?: number;
  created_at: string;
  updated_at: string;
}

export interface ModelOptimizationStrategy {
  strategy_name: string;
  cost_weight: number;
  performance_weight: number;
  quality_weight: number;
  max_cost_per_request?: number;
  min_quality_threshold?: number;
  preferred_providers?: AIProvider[];
}

export interface CostBudgetConstraints {
  daily_budget?: number;
  monthly_budget?: number;
  cost_per_request_limit?: number;
  emergency_fallback_model?: string;
  budget_alert_threshold?: number;
}
