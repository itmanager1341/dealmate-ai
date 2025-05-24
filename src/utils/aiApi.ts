
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

    // Store specific data based on processing method
    if (processingMethod === 'excel' && aiResponse.chunks) {
      for (const chunk of aiResponse.chunks) {
        const { error: chunkError } = await supabase
          .from('xlsx_chunks')
          .insert({
            document_id: documentId,
            sheet_name: chunk.sheet_name || 'Unknown',
            chunk_label: chunk.label || 'Data Chunk',
            data: chunk.data,
            verified_by_user: false
          });

        if (chunkError) {
          console.error('Error storing Excel chunk:', chunkError);
        }
      }
      console.log('Successfully stored Excel chunks');
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

    // Extract and store metrics if available
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
          deal_id: dealId
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
