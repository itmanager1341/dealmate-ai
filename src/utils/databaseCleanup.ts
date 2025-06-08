
import { supabase } from '@/lib/supabase';

export const cleanupOrphanedRecords = async () => {
  try {
    console.log('Cleaning up orphaned records...');
    
    // Clean up processing_jobs with non-existent document_id
    const { data: orphanedJobs, error: jobsError } = await supabase
      .from('processing_jobs')
      .select('id, document_id')
      .not('document_id', 'is', null);

    if (jobsError) {
      console.error('Error fetching processing jobs:', jobsError);
      return;
    }

    if (orphanedJobs && orphanedJobs.length > 0) {
      for (const job of orphanedJobs) {
        // Check if document exists
        const { data: document, error: docError } = await supabase
          .from('documents')
          .select('id')
          .eq('id', job.document_id)
          .single();

        if (docError && docError.code === 'PGRST116') {
          // Document doesn't exist, delete the orphaned job
          console.log(`Deleting orphaned processing job: ${job.id}`);
          await supabase
            .from('processing_jobs')
            .delete()
            .eq('id', job.id);
        }
      }
    }

    // Clean up other tables with potential orphaned records
    const tables = ['ai_outputs', 'agent_logs', 'document_chunks', 'transcripts', 'xlsx_chunks', 'cim_analysis'];
    
    for (const table of tables) {
      try {
        const { data: records, error } = await supabase
          .from(table)
          .select('id, document_id')
          .not('document_id', 'is', null);

        if (error) {
          console.error(`Error fetching ${table}:`, error);
          continue;
        }

        if (records && records.length > 0) {
          for (const record of records) {
            // Check if document exists
            const { data: document, error: docError } = await supabase
              .from('documents')
              .select('id')
              .eq('id', record.document_id)
              .single();

            if (docError && docError.code === 'PGRST116') {
              // Document doesn't exist, delete the orphaned record
              console.log(`Deleting orphaned ${table} record: ${record.id}`);
              await supabase
                .from(table)
                .delete()
                .eq('id', record.id);
            }
          }
        }
      } catch (error) {
        console.error(`Error cleaning up ${table}:`, error);
      }
    }

    console.log('Orphaned records cleanup completed');
  } catch (error) {
    console.error('Error in cleanup process:', error);
  }
};
