
// AI API Integration for DealMate Frontend

const AI_SERVER_URL = import.meta.env.VITE_AI_SERVER_URL || 'https://zxjyxzhoz0d2e5-8000.proxy.runpod.net';

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
    const response = await fetch(`${AI_SERVER_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    });
    
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

// Transcribe audio files (MP3, WAV)
export async function transcribeAudio(file: File, dealId: string): Promise<AIResponse> {
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
export async function processExcel(file: File, dealId: string): Promise<AIResponse> {
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
export async function processDocument(file: File, dealId: string): Promise<AIResponse> {
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
export async function processFile(file: File, dealId: string): Promise<AIResponse> {
  const processingMethod = getProcessingMethod(file.name);
  
  switch (processingMethod) {
    case 'audio':
      return await transcribeAudio(file, dealId);
    case 'excel':
      return await processExcel(file, dealId);
    case 'document':
      return await processDocument(file, dealId);
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
