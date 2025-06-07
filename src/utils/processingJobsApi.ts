
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/supabase';

interface CreateProcessingJobParams {
  dealId: string;
  documentId?: string;
  jobType: string;
  currentStep?: string;
}

interface UpdateProcessingJobParams {
  jobId: string;
  status?: string;
  progress?: number;
  currentStep?: string;
  agentResults?: any;
  errorMessage?: string;
}

export const createProcessingJob = async (params: CreateProcessingJobParams) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('processing_jobs')
      .insert({
        deal_id: params.dealId,
        document_id: params.documentId,
        user_id: user.id,
        job_type: params.jobType,
        status: 'pending',
        current_step: params.currentStep || 'validation',
        progress: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating processing job:', error);
    throw error;
  }
};

export const updateProcessingJob = async (params: UpdateProcessingJobParams) => {
  try {
    const updateData: any = {};
    
    if (params.status !== undefined) updateData.status = params.status;
    if (params.progress !== undefined) updateData.progress = params.progress;
    if (params.currentStep !== undefined) updateData.current_step = params.currentStep;
    if (params.agentResults !== undefined) updateData.agent_results = params.agentResults;
    if (params.errorMessage !== undefined) updateData.error_message = params.errorMessage;
    
    if (params.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('processing_jobs')
      .update(updateData)
      .eq('id', params.jobId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating processing job:', error);
    throw error;
  }
};

export const completeStuckProcessingJobs = async (dealId: string, jobType: string = 'cim_analysis') => {
  try {
    console.log(`Checking for stuck processing jobs for deal ${dealId} and job type ${jobType}`);
    
    // First check if there's a completed CIM analysis for this deal
    const { data: analysis, error: analysisError } = await supabase
      .from('cim_analysis')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (analysisError) {
      console.error('Error checking CIM analysis:', analysisError);
      return null;
    }

    // If we have a completed analysis, mark any stuck processing jobs as completed
    if (analysis && analysis.length > 0) {
      console.log(`Found completed CIM analysis for deal ${dealId}, updating stuck processing jobs`);
      
      // First, check if there are any stuck jobs
      const { data: stuckJobs, error: stuckJobsError } = await supabase
        .from('processing_jobs')
        .select('*')
        .eq('deal_id', dealId)
        .eq('job_type', jobType)
        .in('status', ['pending', 'processing']);

      if (stuckJobsError) {
        console.error('Error checking for stuck jobs:', stuckJobsError);
        return null;
      }

      if (stuckJobs && stuckJobs.length > 0) {
        console.log(`Found ${stuckJobs.length} stuck processing jobs, marking as completed`);
        
        const { data: updatedJobs, error: updateError } = await supabase
          .from('processing_jobs')
          .update({
            status: 'completed',
            progress: 100,
            current_step: 'complete',
            completed_at: new Date().toISOString(),
            error_message: null // Clear any previous error messages
          })
          .eq('deal_id', dealId)
          .eq('job_type', jobType)
          .in('status', ['pending', 'processing'])
          .select();

        if (updateError) {
          console.error('Error updating stuck processing jobs:', updateError);
          return null;
        }

        console.log('Successfully updated stuck processing jobs:', updatedJobs);
        return updatedJobs;
      } else {
        console.log('No stuck processing jobs found');
      }
    } else {
      console.log('No completed CIM analysis found for this deal');
    }

    return null;
  } catch (error) {
    console.error('Error completing stuck processing jobs:', error);
    return null;
  }
};

export const getActiveProcessingJob = async (dealId: string, jobType: string = 'cim_analysis') => {
  try {
    const { data, error } = await supabase
      .from('processing_jobs')
      .select('*')
      .eq('deal_id', dealId)
      .eq('job_type', jobType)
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error getting active processing job:', error);
    return null;
  }
};

export const forceCompleteProcessingJob = async (jobId: string, reason: string = 'Manual completion due to successful analysis') => {
  try {
    console.log(`Force completing processing job ${jobId}: ${reason}`);
    
    const { data, error } = await supabase
      .from('processing_jobs')
      .update({
        status: 'completed',
        progress: 100,
        current_step: 'complete',
        completed_at: new Date().toISOString(),
        error_message: null // Clear any error messages since we're marking as completed
      })
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      console.error('Error force completing processing job:', error);
      throw error;
    }

    console.log('Successfully force completed processing job:', data);
    return data;
  } catch (error) {
    console.error('Error in forceCompleteProcessingJob:', error);
    throw error;
  }
};
