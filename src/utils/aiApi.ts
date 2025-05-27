
// AI API Integration for DealMate Frontend - Hybrid Enhanced Version

import { supabase } from '@/lib/supabase';

const AI_SERVER_URL = 'https://zxjyxzhoz0d2e5-8000.proxy.runpod.net';

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

// Helper function to get authentication headers
async function getAuthHeaders(): Promise<{ headers: Record<string, string>; userId: string | null }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!session?.access_token) {
      console.warn('No valid session found for AI API request');
      return { headers: {}, userId: null };
    }
    
    const headers = {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    };
    
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
  return await checkApiHealth();
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    console.log('Checking AI server health at:', AI_SERVER_URL);
    
    const response = await fetch(`${AI_SERVER_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      credentials: 'omit',
    });
    
    console.log('Health check response status:', response.status);
    
    if (!response.ok) {
      console.error('AI server health check failed with status:', response.status);
      return false;
    }
    
    const data = await response.json();
    console.log('AI server health check response:', data);
    return data.status === 'healthy';
  } catch (error) {
    console.error('AI server health check failed:', error);
    return false;
  }
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

    // Store specific data based on processing method (keep existing logic)
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

    // Get effective model configuration
    const { data: modelId, error: configError } = await supabase
      .rpc('get_effective_model_config', {
        p_user_id: user.id,
        p_deal_id: dealId || null,
        p_use_case: useCase
      });

    if (configError) {
      console.error('Error getting model config:', configError);
      return null;
    }

    if (!modelId) return null;

    // Get model details
    const { data: model, error: modelError } = await supabase
      .from('ai_models')
      .select('*')
      .eq('id', modelId)
      .single();

    if (modelError) {
      console.error('Error getting model details:', modelError);
      return null;
    }

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
    
    // Get authentication headers and user ID
    const { headers: authHeaders, userId } = await getAuthHeaders();
    
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

    console.log('Sending authenticated CIM processing request to AI server...');
    const response = await fetch(`${AI_SERVER_URL}/process-cim`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        // Remove Content-Type to let browser set it for FormData
      },
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
    const { headers: authHeaders, userId } = await getAuthHeaders();
    
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

    const response = await fetch(`${AI_SERVER_URL}/transcribe`, {
      method: 'POST',
      headers: authHeaders,
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
    const { headers: authHeaders, userId } = await getAuthHeaders();
    
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

    const response = await fetch(`${AI_SERVER_URL}/process-excel`, {
      method: 'POST',
      headers: authHeaders,
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
    const { headers: authHeaders, userId } = await getAuthHeaders();
    
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

    const response = await fetch(`${AI_SERVER_URL}/process-document`, {
      method: 'POST',
      headers: authHeaders,
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
    const { headers: authHeaders, userId } = await getAuthHeaders();
    
    if (!userId) {
      return {
        success: false,
        error: 'Authentication required for memo generation'
      };
    }
    
    const response = await fetch(`${AI_SERVER_URL}/generate-memo`, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
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

// Utility function to determine file processing method - keep existing
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

// Main file processing orchestrator - keep existing
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

// Processing status checker (for long-running operations) - keep existing
export async function checkProcessingStatus(jobId: string): Promise<AIResponse> {
  try {
    const response = await fetch(`${AI_SERVER_URL}/status/${jobId}`, {
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
