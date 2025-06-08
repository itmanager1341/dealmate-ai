
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { completeStuckProcessingJobs, forceCompleteProcessingJob, stopProcessingJob, stopAllProcessingJobsForDeal } from '@/utils/processingJobsApi';
import { useCIMModelTracking } from './useCIMModelTracking';
import { useCIMErrorRecovery } from './useCIMErrorRecovery';

interface ProcessingJob {
  id: string;
  deal_id: string;
  document_id?: string;
  job_type: string;
  status: string;
  progress: number;
  current_step?: string;
  agent_results: any;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

interface CIMProcessingStatus {
  isProcessing: boolean;
  progress: number;
  currentStep: string;
  agentResults: Record<string, any>;
  error: string | null;
  jobId: string | null;
  documentId: string | null;
}

export function useCIMProcessingStatus(dealId: string, documentId?: string) {
  const [status, setStatus] = useState<CIMProcessingStatus>({
    isProcessing: false,
    progress: 0,
    currentStep: 'validation',
    agentResults: {},
    error: null,
    jobId: null,
    documentId: null
  });

  // Initialize tracking and error recovery hooks
  const { trackModelUsage, resetTracking } = useCIMModelTracking(dealId, documentId);
  const { handleError, attemptRecovery, resetErrorState } = useCIMErrorRecovery();

  const checkForActiveJobs = useCallback(async () => {
    try {
      const { data: jobs, error } = await supabase
        .from('processing_jobs')
        .select('*')
        .eq('deal_id', dealId)
        .eq('job_type', 'cim_analysis')
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error checking for active jobs:', error);
        return;
      }

      if (jobs && jobs.length > 0) {
        const job = jobs[0] as ProcessingJob;
        console.log('Found active processing job:', job);
        setStatus({
          isProcessing: true,
          progress: job.progress || 0,
          currentStep: job.current_step || 'processing',
          agentResults: job.agent_results || {},
          error: job.error_message || null,
          jobId: job.id,
          documentId: job.document_id || null
        });
      }
    } catch (error) {
      console.error('Error in checkForActiveJobs:', error);
    }
  }, [dealId]);

  const checkForCompletion = useCallback(async () => {
    try {
      // Check for completed CIM analysis first (this is the real success indicator)
      const { data: analysis, error: analysisError } = await supabase
        .from('cim_analysis')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (analysisError) {
        console.error('Error checking CIM analysis:', analysisError);
        return false;
      }

      if (analysis && analysis.length > 0) {
        console.log('Found completed CIM analysis, checking recency');
        
        // Check if this is a recent completion (within 10 minutes)
        const analysisTime = new Date(analysis[0].created_at);
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        
        if (analysisTime > tenMinutesAgo) {
          console.log('Recent CIM analysis found - marking as completed successfully');
          
          // Try to fix any stuck processing jobs
          await completeStuckProcessingJobs(dealId, 'cim_analysis');
          
          // If we have a current job ID that's still processing, force complete it
          if (status.jobId && status.isProcessing) {
            try {
              await forceCompleteProcessingJob(status.jobId, 'CIM analysis completed successfully');
            } catch (error) {
              console.error('Error force completing job:', error);
            }
          }
          
          setStatus(prev => ({
            ...prev,
            isProcessing: false,
            progress: 100,
            currentStep: 'completed',
            error: null
          }));
          return true;
        }
      }

      // Check for jobs that completed successfully
      const { data: completedJobs, error: jobError } = await supabase
        .from('processing_jobs')
        .select('*')
        .eq('deal_id', dealId)
        .eq('job_type', 'cim_analysis')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1);

      if (jobError) {
        console.error('Error checking completed jobs:', jobError);
        return false;
      }

      if (completedJobs && completedJobs.length > 0) {
        const job = completedJobs[0] as ProcessingJob;
        const completionTime = new Date(job.completed_at!);
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        
        if (completionTime > tenMinutesAgo) {
          console.log('Found recently completed processing job');
          
          // Double check if we actually have analysis results
          const hasAnalysis = analysis && analysis.length > 0;
          
          setStatus({
            isProcessing: false,
            progress: 100,
            currentStep: hasAnalysis ? 'completed' : 'completed_no_results',
            agentResults: job.agent_results || {},
            error: hasAnalysis ? null : 'Processing completed but no analysis results found',
            jobId: job.id,
            documentId: job.document_id || null
          });
          return true;
        }
      }

      // Check for jobs that failed
      const { data: failedJobs, error: failedJobError } = await supabase
        .from('processing_jobs')
        .select('*')
        .eq('deal_id', dealId)
        .eq('job_type', 'cim_analysis')
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!failedJobError && failedJobs && failedJobs.length > 0) {
        const job = failedJobs[0] as ProcessingJob;
        const failureTime = new Date(job.started_at);
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        
        if (failureTime > tenMinutesAgo) {
          console.log('Found recent failed processing job');
          setStatus({
            isProcessing: false,
            progress: 0,
            currentStep: 'failed',
            agentResults: job.agent_results || {},
            error: job.error_message || 'Processing failed',
            jobId: job.id,
            documentId: job.document_id || null
          });
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error in checkForCompletion:', error);
      return false;
    }
  }, [dealId, status.jobId, status.isProcessing]);

  const startProcessing = useCallback((jobId: string, fileName: string, docId?: string) => {
    console.log(`Starting processing for job ${jobId} with file ${fileName}`);
    resetTracking();
    resetErrorState();
    setStatus({
      isProcessing: true,
      progress: 0,
      currentStep: 'validation',
      agentResults: {},
      error: null,
      jobId,
      documentId: docId || null
    });
  }, [resetTracking, resetErrorState]);

