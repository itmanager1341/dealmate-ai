
// components/AIFileUpload.tsx
// Enhanced file upload component with AI processing

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
  
  const {
    jobs,
    isServerHealthy,
    checkHealth,
    processFiles,
    generateDealMemo,
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

  // Process all uploaded files
  const handleProcessFiles = async () => {
    if (uploadedFiles.length === 0) return;
    
    setIsProcessing(true);
    try {
      const jobIds = await processFiles(uploadedFiles, dealId);
      console.log('Processing jobs started:', jobIds);
      
      // Optional: Generate memo after processing
      // const memoResult = await generateDealMemo(dealId);
      
      if (onProcessingComplete) {
        const results = jobs.filter(job => 
          jobIds.includes(job.id) && job.status === 'completed'
        ).map(job => job.result);
        onProcessingComplete(results);
      }
    } catch (error) {
      console.error('File processing failed:', error);
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
      {jobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Processing Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Overall Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{stats.completed}/{stats.total} completed</span>
                </div>
                <Progress value={(stats.completed / stats.total) * 100} />
              </div>

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
