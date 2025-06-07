import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { completeStuckProcessingJobs, forceCompleteProcessingJob } from '@/utils/processingJobsApi';
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
}

export function useCIMProcessingStatus(dealId: string, documentId?: string) {
  const [status, setStatus] = useState<CIMProcessingStatus>({
    isProcessing: false,
    progress: 0,
    currentStep: 'validation',
    agentResults: {},
    error: null,
    jobId: null
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
          jobId: job.id
        });
      }
    } catch (error) {
      console.error('Error in checkForActiveJobs:', error);
    }
  }, [dealId]);

  const checkForCompletion = useCallback(async () => {
    try {
      // Check for completed CIM analysis
      const { data: analysis, error: analysisError } = await supabase
        .from('cim_analysis')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (analysisError) {
        console.error('Error checking CIM analysis:', analysisError);
        return;
      }

      if (analysis && analysis.length > 0) {
        console.log('Found completed CIM analysis, checking for stuck jobs');
        
        // Check if this is a recent completion (within 10 minutes)
        const analysisTime = new Date(analysis[0].created_at);
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        
        if (analysisTime > tenMinutesAgo) {
          console.log('Recent CIM analysis found, attempting to complete stuck jobs');
          
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
            currentStep: 'complete',
            error: null
          }));
          return true;
        }
      }

      // Check for completed processing jobs
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
        return;
      }

      if (completedJobs && completedJobs.length > 0) {
        const job = completedJobs[0] as ProcessingJob;
        const completionTime = new Date(job.completed_at!);
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        
        if (completionTime > tenMinutesAgo) {
          console.log('Found recently completed processing job');
          setStatus({
            isProcessing: false,
            progress: 100,
            currentStep: 'complete',
            agentResults: job.agent_results || {},
            error: null,
            jobId: job.id
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

  const startProcessing = useCallback((jobId: string, fileName: string) => {
    console.log(`Starting processing for job ${jobId} with file ${fileName}`);
    resetTracking();
    resetErrorState();
    setStatus({
      isProcessing: true,
      progress: 0,
      currentStep: 'validation',
      agentResults: {},
      error: null,
      jobId
    });
  }, [resetTracking, resetErrorState]);

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
      jobId: null
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
            setStatus(prev => ({
              ...prev,
              isProcessing: job.status === 'processing' || job.status === 'pending',
              progress: job.progress || 0,
              currentStep: job.current_step || 'processing',
              agentResults: job.agent_results || {},
              error: job.error_message || null,
              jobId: job.id
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
          currentStep: 'complete',
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
    retryProcessing
  };
}
