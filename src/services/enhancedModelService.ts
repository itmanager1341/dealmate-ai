
import { supabase } from '@/lib/supabase';
import type { AIModel, ModelConfiguration, ModelUseCase, BulkConfigurationUpdate, ConfigurationPreset, ModelRecommendation } from '@/types/models';

export class EnhancedModelService {
  // Get model recommendations for a specific use case
  static getModelRecommendations(models: AIModel[], useCase: ModelUseCase): AIModel[] {
    const recommendations = {
      cim_analysis: {
        recommended: ['gpt-4o'],
        acceptable: ['gpt-4o-mini', 'gpt-4-turbo'],
        reasons: {
          'gpt-4o': 'Best reasoning and analysis capabilities for complex investment documents',
          'gpt-4o-mini': 'Cost-effective option with good analysis quality',
          'gpt-4-turbo': 'Strong performance but higher cost than 4o'
        }
      },
      document_processing: {
        recommended: ['gpt-4o-mini'],
        acceptable: ['gpt-4o', 'gpt-3.5-turbo'],
        reasons: {
          'gpt-4o-mini': 'Optimal balance of speed, cost, and quality for document processing',
          'gpt-4o': 'Higher quality but unnecessary cost for basic processing',
          'gpt-3.5-turbo': 'Fastest and cheapest but lower quality'
        }
      },
      excel_analysis: {
        recommended: ['gpt-4o'],
        acceptable: ['gpt-4o-mini'],
        reasons: {
          'gpt-4o': 'Superior reasoning for complex financial spreadsheets and calculations',
          'gpt-4o-mini': 'Good for simpler Excel analysis tasks'
        }
      },
      audio_transcription: {
        recommended: ['whisper-1'],
        acceptable: [],
        reasons: {
          'whisper-1': 'Specialized model for audio transcription with best accuracy'
        }
      },
      memo_generation: {
        recommended: ['gpt-4o'],
        acceptable: ['gpt-4o-mini'],
        reasons: {
          'gpt-4o': 'Best writing quality and coherence for professional memos',
          'gpt-4o-mini': 'Good writing quality at lower cost'
        }
      },
      general_analysis: {
        recommended: ['gpt-4o-mini'],
        acceptable: ['gpt-4o', 'gpt-3.5-turbo'],
        reasons: {
          'gpt-4o-mini': 'Balanced performance and cost for general tasks',
          'gpt-4o': 'Higher quality when budget allows',
          'gpt-3.5-turbo': 'Budget option for simple analysis'
        }
      }
    };

    const useCaseRec = recommendations[useCase];
    if (!useCaseRec) return models;

    return models.map(model => {
      let recommendation: ModelRecommendation = { 
        level: 'not_recommended', 
        reason: 'Not recommended for this use case', 
        costEfficiency: 'low', 
        qualityRating: 5 
      };

      if (useCaseRec.recommended.some(name => model.name.includes(name))) {
        recommendation = {
          level: 'recommended',
          reason: useCaseRec.reasons[Object.keys(useCaseRec.reasons).find(key => model.name.includes(key)) || ''] || 'Recommended for this use case',
          costEfficiency: model.cost_per_input_token < 10 ? 'high' : model.cost_per_input_token < 30 ? 'medium' : 'low',
          qualityRating: 8
        };
      } else if (useCaseRec.acceptable.some(name => model.name.includes(name))) {
        recommendation = {
          level: 'acceptable',
          reason: useCaseRec.reasons[Object.keys(useCaseRec.reasons).find(key => model.name.includes(key)) || ''] || 'Acceptable for this use case',
          costEfficiency: model.cost_per_input_token < 10 ? 'high' : model.cost_per_input_token < 30 ? 'medium' : 'low',
          qualityRating: 6
        };
      }

      return { ...model, recommendation };
    }).sort((a, b) => {
      // Sort by recommendation level first, then by cost efficiency
      const levelOrder = { recommended: 0, acceptable: 1, not_recommended: 2 };
      if (levelOrder[a.recommendation!.level] !== levelOrder[b.recommendation!.level]) {
        return levelOrder[a.recommendation!.level] - levelOrder[b.recommendation!.level];
      }
      return a.cost_per_input_token - b.cost_per_input_token;
    });
  }

