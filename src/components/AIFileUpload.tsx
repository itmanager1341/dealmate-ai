
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
  Zap
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/supabase';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { getProcessingMethod } from '../utils/aiApi';

interface AIFileUploadProps {
  dealId: string;
  onUploadComplete?: (results: any[]) => void;
  maxFiles?: number;
  className?: string;
}

const AIFileUpload: React.FC<AIFileUploadProps> = ({
  dealId,
  onUploadComplete,
  maxFiles = 10,
  className
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});

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
    disabled: isUploading
  });

  // Upload files to storage and database immediately
  const handleUploadFiles = async () => {
    if (uploadedFiles.length === 0) return;
    
    setIsUploading(true);
    const uploadedResults = [];
    
    try {
      console.log(`Starting to upload ${uploadedFiles.length} files`);
      
      // Get current user
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Upload files one by one
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const fileName = `${user.id}/${dealId}/${uuidv4()}.${fileExt}`;
        
        console.log(`Uploading file ${i + 1}/${uploadedFiles.length}: ${file.name}`);
        
        // Update progress
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        try {
          // Upload to Supabase storage
          const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(fileName, file);

          if (uploadError) {
            console.error("Storage upload error:", uploadError);
            throw uploadError;
          }

          // Update progress
          setUploadProgress(prev => ({ ...prev, [file.name]: 50 }));

          // Determine file type
          let fileType: 'pdf' | 'docx' | 'xlsx' | 'mp3' = 'pdf';
          if (fileExt === 'docx') fileType = 'docx';
          if (fileExt === 'xlsx') fileType = 'xlsx';
          if (fileExt === 'mp3') fileType = 'mp3';

          // Save to database immediately (populate both legacy and current columns)
          const { data: documentData, error: dbError } = await supabase
            .from('documents')
            .insert({
              deal_id: dealId,
              // Current columns
              name: file.name,
              file_path: fileName,
              // Legacy columns (for backward compatibility)
              file_name: file.name,
              storage_path: fileName,
              file_type: fileType,
              size: file.size,
              processed: false,
              uploaded_by: user.id
            })
            .select()
            .single();

          if (dbError) {
            console.error("Database insert error:", dbError);
            throw dbError;
          }

          // Update progress
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
          
          uploadedResults.push({
            file: file.name,
            document: documentData
          });
          
          console.log(`Successfully uploaded ${file.name}`);
          toast.success(`Uploaded ${file.name}`);
          
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          toast.error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      // Call completion callback with results
      if (onUploadComplete && uploadedResults.length > 0) {
        onUploadComplete(uploadedResults);
      }
      
      // Clear uploaded files after processing
      setUploadedFiles([]);
      setUploadProgress({});
      
      toast.success(`Upload complete! ${uploadedResults.length} of ${uploadedFiles.length} files uploaded successfully.`);
      
    } catch (error) {
      console.error('File upload failed:', error);
      toast.error('File upload failed');
    } finally {
      setIsUploading(false);
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

  // Get upload progress badge
  const getProgressBadge = (fileName: string) => {
    const progress = uploadProgress[fileName];
    if (progress === undefined) return null;
    if (progress === 100) return <Badge variant="default" className="bg-green-500">Uploaded</Badge>;
    return <Badge variant="secondary">Uploading... {progress}%</Badge>;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Document Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
              ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
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
                  Max {maxFiles} files • Files will be uploaded immediately to library
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
            <CardTitle className="text-lg">Files Ready for Upload ({uploadedFiles.length})</CardTitle>
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
                        {method === 'audio' && 'Audio File'}
                        {method === 'excel' && 'Spreadsheet'}
                        {method === 'document' && 'Document'}
                        {method === 'unknown' && 'Unknown Type'}
                      </Badge>
                      {progressBadge}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
            
            <Button 
              onClick={handleUploadFiles}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Uploading Files...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Files to Library
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIFileUpload;
