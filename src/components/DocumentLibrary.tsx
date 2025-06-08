import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  FileText, 
  Download, 
  Trash2, 
  Play, 
  Brain,
  CheckCircle,
  AlertCircle,
  Clock,
  FileCheck,
  BarChart3,
  FileSpreadsheet,
  Music,
  XCircle
} from "lucide-react";
import { useCIMProcessingStatus } from '@/hooks/useCIMProcessingStatus';
import { CIMProcessingProgress } from './CIMProcessingProgress';
import { processCIM, processExcel, transcribeAudio, processDocument, validateServerURL } from '@/utils/aiApi';
import { Document } from '@/types';

interface DocumentLibraryProps {
  dealId: string;
  onDocumentUpdate?: () => void;
  onCIMAnalysisComplete?: (analysis: any) => void;
}

export function DocumentLibrary({ dealId, onDocumentUpdate, onCIMAnalysisComplete }: DocumentLibraryProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingDocId, setProcessingDocId] = useState<string | null>(null);

  // Use the CIM processing status hook
  const {
    isProcessing,
    progress,
    currentStep,
    error,
    jobId,
    documentId,
    startProcessing,
    stopProcessing,
    reset
  } = useCIMProcessingStatus(dealId);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('deal_id', dealId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [dealId]);

  const cleanupRelatedRecords = async (documentId: string) => {
    try {
      // Clean up orphaned processing jobs first
      await supabase
        .from('processing_jobs')
        .delete()
        .eq('document_id', documentId);

      // Clean up other related records that might not have CASCADE
      const tables = ['ai_outputs', 'agent_logs', 'document_chunks', 'transcripts', 'xlsx_chunks', 'cim_analysis'];
      
      for (const table of tables) {
        await supabase
          .from(table)
          .delete()
          .eq('document_id', documentId);
      }
    } catch (error) {
      console.error(`Error cleaning up related records:`, error);
      // Continue with deletion attempt even if cleanup fails
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      // First clean up related records
      await cleanupRelatedRecords(documentId);

      // Now delete the document
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      toast.success('Document deleted successfully');
      onDocumentUpdate?.();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document. There may be related records preventing deletion.');
    }
  };

  const getCorrectProcessingFunction = (document: Document) => {
    const classification = document.classified_as;
    
    // Route to specific processing functions based on classification
    switch (classification) {
      case 'cim':
        return processCIM;
      case 'financial':
        return processExcel;
      case 'audio':
        return transcribeAudio;
      default:
        return processDocument;
    }
  };

  const handleDocumentAnalysis = async (document: Document) => {
    // Check if server URL is configured before starting
    const urlValidation = validateServerURL();
    if (!urlValidation.isValid) {
      toast.error(urlValidation.error || 'AI server URL not configured. Please configure it in Settings.');
      return;
    }

    if (isProcessing) {
      toast.warning('Another analysis is already in progress');
      return;
    }

    try {
      setProcessingDocId(document.id);
      
      // Start the processing status tracking
      startProcessing(`${dealId}-${document.file_name || document.name}`, document.file_name || document.name, document.id);
      
      // Get the file from Supabase storage using the correct path
      const filePath = document.file_path || document.storage_path;
      if (!filePath) {
        throw new Error('No file path found for document');
      }

      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(filePath);
      
      if (downloadError) {
        console.error('Error downloading file:', downloadError);
        throw new Error('Failed to download file for analysis');
      }
      
      // Create a File object from the downloaded data
      const file = new File([fileData], document.file_name || document.name, { 
        type: document.file_type 
      });
      
      console.log(`Starting analysis for document: ${document.file_name || document.name} (${document.classified_as})`);
      
      // Get the correct processing function based on document classification
      const processingFunction = getCorrectProcessingFunction(document);
      const functionName = processingFunction.name;
      
      console.log(`Using processing function: ${functionName} for classification: ${document.classified_as}`);
      
      // Call the appropriate processing function
      const result = await processingFunction(file, dealId, document.id);
      
      console.log('Processing result:', result);
      
      // Simple success check - trust the processing function result
      if (result.success) {
        console.log('Document analysis completed successfully');
        toast.success(`${document.classified_as?.toUpperCase() || 'Document'} analysis completed successfully!`);
        onCIMAnalysisComplete?.(result.data);
        onDocumentUpdate?.();
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error processing document:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process document analysis';
      
      // Show appropriate error message based on the error type
      if (errorMessage.includes('server URL') || errorMessage.includes('not configured')) {
        toast.error('AI server not configured. Please set up the server URL in Settings.');
      } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        toast.error('AI server is offline or unreachable. Please check the server URL in Settings.');
      } else {
        toast.error(`Analysis failed: ${errorMessage}`);
      }
    } finally {
      setProcessingDocId(null);
      reset(); // Reset the processing status
    }
  };

  const handleStopProcessing = async () => {
    const success = await stopProcessing();
    if (success) {
      toast.success('Processing stopped successfully');
      setProcessingDocId(null);
    } else {
      toast.error('Failed to stop processing');
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes('pdf')) return <FileText className="h-4 w-4" />;
    if (fileType?.includes('image')) return <FileCheck className="h-4 w-4" />;
    if (fileType?.includes('sheet') || fileType?.includes('excel')) return <FileSpreadsheet className="h-4 w-4" />;
    if (fileType?.includes('audio') || fileType?.includes('mp3')) return <Music className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const getClassificationBadge = (classification: string | null) => {
    if (!classification) return null;
    
    const variants: Record<string, string> = {
      'cim': 'bg-purple-100 text-purple-800',
      'financial': 'bg-green-100 text-green-800',
      'legal': 'bg-blue-100 text-blue-800',
      'audio': 'bg-orange-100 text-orange-800',
      'document': 'bg-gray-100 text-gray-800',
      'other': 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={variants[classification] || variants.other}>
        {classification.toUpperCase()}
      </Badge>
    );
  };

  const getProcessingStatusIcon = (docId: string) => {
    if (processingDocId === docId) {
      if (error) {
        return <XCircle className="h-4 w-4 mr-2 text-red-500" />;
      }
      return <Clock className="h-4 w-4 mr-2 animate-spin" />;
    }
    return null;
  };

  const getAnalysisButton = (document: Document) => {
    const classification = document.classified_as;
    const isCurrentlyProcessing = processingDocId === document.id;
    const hasError = isCurrentlyProcessing && error;
    
    // Show appropriate analysis button based on classification
    if (classification === 'cim') {
      return (
        <Button
          onClick={() => handleDocumentAnalysis(document)}
          disabled={isProcessing || isCurrentlyProcessing}
          size="sm"
          className={hasError ? "bg-red-600 hover:bg-red-700" : "bg-purple-600 hover:bg-purple-700"}
        >
          {getProcessingStatusIcon(document.id)}
          {hasError ? 'Failed' : isCurrentlyProcessing ? 'Processing' : 'CIM Analysis'}
          {!isCurrentlyProcessing && !hasError && <Brain className="h-4 w-4 ml-2" />}
        </Button>
      );
    }
    
    if (classification === 'financial') {
      return (
        <Button
          onClick={() => handleDocumentAnalysis(document)}
          disabled={isProcessing || isCurrentlyProcessing}
          size="sm"
          className={hasError ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
        >
          {getProcessingStatusIcon(document.id)}
          {hasError ? 'Failed' : isCurrentlyProcessing ? 'Processing' : 'Financial Analysis'}
          {!isCurrentlyProcessing && !hasError && <BarChart3 className="h-4 w-4 ml-2" />}
        </Button>
      );
    }
    
    if (classification === 'audio') {
      return (
        <Button
          onClick={() => handleDocumentAnalysis(document)}
          disabled={isProcessing || isCurrentlyProcessing}
          size="sm"
          className={hasError ? "bg-red-600 hover:bg-red-700" : "bg-orange-600 hover:bg-orange-700"}
        >
          {getProcessingStatusIcon(document.id)}
          {hasError ? 'Failed' : isCurrentlyProcessing ? 'Processing' : 'Transcription'}
          {!isCurrentlyProcessing && !hasError && <Music className="h-4 w-4 ml-2" />}
        </Button>
      );
    }
    
    // Universal analysis button for any document type
    return (
      <Button
        onClick={() => handleDocumentAnalysis(document)}
        disabled={isProcessing || isCurrentlyProcessing}
        size="sm"
        className={hasError ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
      >
        {getProcessingStatusIcon(document.id)}
        {hasError ? 'Failed' : isCurrentlyProcessing ? 'Processing' : 'AI Analysis'}
        {!isCurrentlyProcessing && !hasError && <Brain className="h-4 w-4 ml-2" />}
      </Button>
    );
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Processing Progress - Show when processing or has error */}
      {(isProcessing || error) && (
        <CIMProcessingProgress
          isProcessing={isProcessing}
          progress={progress}
          currentStep={currentStep}
          fileName={documents.find(d => d.id === documentId)?.file_name || documents.find(d => d.id === documentId)?.name || 'Unknown file'}
          error={error || undefined}
          dealId={dealId}
          documentId={documentId || undefined}
          onStop={handleStopProcessing}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Library
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No documents uploaded</h3>
              <p className="text-muted-foreground">Upload documents to get started with analysis</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    {getFileIcon(doc.file_type)}
                    <div className="flex-1">
                      <h4 className="font-medium">{doc.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">
                          {formatFileSize(doc.size)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(doc.uploaded_at).toLocaleDateString()}
                        </span>
                        {getClassificationBadge(doc.classified_as)}
                        {doc.processed && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Processed
                          </Badge>
                        )}
                        {processingDocId === doc.id && error && (
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            <XCircle className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getAnalysisButton(doc)}
                    
                    <Button
                      onClick={() => handleDelete(doc.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      disabled={processingDocId === doc.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
