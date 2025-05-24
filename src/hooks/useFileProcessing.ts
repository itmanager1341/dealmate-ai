
// hooks/useFileProcessing.ts
// React hook for managing AI file processing

import { useState, useCallback } from 'react';
import { processFile, generateMemo, checkAIServerHealth, AIResponse } from '../utils/aiApi';

export interface ProcessingJob {
  id: string;
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
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
    return healthy;
  }, []);

  // Process a single file
  const processFileAsync = useCallback(async (file: File, dealId: string): Promise<string> => {
    const jobId = `${dealId}-${file.name}-${Date.now()}`;
    
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
      // Process the file through AI
      const result = await processFile(file, dealId);
      
      if (result.success) {
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
  }, []);

  // Process multiple files
  const processFiles = useCallback(async (files: File[], dealId: string): Promise<string[]> => {
    const promises = files.map(file => processFileAsync(file, dealId));
    return Promise.all(promises);
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
    
    return {
      total,
      completed,
      processing,
      errors,
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
    
    // Utilities
    getJobsForDeal,
    getProcessingStats,
    clearCompletedJobs,
    clearAllJobs,
  };
}
