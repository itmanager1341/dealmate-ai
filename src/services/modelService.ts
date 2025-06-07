import { supabase } from '@/lib/supabase';
import type { 
  AIModel, 
  ModelConfiguration, 
  ModelUsageLog, 
  ModelUsageStats, 
  ModelUseCase,
  ModelPerformanceMetrics,
  ModelOptimizationStrategy 
} from '@/types/models';
import type { AgentLog, AgentType } from '@/types/agents';

export class ModelService {
  // Get all available models
  static async getAvailableModels(): Promise<AIModel[]> {
    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .eq('is_active', true)
      .order('use_case', { ascending: true })
      .order('is_default', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get models for a specific use case
  static async getModelsForUseCase(useCase: ModelUseCase): Promise<AIModel[]> {
    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .eq('use_case', useCase)
      .eq('is_active', true)
      .order('is_default', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get effective model configuration for a user/deal/use case
  static async getEffectiveModelConfig(
    userId: string,
    dealId?: string,
    useCase?: ModelUseCase
  ): Promise<string | null> {
    const { data, error } = await supabase
      .rpc('get_effective_model_config', {
        p_user_id: userId,
        p_deal_id: dealId || null,
        p_use_case: useCase
      });

    if (error) throw error;
    return data;
  }

  // Save model configuration
  static async saveModelConfiguration(config: Omit<ModelConfiguration, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    const { error } = await supabase
      .from('model_configurations')
      .upsert({
        ...config,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,deal_id,use_case'
      });

    if (error) throw error;
  }

  // Get user's model configurations
  static async getUserModelConfigurations(userId: string, dealId?: string): Promise<ModelConfiguration[]> {
    let query = supabase
      .from('model_configurations')
      .select('*')
      .eq('user_id', userId);

    if (dealId) {
      query = query.eq('deal_id', dealId);
    } else {
      query = query.is('deal_id', null);
    }

    const { data, error } = await query.order('use_case');

    if (error) throw error;
    return data || [];
  }

  // Log model usage
  static async logModelUsage(
    modelId: string,
    useCase: ModelUseCase,
    inputTokens: number,
    outputTokens: number,
    processingTimeMs: number,
    success: boolean,
    dealId?: string,
    documentId?: string,
    agentLogId?: string,
    errorMessage?: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get model to calculate cost
    const { data: model } = await supabase
      .from('ai_models')
      .select('cost_per_input_token, cost_per_output_token')
      .eq('id', modelId)
      .single();

    const costUsd = model ? 
      (inputTokens * model.cost_per_input_token / 1000) + 
      (outputTokens * model.cost_per_output_token / 1000) : 0;

    const { error } = await supabase
      .from('model_usage_logs')
      .insert({
        deal_id: dealId,
        document_id: documentId,
        agent_log_id: agentLogId,
        model_id: modelId,
        use_case: useCase,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: inputTokens + outputTokens,
        cost_usd: costUsd,
        processing_time_ms: processingTimeMs,
        success,
        error_message: errorMessage,
        user_id: user.id
      });

    if (error) throw error;
  }

  // Enhanced method for agent-specific model usage logging
  static async logAgentModelUsage(
    agentLogId: string,
    modelId: string,
    useCase: ModelUseCase,
    inputTokens: number,
    outputTokens: number,
    processingTimeMs: number,
    success: boolean,
    dealId?: string,
    documentId?: string,
    errorMessage?: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get model to calculate cost
    const { data: model } = await supabase
      .from('ai_models')
      .select('cost_per_input_token, cost_per_output_token')
      .eq('id', modelId)
      .single();

    const costUsd = model ? 
      (inputTokens * model.cost_per_input_token / 1000) + 
      (outputTokens * model.cost_per_output_token / 1000) : 0;

    const { error } = await supabase
      .from('model_usage_logs')
      .insert({
        deal_id: dealId,
        document_id: documentId,
        agent_log_id: agentLogId,
        model_id: modelId,
        use_case: useCase,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: inputTokens + outputTokens,
        cost_usd: costUsd,
        processing_time_ms: processingTimeMs,
        success,
        error_message: errorMessage,
        user_id: user.id
      });

    if (error) throw error;
  }

  // Get agent logs with model usage information
  static async getAgentLogsWithModelUsage(
    dealId?: string,
    agentType?: AgentType,
    startDate?: Date,
    endDate?: Date
  ): Promise<(AgentLog & { model_usage?: ModelUsageLog[] })[]> {
    let query = supabase
      .from('agent_logs')
      .select(`
        *,
        model_usage_logs(*)
      `);

    if (dealId) query = query.eq('deal_id', dealId);
    if (agentType) query = query.eq('agent_type', agentType);
    if (startDate) query = query.gte('created_at', startDate.toISOString());
    if (endDate) query = query.lte('created_at', endDate.toISOString());

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    return data || [];
  }

  // Get model performance metrics
  static async getModelPerformanceMetrics(
    modelId?: string,
    useCase?: ModelUseCase,
    days = 30
  ): Promise<ModelPerformanceMetrics[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from('model_usage_logs')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (modelId) query = query.eq('model_id', modelId);
    if (useCase) query = query.eq('use_case', useCase);

    const { data, error } = await query;
    if (error) throw error;

    // Process the data to calculate metrics
    const logs = data || [];
    const groupedByModel = logs.reduce((acc, log) => {
      const key = `${log.model_id}-${log.use_case}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(log);
      return acc;
    }, {} as Record<string, ModelUsageLog[]>);

    return Object.entries(groupedByModel).map(([key, logs]) => {
      const [model_id, use_case] = key.split('-');
      const successfulLogs = logs.filter(log => log.success);
      
      return {
        model_id,
        use_case: use_case as ModelUseCase,
        success_rate: logs.length > 0 ? successfulLogs.length / logs.length : 0,
        avg_processing_time_ms: logs.length > 0 ? 
          logs.reduce((sum, log) => sum + log.processing_time_ms, 0) / logs.length : 0,
        avg_cost_per_request: logs.length > 0 ? 
          logs.reduce((sum, log) => sum + log.cost_usd, 0) / logs.length : 0,
        total_requests: logs.length,
        error_rate: logs.length > 0 ? (logs.length - successfulLogs.length) / logs.length : 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });
  }

  // Get optimized model recommendation based on strategy
  static async getOptimizedModelRecommendation(
    useCase: ModelUseCase,
    strategy: ModelOptimizationStrategy,
    dealId?: string
  ): Promise<AIModel | null> {
    const models = await this.getModelsForUseCase(useCase);
    const metrics = await this.getModelPerformanceMetrics(undefined, useCase);
    
    if (models.length === 0) return null;

    // Score models based on strategy weights
    const scoredModels = models.map(model => {
      const modelMetrics = metrics.find(m => m.model_id === model.id);
      
      const costScore = strategy.cost_weight * (1 - (model.cost_per_input_token + model.cost_per_output_token) / 2);
      const performanceScore = strategy.performance_weight * (modelMetrics?.avg_processing_time_ms ? 
        1 / modelMetrics.avg_processing_time_ms * 1000 : model.speed_score / 10);
      const qualityScore = strategy.quality_weight * (modelMetrics?.success_rate || model.performance_score / 10);
      
      const totalScore = costScore + performanceScore + qualityScore;
      
      return { model, score: totalScore, metrics: modelMetrics };
    });

    // Filter based on constraints
    const filteredModels = scoredModels.filter(({ model, metrics }) => {
      if (strategy.max_cost_per_request && metrics?.avg_cost_per_request > strategy.max_cost_per_request) return false;
      if (strategy.min_quality_threshold && metrics?.success_rate && metrics.success_rate < strategy.min_quality_threshold) return false;
      if (strategy.preferred_providers && !strategy.preferred_providers.includes(model.provider)) return false;
      return true;
    });

    if (filteredModels.length === 0) return null;

    // Return the highest scoring model
    const bestModel = filteredModels.sort((a, b) => b.score - a.score)[0];
    return bestModel.model;
  }

  // Get usage statistics
  static async getUsageStats(
    userId?: string,
    dealId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ModelUsageStats> {
    let query = supabase
      .from('model_usage_logs')
      .select(`
        *,
        ai_models!inner(name, model_id)
      `);

    if (userId) query = query.eq('user_id', userId);
    if (dealId) query = query.eq('deal_id', dealId);
    if (startDate) query = query.gte('created_at', startDate.toISOString());
    if (endDate) query = query.lte('created_at', endDate.toISOString());

    const { data, error } = await query;
    if (error) throw error;

    const logs = data || [];
    
    const stats: ModelUsageStats = {
      total_requests: logs.length,
      total_tokens: logs.reduce((sum, log) => sum + log.total_tokens, 0),
      total_cost: logs.reduce((sum, log) => sum + log.cost_usd, 0),
      avg_processing_time: logs.length > 0 ? 
        logs.reduce((sum, log) => sum + log.processing_time_ms, 0) / logs.length : 0,
      success_rate: logs.length > 0 ? 
        logs.filter(log => log.success).length / logs.length : 1,
      cost_by_model: {},
      usage_by_case: {} as Record<ModelUseCase, number>
    };

    // Calculate cost by model
    logs.forEach(log => {
      const modelName = (log as any).ai_models?.name || 'Unknown';
      stats.cost_by_model[modelName] = (stats.cost_by_model[modelName] || 0) + log.cost_usd;
    });

    // Calculate usage by case
    logs.forEach(log => {
      stats.usage_by_case[log.use_case] = (stats.usage_by_case[log.use_case] || 0) + 1;
    });

    return stats;
  }
}
