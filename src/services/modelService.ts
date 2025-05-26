
import { supabase } from '@/lib/supabase';
import type { AIModel, ModelConfiguration, ModelUsageLog, ModelUsageStats, ModelUseCase } from '@/types/models';

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