  const stopProcessing = useCallback(async () => {
    if (!status.jobId) {
      console.warn('No active job to stop');
      return false;
    }

    try {
      console.log(`Stopping processing job ${status.jobId}`);
      
      // Stop the specific job
      await stopProcessingJob(status.jobId);
      
      // Also stop any other jobs for this deal as a safety measure
      await stopAllProcessingJobsForDeal(dealId, 'cim_analysis');
      
      // Reset the UI state immediately
      setStatus({
        isProcessing: false,
        progress: 0,
        currentStep: 'stopped',
        agentResults: {},
        error: null,
        jobId: null,
        documentId: null
      });
      
      resetTracking();
      resetErrorState();
      
      console.log('Successfully stopped processing');
      return true;
    } catch (error) {
      console.error('Error stopping processing:', error);
      return false;
    }
  }, [status.jobId, dealId, resetTracking, resetErrorState]);

  const updateProgress = useCallback((progress: number, step: string, agentResults?: any) => {
    console.log(`Updating progress: ${progress}% - ${step}`);
    setStatus(prev => ({
      ...prev,
      progress,
      currentStep: step,
      agentResults: agentResults || prev.agentResults
    }));

    // Track model usage for agent results if provided
    if (agentResults && typeof agentResults === 'object') {
      Object.entries(agentResults).forEach(([agentName, result]: [string, any]) => {
        if (result?.status === 'completed' && result?.usage) {
          const usage = result.usage;
          trackModelUsage(
            agentName,
            usage.modelId || 'unknown',
            'cim_analysis',
            usage.inputTokens || 0,
            usage.outputTokens || 0,
            usage.processingTime || 0,
            true
          ).catch(error => {
            console.error('Error tracking model usage:', error);
          });
        }
      });
    }
  }, [trackModelUsage]);

  const setError = useCallback(async (error: string) => {
    console.error('Setting processing error:', error);
    
    // Handle the error through our error recovery system
    const cimError = await handleError(error);
    
    setStatus(prev => ({
      ...prev,
      isProcessing: false,
      error: cimError.message,
      currentStep: 'error'
    }));
  }, [handleError]);

  const retryProcessing = useCallback(async (retryFunction: () => Promise<void>) => {
    if (!status.error) return false;

    const lastError = await handleError(status.error);
    
    const recoverySuccessful = await attemptRecovery(retryFunction, lastError);
    
    if (recoverySuccessful) {
      setStatus(prev => ({
        ...prev,
        error: null,
        currentStep: 'validation',
        progress: 0,
        isProcessing: true
      }));
    }
    
    return recoverySuccessful;
  }, [status.error, handleError, attemptRecovery]);

  const reset = useCallback(() => {
    console.log('Resetting processing status');
    resetTracking();
    resetErrorState();
    setStatus({
      isProcessing: false,
      progress: 0,
      currentStep: 'validation',
      agentResults: {},
      error: null,
      jobId: null,
      documentId: null
    });
  }, [resetTracking, resetErrorState]);

  // Set up real-time subscriptions
  useEffect(() => {
    console.log('Setting up real-time subscriptions for deal:', dealId);
    
    const jobsChannel = supabase
      .channel('processing_jobs_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'processing_jobs',
        filter: `deal_id=eq.${dealId}`
      }, (payload) => {
        console.log('Processing job change received:', payload);
        
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const job = payload.new as ProcessingJob;
          if (job.job_type === 'cim_analysis') {
            console.log('Updating status from real-time event:', job);
            
            // Determine if this is a real success or failure
            const isProcessing = job.status === 'processing' || job.status === 'pending';
            const hasFailed = job.status === 'failed';
            const hasError = job.error_message || hasFailed;
            
            setStatus(prev => ({
              ...prev,
              isProcessing,
              progress: job.progress || 0,
              currentStep: hasFailed ? 'failed' : (job.current_step || 'processing'),
              agentResults: job.agent_results || {},
              error: hasError ? (job.error_message || 'Processing failed') : null,
              jobId: job.id,
              documentId: job.document_id || null
            }));
          }
        }
      })
      .subscribe();

    const analysisChannel = supabase
      .channel('cim_analysis_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'cim_analysis',
        filter: `deal_id=eq.${dealId}`
      }, (payload) => {
        console.log('CIM analysis completed via real-time:', payload);
        
        // When CIM analysis is inserted, mark processing as complete
        setStatus(prev => ({
          ...prev,
          isProcessing: false,
          progress: 100,
          currentStep: 'completed',
          error: null
        }));
        
        // Also try to complete any stuck jobs
        completeStuckProcessingJobs(dealId, 'cim_analysis').then((result) => {
          if (result) {
            console.log('Completed stuck jobs after CIM analysis insertion:', result);
          }
        });
      })
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscriptions');
      supabase.removeChannel(jobsChannel);
      supabase.removeChannel(analysisChannel);
    };
  }, [dealId]);

  // Check for existing jobs and completion status on mount and when dealId changes
  useEffect(() => {
    console.log('Checking for existing jobs and completion status');
    checkForActiveJobs();
    checkForCompletion();
  }, [checkForActiveJobs, checkForCompletion]);

  return {
    ...status,
    startProcessing,
    updateProgress,
    setError,
    reset,
    checkForCompletion,
    retryProcessing,
    stopProcessing
  };
}