  // Save configuration with better error handling
  static async saveModelConfiguration(
    userId: string,
    dealId: string | null,
    useCase: ModelUseCase,
    modelId?: string,
    isTestingMode?: boolean
  ): Promise<void> {
    try {
      console.log('Saving model configuration:', { userId, dealId, useCase, modelId, isTestingMode });

      // Get current configuration
      const { data: existing } = await supabase
        .from('model_configurations')
        .select('*')
        .eq('user_id', userId)
        .eq('use_case', useCase)
        .eq('deal_id', dealId)
        .maybeSingle();

      const updateData: any = {
        user_id: userId,
        deal_id: dealId,
        use_case: useCase,
        updated_at: new Date().toISOString()
      };

      // Only update provided fields
      if (modelId !== undefined) updateData.model_id = modelId;
      if (isTestingMode !== undefined) updateData.is_testing_mode = isTestingMode;

      // If existing config, merge with current values
      if (existing) {
        if (modelId === undefined) updateData.model_id = existing.model_id;
        if (isTestingMode === undefined) updateData.is_testing_mode = existing.is_testing_mode;
      }

      const { data, error } = await supabase
        .from('model_configurations')
        .upsert(updateData, {
          onConflict: 'user_id,deal_id,use_case'
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error saving configuration:', error);
        throw error;
      }

      console.log('Configuration saved successfully:', data);
    } catch (error) {
      console.error('Error saving model configuration:', error);
      throw error;
    }
  }

  // Bulk configuration updates with improved error handling
  static async bulkUpdateConfigurations(
    userId: string,
    dealId: string | null,
    updates: BulkConfigurationUpdate[]
  ): Promise<void> {
    try {
      console.log('Starting bulk update:', { userId, dealId, updates });

      for (const update of updates) {
        if (update.applyToAll) {
          // Apply to all use cases
          const useCases: ModelUseCase[] = [
            'cim_analysis',
            'document_processing', 
            'excel_analysis',
            'audio_transcription',
            'memo_generation',
            'general_analysis'
          ];

          for (const useCase of useCases) {
            await this.saveModelConfiguration(
              userId,
              dealId,
              useCase,
              update.modelId,
              update.isTestingMode
            );
          }
        } else if (update.useCase) {
          await this.saveModelConfiguration(
            userId,
            dealId,
            update.useCase,
            update.modelId,
            update.isTestingMode
          );
        }
      }

      console.log('Bulk update completed successfully');
    } catch (error) {
      console.error('Error in bulk update:', error);
      throw error;
    }
  }

  // Apply configuration presets
  static async applyPreset(
    userId: string,
    dealId: string | null,
    preset: ConfigurationPreset,
    availableModels: AIModel[]
  ): Promise<void> {
    const presetConfigs = this.getPresetConfigurations(preset, availableModels);
    
    const updates: BulkConfigurationUpdate[] = Object.entries(presetConfigs).map(([useCase, config]) => ({
      useCase: useCase as ModelUseCase,
      modelId: config.modelId,
      isTestingMode: config.isTestingMode
    }));

    await this.bulkUpdateConfigurations(userId, dealId, updates);
  }

  // Get preset configurations
  static getPresetConfigurations(preset: ConfigurationPreset, models: AIModel[]): Record<ModelUseCase, { modelId: string; isTestingMode: boolean }> {
    const getModelByName = (namePattern: string) => {
      const found = models.find(m => m.name.toLowerCase().includes(namePattern.toLowerCase()));
      if (!found) {
        console.warn(`Model not found for pattern: ${namePattern}`);
        return models[0]?.id || '';
      }
      return found.id;
    };

    const configs = {
      'cost-optimized': {
        cim_analysis: { modelId: getModelByName('gpt-4o-mini'), isTestingMode: false },
        document_processing: { modelId: getModelByName('gpt-3.5-turbo'), isTestingMode: false },
        excel_analysis: { modelId: getModelByName('gpt-4o-mini'), isTestingMode: false },
        audio_transcription: { modelId: getModelByName('whisper'), isTestingMode: false },
        memo_generation: { modelId: getModelByName('gpt-4o-mini'), isTestingMode: false },
        general_analysis: { modelId: getModelByName('gpt-3.5-turbo'), isTestingMode: false }
      },
      'performance-optimized': {
        cim_analysis: { modelId: getModelByName('gpt-4o'), isTestingMode: false },
        document_processing: { modelId: getModelByName('gpt-4o'), isTestingMode: false },
        excel_analysis: { modelId: getModelByName('gpt-4o'), isTestingMode: false },
        audio_transcription: { modelId: getModelByName('whisper'), isTestingMode: false },
        memo_generation: { modelId: getModelByName('gpt-4o'), isTestingMode: false },
        general_analysis: { modelId: getModelByName('gpt-4o'), isTestingMode: false }
      },
      'balanced': {
        cim_analysis: { modelId: getModelByName('gpt-4o'), isTestingMode: false },
        document_processing: { modelId: getModelByName('gpt-4o-mini'), isTestingMode: false },
        excel_analysis: { modelId: getModelByName('gpt-4o'), isTestingMode: false },
        audio_transcription: { modelId: getModelByName('whisper'), isTestingMode: false },
        memo_generation: { modelId: getModelByName('gpt-4o-mini'), isTestingMode: false },
        general_analysis: { modelId: getModelByName('gpt-4o-mini'), isTestingMode: false }
      },
      'recommended': {
        cim_analysis: { modelId: getModelByName('gpt-4o'), isTestingMode: false },
        document_processing: { modelId: getModelByName('gpt-4o-mini'), isTestingMode: false },
        excel_analysis: { modelId: getModelByName('gpt-4o'), isTestingMode: false },
        audio_transcription: { modelId: getModelByName('whisper'), isTestingMode: false },
        memo_generation: { modelId: getModelByName('gpt-4o'), isTestingMode: false },
        general_analysis: { modelId: getModelByName('gpt-4o-mini'), isTestingMode: false }
      }
    };

    return configs[preset] as Record<ModelUseCase, { modelId: string; isTestingMode: boolean }>;
  }
}
