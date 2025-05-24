
import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  Music, 
  CheckCircle, 
  XCircle, 
  Loader,
  Zap,
  Brain
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/supabase';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useFileProcessing } from '../hooks/useFileProcessing';
import { getProcessingMethod } from '../utils/aiApi';

interface AIFileUploadProps {
  dealId: string;
  onProcessingComplete?: (results: any[]) => void;
  maxFiles?: number;
  className?: string;
}

const AIFileUpload: React.FC<AIFileUploadProps> = ({
  dealId,
  onProcessingComplete,
  maxFiles = 10,
  className
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'healthy' | 'error'>('checking');
  const [processingProgress, setProcessingProgress] = useState<{[key: string]: string}>({});
  
  const {
    jobs,
    isServerHealthy,
    checkHealth,
    processFileAsync,
    getProcessingStats
  } = useFileProcessing();

  // Check server health on mount
  useEffect(() => {
    const checkServerHealth = async () => {
      setServerStatus('checking');
      const healthy = await checkHealth();
      setServerStatus(healthy ? 'healthy' : 'error');
    };
    
    checkServerHealth();
  }, [checkHealth]);

  // File drop handler
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.slice(0, maxFiles - uploadedFiles.length);
    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, [uploadedFiles.length, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    },
    maxFiles: maxFiles - uploadedFiles.length,
    disabled: isProcessing || serverStatus !== 'healthy'
  });

  // Save file to database after successful processing
  const saveFileToDatabase = async (file: File, aiResult: any) => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      let fileType: 'pdf' | 'docx' | 'xlsx' | 'mp3' = 'pdf';
      if (fileExt === 'docx') fileType = 'docx';
      if (fileExt === 'xlsx') fileType = 'xlsx';
      if (fileExt === 'mp3') fileType = 'mp3';

      // Create a file path for storage (even though we're not storing in Supabase storage for now)
      const fileName = `${user.id}/${dealId}/${uuidv4()}.${fileExt}`;

      // Insert document record
      const { data: documentData, error: dbError } = await supabase
        .from('documents')
        .insert({
          deal_id: dealId,
          name: file.name,
          file_path: fileName,
          file_type: fileType,
          size: file.size,
          processed: true, // Mark as processed since AI processing is complete
          uploaded_by: user.id,
          classified_as: aiResult?.classification || null
        })
        .select()
        .single();

      if (dbError) {
        console.error("Database insert error:", dbError);
        throw dbError;
      }

      console.log(`File ${file.name} saved to database with ID: ${documentData.id}`);
      return documentData;
    } catch (error) {
      console.error(`Error saving file ${file.name} to database:`, error);
      throw error;
    }
  };

  // Process all uploaded files
  const handleProcessFiles = async () => {
    if (uploadedFiles.length === 0) return;
    
    setIsProcessing(true);
    const processedResults = [];
    const fileProgressKeys = uploadedFiles.map(file => file.name);
    
    // Initialize progress tracking
    const initialProgress: {[key: string]: string} = {};
    fileProgressKeys.forEach(key => {
      initialProgress[key] = 'starting';
    });
    setProcessingProgress(initialProgress);
    
    try {
      console.log(`Starting to process ${uploadedFiles.length} files`);
      
      // Process files one by one to ensure proper database saving
      for (const file of uploadedFiles) {
        try {
          console.log(`Processing file: ${file.name}`);
          setProcessingProgress(prev => ({ ...prev, [file.name]: 'processing' }));
          
          // Process the file through AI
          const jobId = await processFileAsync(file, dealId);
          
          // Wait for this specific job to complete by checking jobs array
          let attempts = 0;
          const maxAttempts = 60; // 60 seconds timeout
          let jobCompleted = false;
          
          while (attempts < maxAttempts && !jobCompleted) {
            // Wait a bit before checking
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Find the job by ID
            const currentJob = jobs.find(j => j.id === jobId);
            
            if (currentJob) {
              if (currentJob.status === 'completed') {
                console.log(`AI processing completed for ${file.name}`);
                setProcessingProgress(prev => ({ ...prev, [file.name]: 'saving' }));
                
                // Save file to database with AI results
                const savedDocument = await saveFileToDatabase(file, currentJob.result);
                processedResults.push({
                  file: file.name,
                  document: savedDocument,
                  aiResult: currentJob.result
                });
                
                setProcessingProgress(prev => ({ ...prev, [file.name]: 'completed' }));
                toast.success(`Successfully processed ${file.name}`);
                jobCompleted = true;
                
              } else if (currentJob.status === 'error') {
                console.error(`AI processing failed for ${file.name}:`, currentJob.error);
                setProcessingProgress(prev => ({ ...prev, [file.name]: 'error' }));
                toast.error(`AI processing failed for ${file.name}: ${currentJob.error}`);
                jobCompleted = true;
              }
            }
            
            attempts++;
          }
          
          if (!jobCompleted) {
            console.error(`Timeout waiting for ${file.name} to process`);
            setProcessingProgress(prev => ({ ...prev, [file.name]: 'timeout' }));
            toast.error(`Processing timeout for ${file.name}`);
          }
          
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          setProcessingProgress(prev => ({ ...prev, [file.name]: 'error' }));
          toast.error(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Call completion callback with results
      if (onProcessingComplete && processedResults.length > 0) {
        onProcessingComplete(processedResults);
      }
      
      // Clear uploaded files after processing
      setUploadedFiles([]);
      setProcessingProgress({});
      
      toast.success(`Processing complete! ${processedResults.length} of ${uploadedFiles.length} files processed successfully.`);
      
    } catch (error) {
      console.error('File processing failed:', error);
      toast.error('File processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Remove file from upload queue
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Get file type icon
  const getFileIcon = (fileName: string) => {
    const method = getProcessingMethod(fileName);
    switch (method) {
      case 'audio': return <Music className="h-4 w-4" />;
      case 'excel': return <FileSpreadsheet className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  // Get processing method badge color
  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case 'audio': return 'bg-blue-100 text-blue-800';
      case 'excel': return 'bg-green-100 text-green-800';
      case 'document': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get progress status badge
  const getProgressBadge = (fileName: string) => {
    const status = processingProgress[fileName];
    switch (status) {
      case 'starting':
        return <Badge variant="secondary">Starting...</Badge>;
      case 'processing':
        return <Badge variant="secondary">Processing...</Badge>;
      case 'saving':
        return <Badge variant="secondary">Saving...</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'timeout':
        return <Badge variant="destructive">Timeout</Badge>;
      default:
        return null;
    }
  };

  const stats = getProcessingStats();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Server Status */}
      <Alert className={serverStatus === 'healthy' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
        <Zap className="h-4 w-4" />
        <AlertDescription>
          AI Server Status: {' '}
          {serverStatus === 'checking' && <Badge variant="secondary">Checking...</Badge>}
          {serverStatus === 'healthy' && <Badge variant="default" className="bg-green-500">Ready</Badge>}
          {serverStatus === 'error' && <Badge variant="destructive">Offline</Badge>}
        </AlertDescription>
      </Alert>

      {/* File Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Document Processing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
              ${serverStatus !== 'healthy' ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
            `}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-blue-600">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Drag & drop deal documents here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Supports: Excel, PDF, Word, Audio files (MP3, WAV)
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Max {maxFiles} files • AI will extract key metrics and insights
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Files Ready for Processing ({uploadedFiles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              {uploadedFiles.map((file, index) => {
                const method = getProcessingMethod(file.name);
                const progressBadge = getProgressBadge(file.name);
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file.name)}
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Badge className={getMethodBadgeColor(method)}>
                        {method === 'audio' && 'Transcription'}
                        {method === 'excel' && 'Financial Analysis'}
                        {method === 'document' && 'Document Analysis'}
                        {method === 'unknown' && 'Unknown Type'}
                      </Badge>
                      {progressBadge}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={isProcessing}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
            
            <Button 
              onClick={handleProcessFiles}
              disabled={isProcessing || serverStatus !== 'healthy'}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Processing with AI...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Process Files with AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Processing Status */}
      {(jobs.length > 0 || Object.keys(processingProgress).length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Processing Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Overall Progress */}
              {stats.total > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span>{stats.completed}/{stats.total} completed</span>
                  </div>
                  <Progress value={(stats.completed / stats.total) * 100} />
                </div>
              )}

              {/* Individual Job Status */}
              <div className="space-y-2">
                {jobs.slice(-5).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      {getFileIcon(job.fileName)}
                      <span className="text-sm font-medium">{job.fileName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {job.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {job.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                      {job.status === 'processing' && <Loader className="h-4 w-4 animate-spin text-blue-500" />}
                      <Badge variant={
                        job.status === 'completed' ? 'default' :
                        job.status === 'error' ? 'destructive' : 'secondary'
                      }>
                        {job.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIFileUpload;
