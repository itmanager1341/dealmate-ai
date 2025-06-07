
import type { ModelUseCase } from './models';

export type AgentType = 
  | 'financial_agent'
  | 'risk_agent' 
  | 'memo_agent'
  | 'consistency_agent'
  | 'quote_agent'
  | 'chart_agent'
  | 'table_agent'
  | 'image_agent'
  | 'validation_agent';

export type AgentStatus = 
  | 'pending'
  | 'initializing'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'retrying'
  | 'cancelled';

export interface AgentLog {
  id: string;
  deal_id?: string;
  document_id?: string;
  user_id?: string;
  agent_name: string;
  agent_type: AgentType;
  status: AgentStatus;
  input_payload?: Record<string, any>;
  output_payload?: Record<string, any>;
  error_message?: string;
  created_at: string;
}

export interface AgentExecution {
  id: string;
  agent_type: AgentType;
  execution_id: string;
  started_at: string;
  completed_at?: string;
  status: AgentStatus;
  input_data: Record<string, any>;
  output_data?: Record<string, any>;
  error_details?: AgentError;
  performance_metrics: {
    processing_time_ms: number;
    memory_usage_mb?: number;
    tokens_used?: number;
    cost_usd?: number;
  };
  model_usage?: {
    model_id: string;
    input_tokens: number;
    output_tokens: number;
    cost: number;
  };
}

export interface AgentError {
  error_type: 'model_error' | 'validation_error' | 'processing_error' | 'timeout_error' | 'quota_error';
  error_code: string;
  error_message: string;
  stack_trace?: string;
  recovery_attempted: boolean;
  recovery_strategy?: RecoveryStrategy;
  retry_count: number;
  max_retries: number;
}

export type RecoveryStrategy = 
  | 'retry_same_model'
  | 'fallback_model'
  | 'reduce_input_size'
  | 'skip_agent'
  | 'manual_intervention';

export interface AgentOrchestrationConfig {
  pipeline_id: string;
  agent_sequence: AgentType[];
  parallel_agents?: AgentType[][];
  dependencies: AgentDependency[];
  timeout_ms: number;
  retry_policy: {
    max_retries: number;
    backoff_strategy: 'exponential' | 'linear' | 'fixed';
    base_delay_ms: number;
  };
  failure_handling: {
    continue_on_failure: boolean;
    required_agents: AgentType[];
    optional_agents: AgentType[];
  };
}

export interface AgentDependency {
  agent: AgentType;
  depends_on: AgentType[];
  dependency_type: 'hard' | 'soft';
  timeout_ms?: number;
}

export interface ProcessingPipeline {
  id: string;
  deal_id: string;
  document_id?: string;
  config: AgentOrchestrationConfig;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  agent_executions: AgentExecution[];
  started_at: string;
  completed_at?: string;
  total_cost_usd: number;
  total_processing_time_ms: number;
  success_rate: number;
}

export interface AgentHealthStatus {
  agent_type: AgentType;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  last_execution: string;
  success_rate_24h: number;
  avg_processing_time_24h: number;
  error_count_24h: number;
  current_queue_size: number;
  estimated_wait_time_ms: number;
}

export interface LiveModelMetrics {
  model_id: string;
  current_usage: {
    requests_per_minute: number;
    tokens_per_minute: number;
    cost_per_minute: number;
    queue_size: number;
  };
  performance: {
    avg_response_time_ms: number;
    success_rate_current_hour: number;
    error_rate_current_hour: number;
  };
  quotas: {
    requests_remaining?: number;
    tokens_remaining?: number;
    reset_time?: string;
  };
}

export interface ProcessingQueueStatus {
  total_jobs: number;
  pending_jobs: number;
  running_jobs: number;
  completed_jobs_24h: number;
  failed_jobs_24h: number;
  avg_wait_time_ms: number;
  estimated_completion_time?: string;
  queue_health: 'healthy' | 'busy' | 'overloaded' | 'stalled';
}
