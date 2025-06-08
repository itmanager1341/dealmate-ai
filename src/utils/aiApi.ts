// AI API Integration for DealMate Frontend - Enhanced Version with Dynamic Server URL

import { supabase } from '@/lib/supabase';
import type { ModelConfiguration, ModelUsageLog, AIModel, ModelUseCase, ModelUsageStats } from '@/types/models';

// Function to get current AI server URL from localStorage
export function getAIServerURL(): string | null {
  const storedUrl = localStorage.getItem('ai_server_url');
  return storedUrl || null;
}

// Function to update AI server URL in localStorage
export function setAIServerURL(url: string): void {
  localStorage.setItem('ai_server_url', url);
}

// Function to reset to default URL
export function resetAIServerURL(): void {
  localStorage.removeItem('ai_server_url');
}

// Function to validate server URL is configured
export function validateServerURL(): { isValid: boolean; error?: string } {
  const serverUrl = getAIServerURL();
  
  if (!serverUrl) {
    return {
      isValid: false,
      error: 'AI server URL is not configured. Please set it in Settings > API Key Management.'
    };
  }
  
  try {
    new URL(serverUrl);
    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: 'Invalid AI server URL format. Please check the URL in Settings.'
    };
  }
}

export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
  processing_time?: number;
}

// Enhanced CIM Analysis interfaces
export interface CIMAnalysisResult {
  investment_grade: string; // A+ to F rating
  executive_summary: string;
  business_model: {
    type: string;
    revenue_streams: string[];
    key_value_propositions: string[];
  };
  financial_metrics: {
    revenue_cagr: string;
    ebitda_margin: string;
    deal_size_estimate: string;
    revenue_multiple: string;
    ebitda_multiple: string;
  };
  key_risks: Array<{
    risk: string;
    severity: 'High' | 'Medium' | 'Low';
    impact: string;
  }>;
  investment_highlights: string[];
  management_questions: string[];
  competitive_position: {
    strengths: string[];
    weaknesses: string[];
    market_position: string;
  };
  recommendation: {
    action: 'Pursue' | 'Pass' | 'More Info Needed';
    rationale: string;
  };
}

// Backend response structure based on your API documentation
export interface CIMProcessingResponse {
  success: boolean;
  deal_id: string;
  filename: string;
  document_type: string;
  page_count: number;
  text_length: number;
  ai_analysis: string; // JSON string that needs parsing
  processing_time: string;
  analysis_type: string;
  error?: string;
}

export interface DealFile {
  id: string;
  name: string;
  type: string;
  url: string;
  deal_id: string;
}

