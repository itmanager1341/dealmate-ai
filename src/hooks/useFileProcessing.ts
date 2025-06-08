import { useState, useCallback } from 'react';
import { processFile, generateMemo, checkAIServerHealth, AIResponse } from '../utils/aiApi';
import { stopAllProcessingJobsForDeal } from '../utils/processingJobsApi';

export interface ProcessingJob {
  id: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'cancelled';
  result?: any;
  error?: string;
  startTime: Date;
  endTime?: Date;
}

export function useFileProcessing() {
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [isServerHealthy, setIsServerHealthy] = useState<boolean | null>(null);

  // Check AI server health
  const checkHealth = useCallback(async () => {
    const healthy = await checkAIServerHealth();
    setIsServerHealthy(healthy);
    console.log('AI server health check result:', healthy);
    return healthy;
  }, []);

  // Stop all processing for a deal
  const stopProcessingForDeal = useCallback(async (dealId: string): Promise<boolean> => {
    try {
      console.log(`Stopping all processing jobs for deal: ${dealId}`);
      
      // Stop jobs in the database
      await stopAllProcessingJobsForDeal(dealId, 'cim_analysis');
      
      // Update local job states
      setJobs(prev => prev.map(job => 
        job.id.startsWith(dealId) && (job.status === 'pending' || job.status === 'processing')
          ? { 
              ...job, 
              status: 'cancelled' as const,
              error: 'Stopped by user',
              endTime: new Date()
            }
          : job
      ));
      
      console.log('Successfully stopped all processing jobs for deal');
      return true;
    } catch (error) {
      console.error('Error stopping processing for deal:', error);
      return false;
    }
  }, []);

  // Process a single file
  const processFileAsync = useCallback(async (file: File, dealId: string): Promise<string> => {
    const jobId = `${dealId}-${file.name}-${Date.now()}`;
    
    // Check server health before processing
    const serverHealthy = await checkHealth();
    if (!serverHealthy) {
      throw new Error('AI server is offline. Please try again later.');
    }
    
    // Add job to tracking
    const newJob: ProcessingJob = {
      id: jobId,
      fileName: file.name,
      status: 'pending',
      startTime: new Date(),
    };
    
    setJobs(prev => [...prev, newJob]);

    // Update job status to processing
    setJobs(prev => prev.map(job => 
      job.id === jobId 
        ? { ...job, status: 'processing' }
        : job
    ));

    try {
      console.log(`Starting AI processing for ${file.name}`);
      
      // Process the file through AI
      const result = await processFile(file, dealId);
      
      if (result.success) {
        console.log(`AI processing successful for ${file.name}:`, result.data);
        
        // Update job as completed
        setJobs(prev => prev.map(job => 
          job.id === jobId 
            ? { 
                ...job, 
                status: 'completed', 
                result: result.data,
                endTime: new Date()
              }
            : job
        ));
        
        return jobId;
      } else {
        throw new Error(result.error || 'Processing failed');
      }
    } catch (error) {
      console.error(`AI processing failed for ${file.name}:`, error);
      
      // Update job as failed
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { 
              ...job, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Unknown error',
              endTime: new Date()
            }
          : job
      ));
      
      throw error;
    }
  }, [checkHealth]);

  // Process multiple files
  const processFiles = useCallback(async (files: File[], dealId: string): Promise<string[]> => {
    const jobIds: string[] = [];
    
    // Process files sequentially to avoid overwhelming the AI server
    for (const file of files) {
      try {
        const jobId = await processFileAsync(file, dealId);
        jobIds.push(jobId);
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        // Continue processing other files even if one fails
      }
    }
    
    return jobIds;
  }, [processFileAsync]);

  // Generate memo after files are processed
  const generateDealMemo = useCallback(async (dealId: string, sections?: string[]): Promise<AIResponse> => {
    return await generateMemo(dealId, sections);
  }, []);

  // Get jobs for a specific deal
  const getJobsForDeal = useCallback((dealId: string): ProcessingJob[] => {
    return jobs.filter(job => job.id.startsWith(dealId));
  }, [jobs]);

  // Get processing statistics
  const getProcessingStats = useCallback(() => {
    const total = jobs.length;
    const completed = jobs.filter(job => job.status === 'completed').length;
    const processing = jobs.filter(job => job.status === 'processing').length;
    const errors = jobs.filter(job => job.status === 'error').length;
    const cancelled = jobs.filter(job => job.status === 'cancelled').length;
    
    return {
      total,
      completed,
      processing,
      errors,
      cancelled,
      successRate: total > 0 ? (completed / total) * 100 : 0
    };
  }, [jobs]);

  // Clear completed jobs
  const clearCompletedJobs = useCallback(() => {
    setJobs(prev => prev.filter(job => job.status !== 'completed'));
  }, []);

  // Clear all jobs
  const clearAllJobs = useCallback(() => {
    setJobs([]);
  }, []);

  return {
    // State
    jobs,
    isServerHealthy,
    
    // Actions
    checkHealth,
    processFileAsync,
    processFiles,
    generateDealMemo,
    stopProcessingForDeal,
    
    // Utilities
    getJobsForDeal,
    getProcessingStats,
    clearCompletedJobs,
    clearAllJobs,
  };
}
