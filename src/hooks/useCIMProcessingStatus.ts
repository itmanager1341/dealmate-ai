
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

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
        // Check if this is a recent completion
        const analysisTime = new Date(analysis[0].created_at);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        if (analysisTime > fiveMinutesAgo) {
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
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        if (completionTime > fiveMinutesAgo) {
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
  }, [dealId]);

  const startProcessing = useCallback((jobId: string, fileName: string) => {
    setStatus({
      isProcessing: true,
      progress: 0,
      currentStep: 'validation',
      agentResults: {},
      error: null,
      jobId
    });
  }, []);

  const updateProgress = useCallback((progress: number, step: string, agentResults?: any) => {
    setStatus(prev => ({
      ...prev,
      progress,
      currentStep: step,
      agentResults: agentResults || prev.agentResults
    }));
  }, []);

  const setError = useCallback((error: string) => {
    setStatus(prev => ({
      ...prev,
      isProcessing: false,
      error,
      currentStep: 'error'
    }));
  }, []);

  const reset = useCallback(() => {
    setStatus({
      isProcessing: false,
      progress: 0,
      currentStep: 'validation',
      agentResults: {},
      error: null,
      jobId: null
    });
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    const jobsChannel = supabase
      .channel('processing_jobs_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'processing_jobs',
        filter: `deal_id=eq.${dealId}`
      }, (payload) => {
        console.log('Processing job change:', payload);
        
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const job = payload.new as ProcessingJob;
          if (job.job_type === 'cim_analysis') {
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
        console.log('CIM analysis completed:', payload);
        setStatus(prev => ({
          ...prev,
          isProcessing: false,
          progress: 100,
          currentStep: 'complete',
          error: null
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(jobsChannel);
      supabase.removeChannel(analysisChannel);
    };
  }, [dealId]);

  // Check for existing jobs on mount
  useEffect(() => {
    checkForActiveJobs();
    checkForCompletion();
  }, [checkForActiveJobs, checkForCompletion]);

  return {
    ...status,
    startProcessing,
    updateProgress,
    setError,
    reset,
    checkForCompletion
  };
}