// Model API - Core model management functions
export const modelApi = {
  // Core configuration functions
  getModelConfigs: async (params: { user_id?: string; deal_id?: string; use_case?: ModelUseCase } = {}): Promise<ModelConfiguration[]> => {
    try {
      let query = supabase.from('model_configurations').select('*');
      
      // Apply filters if provided
      if (params.user_id) query = query.eq('user_id', params.user_id);
      if (params.deal_id) query = query.eq('deal_id', params.deal_id);
      if (params.use_case) query = query.eq('use_case', params.use_case);
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching model configurations:', error);
      throw new Error(`Failed to fetch model configurations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  updateModelConfig: async (config: Omit<ModelConfiguration, 'id' | 'created_at' | 'updated_at'>): Promise<ModelConfiguration[]> => {
    try {
      const { data, error } = await supabase
        .from('model_configurations')
        .upsert({
          ...config,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,deal_id,use_case'
        })
        .select();
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error updating model configuration:', error);
      throw new Error(`Failed to update model configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  getModelUsageLogs: async (params: { 
    deal_id?: string; 
    model_id?: string; 
    use_case?: ModelUseCase;
    start_date?: Date;
    end_date?: Date;
    user_id?: string;
  } = {}): Promise<ModelUsageLog[]> => {
    try {
      let query = supabase.from('model_usage_logs').select('*');
      
      // Apply filters
      if (params.deal_id) query = query.eq('deal_id', params.deal_id);
      if (params.model_id) query = query.eq('model_id', params.model_id);
      if (params.use_case) query = query.eq('use_case', params.use_case);
      if (params.user_id) query = query.eq('user_id', params.user_id);
      if (params.start_date) query = query.gte('created_at', params.start_date.toISOString());
      if (params.end_date) query = query.lte('created_at', params.end_date.toISOString());
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching model usage logs:', error);
      throw new Error(`Failed to fetch model usage logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Extended model management functions
  getAvailableModels: async (useCase?: ModelUseCase): Promise<AIModel[]> => {
    try {
      let query = supabase
        .from('ai_models')
        .select('*')
        .eq('is_active', true);
      
      if (useCase) {
        query = query.eq('use_case', useCase);
      }
      
      const { data, error } = await query
        .order('use_case', { ascending: true })
        .order('is_default', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching available models:', error);
      throw new Error(`Failed to fetch available models: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  getEffectiveModelConfig: async (userId: string, dealId?: string, useCase?: ModelUseCase): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .rpc('get_effective_model_config', {
          p_user_id: userId,
          p_deal_id: dealId || null,
          p_use_case: useCase
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting effective model config:', error);
      throw new Error(`Failed to get effective model config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Analytics functions
  getModelUsageStats: async (params: {
    userId?: string;
    dealId?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<ModelUsageStats> => {
    try {
      let query = supabase
        .from('model_usage_logs')
        .select(`
          *,
          ai_models!inner(name, model_id)
        `);

      if (params.userId) query = query.eq('user_id', params.userId);
      if (params.dealId) query = query.eq('deal_id', params.dealId);
      if (params.startDate) query = query.gte('created_at', params.startDate.toISOString());
      if (params.endDate) query = query.lte('created_at', params.endDate.toISOString());

      const { data, error } = await query;
      if (error) throw error;

      const logs = (data || []) as (ModelUsageLog & { ai_models?: { name: string; model_id: string } })[];
      
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
        const modelName = log.ai_models?.name || 'Unknown';
        stats.cost_by_model[modelName] = (stats.cost_by_model[modelName] || 0) + log.cost_usd;
      });

      // Calculate usage by case
      logs.forEach(log => {
        stats.usage_by_case[log.use_case] = (stats.usage_by_case[log.use_case] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting model usage stats:', error);
      throw new Error(`Failed to get model usage stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Batch operations
  bulkUpdateModelConfigs: async (configs: Omit<ModelConfiguration, 'id' | 'created_at' | 'updated_at'>[]): Promise<ModelConfiguration[]> => {
    try {
      const configsWithTimestamp = configs.map(config => ({
        ...config,
        updated_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('model_configurations')
        .upsert(configsWithTimestamp, {
          onConflict: 'user_id,deal_id,use_case'
        })
        .select();
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error bulk updating model configurations:', error);
      throw new Error(`Failed to bulk update model configurations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Logging function for usage tracking
  logModelUsage: async (
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
  ): Promise<void> => {
    try {
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
    } catch (error) {
      console.error('Error logging model usage:', error);
      // Don't throw here to avoid breaking the main flow
    }
  },

  // Add health check for AI server
  checkServerHealth: async (): Promise<boolean> => {
    try {
      const serverUrl = getAIServerURL();
      if (!serverUrl) {
        console.error('No AI server URL configured');
        return false;
      }
      
      console.log('Checking AI server health at:', serverUrl);
      
      const response = await fetch(`${serverUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      console.log('Health check response status:', response.status);
      
      if (!response.ok) {
        console.error('AI server health check failed with status:', response.status);
        return false;
      }
      
      const data = await response.json();
      console.log('AI server health check response:', data);
      return data.status === 'healthy' || data.status === 'ok';
    } catch (error) {
      console.error('AI server health check failed:', error);
      return false;
    }
  }
};

// Helper function to get authentication headers with optional Content-Type
async function getAuthHeaders(includeContentType: boolean = true): Promise<{ headers: Record<string, string>; userId: string | null }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!session?.access_token) {
      console.warn('No valid session found for AI API request');
      return { headers: {}, userId: null };
    }
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${session.access_token}`,
    };
    
    // Only include Content-Type when explicitly requested (for JSON requests)
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    
    console.log('Authentication headers prepared for AI server');
    return { headers, userId: user?.id || null };
  } catch (error) {
    console.error('Error getting auth headers:', error);
    return { headers: {}, userId: null };
  }
}

// Enhanced CIM file validation with comprehensive checks
export function validateCIMFile(file: File): { isValid: boolean; message: string; confidence?: number } {
  console.log(`Validating CIM file: ${file.name} (${file.size} bytes, ${file.type})`);
  
  // Check file type
  if (file.type !== 'application/pdf') {
    return {
      isValid: false,
      message: 'Only PDF files are supported for CIM analysis',
      confidence: 0
    };
  }

  // Check file size (limit: 50MB, minimum: 1MB for meaningful CIMs)
  const maxSize = 50 * 1024 * 1024; // 50MB
  const minSize = 1 * 1024 * 1024;  // 1MB
  
  if (file.size > maxSize) {
    return {
      isValid: false,
      message: 'File size must be less than 50MB',
      confidence: 0
    };
  }
  
  if (file.size < minSize) {
    return {
      isValid: false,
      message: 'File appears too small to be a comprehensive CIM (minimum 1MB)',
      confidence: 0
    };
  }

  // Enhanced CIM keyword detection with confidence scoring
  const fileName = file.name.toLowerCase();
  const strongCimKeywords = ['cim', 'confidential information memorandum', 'investment memorandum'];
  const mediumCimKeywords = ['memorandum', 'investment', 'offering', 'confidential'];
  const weakCimKeywords = ['business', 'company', 'acquisition', 'private'];
  
  let confidence = 0;
  let keywordMatches = [];
  
  // Strong indicators (high confidence)
  for (const keyword of strongCimKeywords) {
    if (fileName.includes(keyword)) {
      confidence += 40;
      keywordMatches.push(keyword);
    }
  }
  
  // Medium indicators
  for (const keyword of mediumCimKeywords) {
    if (fileName.includes(keyword)) {
      confidence += 20;
      keywordMatches.push(keyword);
    }
  }
  
  // Weak indicators
  for (const keyword of weakCimKeywords) {
    if (fileName.includes(keyword)) {
      confidence += 10;
      keywordMatches.push(keyword);
    }
  }
  
  // File size bonus (larger files more likely to be comprehensive CIMs)
  if (file.size > 10 * 1024 * 1024) { // > 10MB
    confidence += 15;
  } else if (file.size > 5 * 1024 * 1024) { // > 5MB
    confidence += 10;
  }
  
  confidence = Math.min(confidence, 100); // Cap at 100%
  
  console.log(`CIM validation result: ${confidence}% confidence, keywords: [${keywordMatches.join(', ')}]`);
  
  return {
    isValid: true,
    message: `File validation passed (${confidence}% confidence as CIM)`,
    confidence
  };
}

// Enhanced JSON parsing with fallback strategies
function parseAIAnalysisWithFallback(analysisText: string): CIMAnalysisResult {
  console.log('Attempting to parse AI analysis:', analysisText.substring(0, 200) + '...');
  
  // Strategy 1: Direct JSON parse
  try {
    const parsed = JSON.parse(analysisText);
    console.log('Successfully parsed as direct JSON');
    return parsed;
  } catch (error) {
    console.log('Direct JSON parse failed, trying fallback strategies...');
  }
  
  // Strategy 2: Extract JSON from markdown code blocks
  const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/i;
  const jsonMatch = analysisText.match(jsonBlockRegex);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      console.log('Successfully parsed JSON from markdown code block');
      return parsed;
    } catch (error) {
      console.log('Failed to parse JSON from markdown block');
    }
  }
  
  // Strategy 3: Extract JSON from any code blocks
  const codeBlockRegex = /```\s*([\s\S]*?)\s*```/i;
  const codeMatch = analysisText.match(codeBlockRegex);
  if (codeMatch) {
    try {
      const parsed = JSON.parse(codeMatch[1]);
      console.log('Successfully parsed JSON from general code block');
      return parsed;
    } catch (error) {
      console.log('Failed to parse JSON from general code block');
    }
  }
  
  // Strategy 4: Look for JSON-like content between braces
  const braceRegex = /\{[\s\S]*\}/;
  const braceMatch = analysisText.match(braceRegex);
  if (braceMatch) {
    try {
      const parsed = JSON.parse(braceMatch[0]);
      console.log('Successfully parsed JSON from brace extraction');
      return parsed;
    } catch (error) {
      console.log('Failed to parse JSON from brace extraction');
    }
  }
  
  // Strategy 5: Create fallback structure from plain text
  console.log('All JSON parsing strategies failed, creating fallback structure');
  return {
    investment_grade: 'N/A',
    executive_summary: analysisText.substring(0, 500) + '...',
    business_model: {
      type: 'Unknown',
      revenue_streams: ['Unable to parse from response'],
      key_value_propositions: ['Unable to parse from response']
    },
    financial_metrics: {
      revenue_cagr: 'N/A',
      ebitda_margin: 'N/A',
      deal_size_estimate: 'N/A',
      revenue_multiple: 'N/A',
      ebitda_multiple: 'N/A'
    },
    key_risks: [{
      risk: 'Analysis parsing failed',
      severity: 'High' as const,
      impact: 'Unable to provide detailed risk assessment'
    }],
    investment_highlights: ['Analysis parsing failed - raw response available'],
    management_questions: ['Unable to parse management questions from response'],
    competitive_position: {
      strengths: ['Unable to parse from response'],
      weaknesses: ['Unable to parse from response'],
      market_position: 'Unknown'
    },
    recommendation: {
      action: 'More Info Needed' as const,
      rationale: 'Analysis could not be properly parsed from AI response'
    }
  };
}

// Health check for AI server with alias for consistency
export async function checkAIServerHealth(): Promise<boolean> {
  return await modelApi.checkServerHealth();
}

export async function checkApiHealth(): Promise<boolean> {
  return await modelApi.checkServerHealth();
}

// Enhanced CIM-specific storage function
async function storeCIMAnalysis(
  dealId: string, 
  documentId: string, 
  analysisData: CIMAnalysisResult, 
  processingResponse: CIMProcessingResponse
): Promise<void> {
  console.log('Storing CIM analysis for deal:', dealId, 'document:', documentId);
  console.log('Analysis data being stored:', analysisData);
  
  try {
    // Store in cim_analysis table with enhanced data structure
    const { error: cimError } = await supabase
      .from('cim_analysis')
      .insert({
        deal_id: dealId,
        document_id: documentId,
        investment_grade: analysisData.investment_grade || 'Not Rated',
        executive_summary: analysisData.executive_summary,
        business_model: analysisData.business_model,
        financial_metrics: analysisData.financial_metrics,
        key_risks: analysisData.key_risks,
        investment_highlights: analysisData.investment_highlights || [],
        management_questions: analysisData.management_questions || [],
        competitive_position: analysisData.competitive_position,
        recommendation: analysisData.recommendation,
        raw_ai_response: {
          ...analysisData,
          processing_metadata: {
            filename: processingResponse.filename,
            page_count: processingResponse.page_count,
            text_length: processingResponse.text_length,
            processing_time: processingResponse.processing_time,
            analysis_type: processingResponse.analysis_type
          }
        }
      });

    if (cimError) {
      console.error('Error storing CIM analysis:', cimError);
      throw cimError;
    }

    console.log('Successfully stored CIM analysis in cim_analysis table');

    // Store in ai_outputs table for comprehensive audit trail
    const { error: aiOutputError } = await supabase
      .from('ai_outputs')
      .insert({
        deal_id: dealId,
        document_id: documentId,
        agent_type: 'cim_analysis',
        output_type: 'investment_analysis',
        output_text: JSON.stringify(analysisData),
        output_json: {
          analysis: analysisData,
          processing_response: processingResponse
        }
      });

    if (aiOutputError) {
      console.error('Error storing AI output:', aiOutputError);
      throw aiOutputError;
    }

    console.log('Successfully stored CIM analysis in ai_outputs table');

    // Log the processing activity with enhanced metadata
    await supabase.from('agent_logs').insert({
      agent_name: 'cim_analysis_processor',
      status: 'success',
      input_payload: {
        deal_id: dealId,
        document_id: documentId,
        filename: processingResponse.filename,
        page_count: processingResponse.page_count,
        text_length: processingResponse.text_length
      },
      output_payload: {
        investment_grade: analysisData.investment_grade,
        recommendation: analysisData.recommendation?.action,
        processing_time: processingResponse.processing_time,
        analysis_type: processingResponse.analysis_type
      }
    });

    console.log('CIM analysis processing logged successfully');

  } catch (error) {
    console.error('Error in storeCIMAnalysis:', error);
    
    // Log the error with detailed context
    await supabase.from('agent_logs').insert({
      agent_name: 'cim_analysis_processor',
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      input_payload: {
        deal_id: dealId,
        document_id: documentId,
        filename: processingResponse?.filename || 'unknown'
      },
      output_payload: null
    });
    
    throw error;
  }
}

// Store processing results in database
async function storeProcessingResults(
  file: File, 
  dealId: string, 
  documentId: string, 
  aiResponse: any, 
  processingMethod: string
): Promise<void> {
  console.log('Storing processing results for:', file.name, 'Method:', processingMethod);
  
  try {
    // Store in ai_outputs table for audit trail
    const { error: aiOutputError } = await supabase
      .from('ai_outputs')
      .insert({
        deal_id: dealId,
        document_id: documentId,
        agent_type: processingMethod,
        output_type: 'processing_result',
        output_text: JSON.stringify(aiResponse),
        output_json: aiResponse
      });

    if (aiOutputError) {
      console.error('Error storing AI output:', aiOutputError);
    } else {
      console.log('Successfully stored AI output');
    }

    // Store CIM-specific data in cim_analysis table
    if (processingMethod === 'cim' && aiResponse) {
      const { error: cimError } = await supabase
        .from('cim_analysis')
        .insert({
          deal_id: dealId,
          document_id: documentId,
          investment_grade: aiResponse.investment_grade || 'Not Rated',
          executive_summary: aiResponse.executive_summary,
          business_model: aiResponse.business_model,
          financial_metrics: aiResponse.financial_metrics,
          key_risks: aiResponse.key_risks,
          investment_highlights: aiResponse.investment_highlights || [],
          management_questions: aiResponse.management_questions || [],
          competitive_position: aiResponse.competitive_position,
          recommendation: aiResponse.recommendation,
          raw_ai_response: aiResponse
        });

      if (cimError) {
        console.error('Error storing CIM analysis:', cimError);
      } else {
        console.log('Successfully stored CIM analysis');
      }
    }

    // Store specific data based on processing method
    if (processingMethod === 'excel' && aiResponse) {
      // Handle Excel data - create chunks from the raw data and analysis
      console.log('Processing Excel data for chunks...');
      
      if (aiResponse.raw_data_preview) {
        const { error: chunkError } = await supabase
          .from('xlsx_chunks')
          .insert({
            document_id: documentId,
            sheet_name: aiResponse.sheets?.[0] || 'Unknown',
            chunk_label: 'Raw Data Preview',
            data: { raw_preview: aiResponse.raw_data_preview },
            verified_by_user: false
          });

        if (chunkError) {
          console.error('Error storing raw data chunk:', chunkError);
        }
      }

      // Process AI analysis for Excel files
      if (aiResponse.ai_analysis) {
        try {
          const analysisText = aiResponse.ai_analysis;
          let analysisData = null;
          
          const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            analysisData = JSON.parse(jsonMatch[1]);
          }

          if (analysisData && analysisData.financial_metrics) {
            const { error: analysisChunkError } = await supabase
              .from('xlsx_chunks')
              .insert({
                document_id: documentId,
                sheet_name: aiResponse.sheets?.[0] || 'Analysis',
                chunk_label: 'Financial Metrics Analysis',
                data: analysisData.financial_metrics,
                verified_by_user: false
              });

            if (analysisChunkError) {
              console.error('Error storing analysis chunk:', analysisChunkError);
            }

            // Extract and store metrics from Excel analysis
            if (analysisData.financial_metrics.revenue) {
              for (const [period, value] of Object.entries(analysisData.financial_metrics.revenue)) {
                if (value !== null && typeof value === 'number') {
                  await supabase.from('deal_metrics').insert({
                    deal_id: dealId,
                    metric_name: `Revenue ${period}`,
                    metric_value: value,
                    metric_unit: '$',
                    pinned: false
                  });
                }
              }
            }
          }
        } catch (parseError) {
          console.error('Error parsing Excel AI analysis:', parseError);
        }
      }
    }

    if (processingMethod === 'audio' && aiResponse.transcript) {
      const { error: transcriptError } = await supabase
        .from('transcripts')
        .insert({
          document_id: documentId,
          content: aiResponse.transcript,
          timestamps: aiResponse.timestamps || {}
        });

      if (transcriptError) {
        console.error('Error storing transcript:', transcriptError);
      }
    }

    // Extract and store general metrics if available
    if (aiResponse.metrics && Array.isArray(aiResponse.metrics)) {
      for (const metric of aiResponse.metrics) {
        await supabase.from('deal_metrics').insert({
          deal_id: dealId,
          metric_name: metric.name,
          metric_value: metric.value,
          metric_unit: metric.unit || '',
          pinned: false
        });
      }
    }

    // Log the processing activity
    await supabase.from('agent_logs').insert({
      agent_name: `${processingMethod}_processor`,
      status: 'success',
      input_payload: {
        file_name: file.name,
        file_size: file.size,
        deal_id: dealId,
        document_id: documentId
      },
      output_payload: aiResponse
    });

  } catch (error) {
    console.error('Error in storeProcessingResults:', error);
    
    // Log the error
    await supabase.from('agent_logs').insert({
      agent_name: `${processingMethod}_processor`,
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      input_payload: {
        file_name: file.name,
        file_size: file.size,
        deal_id: dealId,
        document_id: documentId
      },
      output_payload: null
    });
  }
}

// Add new function to get selected model for use case
async function getSelectedModel(useCase: string, dealId?: string): Promise<{ modelId: string; model: any } | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Use the new modelApi function
    const modelId = await modelApi.getEffectiveModelConfig(user.id, dealId, useCase as ModelUseCase);
    
    if (!modelId) return null;

    // Get model details
    const models = await modelApi.getAvailableModels();
    const model = models.find(m => m.id === modelId);
    
    if (!model) return null;

    return { modelId, model };
  } catch (error) {
    console.error('Error in getSelectedModel:', error);
    return null;
  }
}

// Add function to log usage
async function logModelUsage(
  modelId: string,
  useCase: string,
  inputTokens: number,
  outputTokens: number,
  processingTime: number,
  success: boolean,
  dealId?: string,
  documentId?: string,
  errorMessage?: string
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get model costs
    const { data: model } = await supabase
      .from('ai_models')
      .select('cost_per_input_token, cost_per_output_token')
      .eq('id', modelId)
      .single();

    const costUsd = model ? 
      (inputTokens * model.cost_per_input_token / 1000) + 
      (outputTokens * model.cost_per_output_token / 1000) : 0;

    await supabase.from('model_usage_logs').insert({
      deal_id: dealId,
      document_id: documentId,
      model_id: modelId,
      use_case: useCase,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens,
      cost_usd: costUsd,
      processing_time_ms: processingTime,
      success,
      error_message: errorMessage,
      user_id: user.id
    });
  } catch (error) {
    console.error('Error logging model usage:', error);
  }
}

// Process CIM documents for investment analysis with enhanced error handling
export async function processCIM(file: File, dealId: string, documentId?: string): Promise<AIResponse> {
  const startTime = Date.now();
  let selectedModelInfo = null;
  
  try {
    console.log(`Starting enhanced CIM processing for ${file.name}`);
    
    // Validate server URL first
    const urlValidation = validateServerURL();
    if (!urlValidation.isValid) {
      return {
        success: false,
        error: urlValidation.error
      };
    }
    
    // Get authentication headers WITHOUT Content-Type for FormData
    const { headers: authHeaders, userId } = await getAuthHeaders(false);
    
    if (!userId) {
      console.error('No authenticated user found for CIM processing');
      return {
        success: false,
        error: 'Authentication required for CIM processing'
      };
    }
    
    // Get selected model for CIM analysis
    selectedModelInfo = await getSelectedModel('cim_analysis', dealId);
    if (!selectedModelInfo) {
      console.log('No model configuration found, using default behavior');
    } else {
      console.log(`Using model: ${selectedModelInfo.model.name} (${selectedModelInfo.model.model_id})`);
    }
    
    // Enhanced validation with confidence scoring
    const validation = validateCIMFile(file);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.message
      };
    }
    
    console.log(`CIM validation passed with ${validation.confidence}% confidence`);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('deal_id', dealId);
    formData.append('user_id', userId); // Add user_id as fallback
    if (documentId) {
      formData.append('document_id', documentId);
    }
    
    // Add model selection to request if available
    if (selectedModelInfo) {
      formData.append('model_id', selectedModelInfo.model.model_id);
      formData.append('provider', selectedModelInfo.model.provider);
    }

    const serverUrl = getAIServerURL();
    if (!serverUrl) {
      throw new Error('AI server URL not configured');
    }
    
    console.log('Sending authenticated CIM processing request to AI server...');
    const response = await fetch(`${serverUrl}/process-cim`, {
      method: 'POST',
      headers: authHeaders, // Only includes Authorization header, no Content-Type
      body: formData,
      mode: 'cors',
    });

    const processingTime = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error('CIM processing request failed:', response.status, errorText);
      
      // Log failed usage
      if (selectedModelInfo) {
        await logModelUsage(
          selectedModelInfo.modelId,
          'cim_analysis',
          0, 0, processingTime, false,
          dealId, documentId, errorText
        );
      }
      
      // Provide more specific error messages
      if (response.status === 401) {
        throw new Error('Authentication failed. Please try logging in again.');
      } else if (response.status === 403) {
        throw new Error('Access denied. Please check your permissions.');
      } else {
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    }

    const result: CIMProcessingResponse = await response.json();
    console.log('CIM processing response received:', result);
    
    if (!result.success) {
      // Log failed usage
      if (selectedModelInfo) {
        await logModelUsage(
          selectedModelInfo.modelId,
          'cim_analysis',
          0, 0, processingTime, false,
          dealId, documentId, result.error
        );
      }
      throw new Error(result.error || 'CIM processing failed');
    }

    // Enhanced parsing with fallback strategies
    let analysisData: CIMAnalysisResult;
    try {
      console.log('Raw AI analysis response:', result.ai_analysis);
      analysisData = parseAIAnalysisWithFallback(result.ai_analysis);
      console.log('Successfully parsed CIM analysis:', analysisData);
    } catch (parseError) {
      console.error('All parsing strategies failed:', parseError);
      throw new Error('Failed to parse CIM analysis data from AI response');
    }

    // Log successful usage
    if (selectedModelInfo) {
      // Estimate token usage (this would ideally come from the API response)
      const estimatedInputTokens = Math.ceil(result.text_length / 4); // Rough estimate
      const estimatedOutputTokens = Math.ceil(result.ai_analysis.length / 4);
      
      await logModelUsage(
        selectedModelInfo.modelId,
        'cim_analysis',
        estimatedInputTokens,
        estimatedOutputTokens,
        processingTime,
        true,
        dealId,
        documentId
      );
    }

    // Store results using enhanced CIM-specific storage function
    if (documentId) {
      console.log('Storing CIM analysis results...');
      await storeCIMAnalysis(dealId, documentId, analysisData, result);
      console.log('CIM analysis results stored successfully');
    }

    console.log(`Enhanced CIM processing successful for ${file.name}`);
    
    return {
      success: true,
      data: {
        ...result,
        parsed_analysis: analysisData,
        validation_confidence: validation.confidence,
        model_used: selectedModelInfo?.model.name || 'Default'
      },
      processing_time: parseFloat(result.processing_time) || 0
    };
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    // Log failed usage
    if (selectedModelInfo) {
      await logModelUsage(
        selectedModelInfo.modelId,
        'cim_analysis',
        0, 0, processingTime, false,
        dealId, documentId, error instanceof Error ? error.message : 'Unknown error'
      );
    }
    
    console.error('Enhanced CIM processing failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Transcribe audio files (MP3, WAV) with authentication
export async function transcribeAudio(file: File, dealId: string, documentId?: string): Promise<AIResponse> {
  try {
    // Validate server URL first
    const urlValidation = validateServerURL();
    if (!urlValidation.isValid) {
      return {
        success: false,
        error: urlValidation.error
      };
    }
    
    // Get auth headers WITHOUT Content-Type for FormData
    const { headers: authHeaders, userId } = await getAuthHeaders(false);
    
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required for audio transcription'
      };
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('deal_id', dealId);
    formData.append('user_id', userId);

    const serverUrl = getAIServerURL();
    if (!serverUrl) {
      throw new Error('AI server URL not configured');
    }
    
    const response = await fetch(`${serverUrl}/transcribe`, {
      method: 'POST',
      headers: authHeaders, // Only Authorization header
      body: formData,
      mode: 'cors',
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 401) {
        throw new Error('Authentication failed. Please try logging in again.');
      }
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (documentId) {
      await storeProcessingResults(file, dealId, documentId, data, 'audio');
    }

    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Audio transcription failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Process Excel files for financial metrics with authentication
export async function processExcel(file: File, dealId: string, documentId?: string): Promise<AIResponse> {
  try {
    // Validate server URL first
    const urlValidation = validateServerURL();
    if (!urlValidation.isValid) {
      return {
        success: false,
        error: urlValidation.error
      };
    }
    
    // Get auth headers WITHOUT Content-Type for FormData
    const { headers: authHeaders, userId } = await getAuthHeaders(false);
    
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required for Excel processing'
      };
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('deal_id', dealId);
    formData.append('user_id', userId);

    const serverUrl = getAIServerURL();
    if (!serverUrl) {
      throw new Error('AI server URL not configured');
    }
    
    const response = await fetch(`${serverUrl}/process-excel`, {
      method: 'POST',
      headers: authHeaders, // Only Authorization header
      body: formData,
      mode: 'cors',
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 401) {
        throw new Error('Authentication failed. Please try logging in again.');
      }
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (documentId) {
      await storeProcessingResults(file, dealId, documentId, data, 'excel');
    }

    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Excel processing failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Process documents (PDF, DOCX) for business analysis with authentication
export async function processDocument(file: File, dealId: string, documentId?: string): Promise<AIResponse> {
  try {
    // Validate server URL first
    const urlValidation = validateServerURL();
    if (!urlValidation.isValid) {
      return {
        success: false,
        error: urlValidation.error
      };
    }
    
    // Get auth headers WITHOUT Content-Type for FormData
    const { headers: authHeaders, userId } = await getAuthHeaders(false);
    
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required for document processing'
      };
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('deal_id', dealId);
    formData.append('user_id', userId);

    const serverUrl = getAIServerURL();
    if (!serverUrl) {
      throw new Error('AI server URL not configured');
    }
    
    const response = await fetch(`${serverUrl}/process-document`, {
      method: 'POST',
      headers: authHeaders, // Only Authorization header
      body: formData,
      mode: 'cors',
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 401) {
        throw new Error('Authentication failed. Please try logging in again.');
      }
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (documentId) {
      await storeProcessingResults(file, dealId, documentId, data, 'document');
    }

    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Document processing failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Generate investment memo from processed data with authentication
export async function generateMemo(dealId: string, requestedSections?: string[]): Promise<AIResponse> {
  try {
    // Validate server URL first
    const urlValidation = validateServerURL();
    if (!urlValidation.isValid) {
      return {
        success: false,
        error: urlValidation.error
      };
    }
    
    // Get auth headers WITH Content-Type for JSON requests
    const { headers: authHeaders, userId } = await getAuthHeaders(true);
    
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required for memo generation'
      };
    }
    
    const serverUrl = getAIServerURL();
    if (!serverUrl) {
      throw new Error('AI server URL not configured');
    }
    
    const response = await fetch(`${serverUrl}/generate-memo`, {
      method: 'POST',
      headers: authHeaders, // Includes both Authorization and Content-Type
      body: JSON.stringify({
        deal_id: dealId,
        user_id: userId,
        sections: requestedSections || ['executive_summary', 'financial_analysis', 'risks', 'recommendation']
      }),
      mode: 'cors',
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 401) {
        throw new Error('Authentication failed. Please try logging in again.');
      }
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Memo generation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Utility function to determine file processing method
export function getProcessingMethod(fileName: string): 'audio' | 'excel' | 'document' | 'unknown' {
  const extension = fileName.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'mp3':
    case 'wav':
    case 'm4a':
      return 'audio';
    case 'xlsx':
    case 'xls':
    case 'csv':
      return 'excel';
    case 'pdf':
    case 'docx':
    case 'doc':
      return 'document';
    default:
      return 'unknown';
  }
}

// Main file processing orchestrator
export async function processFile(file: File, dealId: string, documentId?: string): Promise<AIResponse> {
  const processingMethod = getProcessingMethod(file.name);
  
  switch (processingMethod) {
    case 'audio':
      return await transcribeAudio(file, dealId, documentId);
    case 'excel':
      return await processExcel(file, dealId, documentId);
    case 'document':
      return await processDocument(file, dealId, documentId);
    default:
      return {
        success: false,
        error: `Unsupported file type: ${file.name}`
      };
  }
}

// Processing status checker (for long-running operations)
export async function checkProcessingStatus(jobId: string): Promise<AIResponse> {
  try {
    // Validate server URL first
    const urlValidation = validateServerURL();
    if (!urlValidation.isValid) {
      return {
        success: false,
        error: urlValidation.error
      };
    }
    
    const serverUrl = getAIServerURL();
    if (!serverUrl) {
      throw new Error('AI server URL not configured');
    }
    
    const response = await fetch(`${serverUrl}/status/${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Status check failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
