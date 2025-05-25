// AI API Integration for DealMate Frontend

import { supabase } from '@/lib/supabase';

const AI_SERVER_URL = 'https://zxjyxzhoz0d2e5-8000.proxy.runpod.net';

export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
  processing_time?: number;
}

export interface DealFile {
  id: string;
  name: string;
  type: string;
  url: string;
  deal_id: string;
}

// Health check for AI server
export async function checkAIServerHealth(): Promise<boolean> {
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
      const errorText = await response.text();
      console.error('Error response body:', errorText);
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

// Store processing results in database
async function storeProcessingResults(
  file: File, 
  dealId: string, 
  documentId: string, 
  aiResponse: any, 
  processingMethod: string
): Promise<void> {
  console.log('Storing processing results for:', file.name, 'Method:', processingMethod);
  console.log('AI Response data structure:', JSON.stringify(aiResponse, null, 2));
  
  try {
    // Store in ai_outputs table
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

    // Store CIM-specific data
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
      
      // Create a chunk for the raw data preview if available
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
        } else {
          console.log('Successfully stored raw data chunk');
        }
      }

      // Create chunks from AI analysis if available
      if (aiResponse.ai_analysis) {
        try {
          // Try to parse the AI analysis JSON
          const analysisText = aiResponse.ai_analysis;
          let analysisData = null;
          
          // Extract JSON from the analysis text
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
            } else {
              console.log('Successfully stored analysis chunk');
            }

            // Extract and store metrics
            if (analysisData.financial_metrics.revenue) {
              for (const [period, value] of Object.entries(analysisData.financial_metrics.revenue)) {
                if (value !== null && typeof value === 'number') {
                  const { error: metricError } = await supabase
                    .from('deal_metrics')
                    .insert({
                      deal_id: dealId,
                      metric_name: `Revenue ${period}`,
                      metric_value: value,
                      metric_unit: '$',
                      pinned: false
                    });

                  if (metricError) {
                    console.error('Error storing revenue metric:', metricError);
                  }
                }
              }
            }

            if (analysisData.financial_metrics.growth_rate) {
              for (const [period, value] of Object.entries(analysisData.financial_metrics.growth_rate)) {
                if (value !== null && typeof value === 'number') {
                  const { error: metricError } = await supabase
                    .from('deal_metrics')
                    .insert({
                      deal_id: dealId,
                      metric_name: `Growth Rate ${period}`,
                      metric_value: value,
                      metric_unit: '%',
                      pinned: false
                    });

                  if (metricError) {
                    console.error('Error storing growth metric:', metricError);
                  }
                }
              }
            }
          }
        } catch (parseError) {
          console.error('Error parsing AI analysis:', parseError);
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
      } else {
        console.log('Successfully stored transcript');
      }
    }

    // Extract and store metrics if available (general metrics extraction)
    if (aiResponse.metrics && Array.isArray(aiResponse.metrics)) {
      for (const metric of aiResponse.metrics) {
        const { error: metricError } = await supabase
          .from('deal_metrics')
          .insert({
            deal_id: dealId,
            metric_name: metric.name,
            metric_value: metric.value,
            metric_unit: metric.unit || '',
            pinned: false
          });

        if (metricError) {
          console.error('Error storing metric:', metricError);
        }
      }
      console.log('Successfully stored metrics');
    }

    // Log the processing activity
    const { error: logError } = await supabase
      .from('agent_logs')
      .insert({
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

    if (logError) {
      console.error('Error storing agent log:', logError);
    } else {
      console.log('Successfully stored agent log');
    }

  } catch (error) {
    console.error('Error in storeProcessingResults:', error);
    
    // Log the error
    const { error: errorLogError } = await supabase
      .from('agent_logs')
      .insert({
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

    if (errorLogError) {
      console.error('Error storing error log:', errorLogError);
    }
  }
}

// Transcribe audio files (MP3, WAV)
export async function transcribeAudio(file: File, dealId: string, documentId?: string): Promise<AIResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('deal_id', dealId);

    const response = await fetch(`${AI_SERVER_URL}/transcribe`, {
      method: 'POST',
      body: formData,
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Store results in database if documentId is provided
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

// Process Excel files for financial metrics
export async function processExcel(file: File, dealId: string, documentId?: string): Promise<AIResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('deal_id', dealId);

    const response = await fetch(`${AI_SERVER_URL}/process-excel`, {
      method: 'POST',
      body: formData,
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Store results in database if documentId is provided
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

// Process documents (PDF, DOCX) for business analysis
export async function processDocument(file: File, dealId: string, documentId?: string): Promise<AIResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('deal_id', dealId);

    const response = await fetch(`${AI_SERVER_URL}/process-document`, {
      method: 'POST',
      body: formData,
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Store results in database if documentId is provided
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

// Process CIM documents for investment analysis
export async function processCIM(file: File, dealId: string, documentId?: string): Promise<AIResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('deal_id', dealId);

    const response = await fetch(`${AI_SERVER_URL}/process-cim`, {
      method: 'POST',
      body: formData,
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Store results in database if documentId is provided
    if (documentId) {
      await storeProcessingResults(file, dealId, documentId, data, 'cim');
    }

    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('CIM processing failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Generate investment memo from processed data
export async function generateMemo(dealId: string, requestedSections?: string[]): Promise<AIResponse> {
  try {
    const response = await fetch(`${AI_SERVER_URL}/generate-memo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deal_id: dealId,
        sections: requestedSections || ['executive_summary', 'financial_analysis', 'risks', 'recommendation']
      }),
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
