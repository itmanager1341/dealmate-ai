
import { supabase } from '@/lib/supabase';

// Auto-classify documents based on filename and type
export const classifyDocument = (fileName: string, fileType: string): string => {
  const name = fileName.toLowerCase();
  const type = fileType.toLowerCase();
  
  // CIM documents
  if (name.includes('cim') || name.includes('confidential information memorandum')) {
    return 'cim';
  }
  
  // Financial documents
  if (type.includes('sheet') || type.includes('excel') || type.includes('csv') ||
      name.includes('financial') || name.includes('model') || name.includes('projection')) {
    return 'financial';
  }
  
  // Audio files
  if (type.includes('audio') || type.includes('mp3') || type.includes('wav')) {
    return 'audio';
  }
  
  // Legal documents
  if (name.includes('legal') || name.includes('contract') || name.includes('agreement')) {
    return 'legal';
  }
  
  // Default to document for PDFs and Word docs
  if (type.includes('pdf') || type.includes('word') || type.includes('docx')) {
    return 'document';
  }
  
  return 'other';
};

// Fix existing unclassified documents
export const fixExistingDocuments = async (dealId: string) => {
  try {
    console.log('Checking for unclassified documents...');
    
    // Get all documents with null classified_as
    const { data: documents, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('deal_id', dealId)
      .is('classified_as', null);

    if (fetchError) {
      console.error('Error fetching documents:', fetchError);
      return;
    }

    if (!documents || documents.length === 0) {
      console.log('No unclassified documents found');
      return;
    }

    console.log(`Found ${documents.length} unclassified documents, fixing...`);

    // Update each document with proper classification
    for (const doc of documents) {
      const classification = classifyDocument(doc.name || doc.file_name || '', doc.file_type || '');
      
      const { error: updateError } = await supabase
        .from('documents')
        .update({ classified_as: classification })
        .eq('id', doc.id);

      if (updateError) {
        console.error(`Error updating document ${doc.id}:`, updateError);
      } else {
        console.log(`Updated document "${doc.name}" classification to: ${classification}`);
      }
    }

    console.log('Finished fixing document classifications');
  } catch (error) {
    console.error('Error in fixExistingDocuments:', error);
  }
};
