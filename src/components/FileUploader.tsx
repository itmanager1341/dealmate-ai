
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Upload, File, FileText, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { getCurrentUser } from "@/lib/supabase";
import { processFile } from "@/utils/aiApi";

interface FileUploaderProps {
  dealId?: string;
  bucketName: "documents" | "audio" | "exports";
  allowedFileTypes?: string[];
  maxFiles?: number;
  onUploadComplete?: (files: Array<{ path: string; name: string; type: string; size: number }>) => void;
  className?: string;
}

export function FileUploader({
  dealId,
  bucketName,
  allowedFileTypes = [".pdf", ".docx", ".xlsx", ".mp3"],
  maxFiles = 10,
  onUploadComplete,
  className,
}: FileUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (files.length + acceptedFiles.length > maxFiles) {
        toast.error(`You can only upload up to ${maxFiles} files at once.`);
        return;
      }
      
      setFiles((prev) => [...prev, ...acceptedFiles]);
    },
    [files.length, maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: allowedFileTypes.reduce((acc, type) => {
      // Convert from .pdf to application/pdf format
      const mimeType = type === '.pdf' ? { 'application/pdf': [] } :
                       type === '.docx' ? { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [] } :
                       type === '.xlsx' ? { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [] } :
                       type === '.mp3' ? { 'audio/mpeg': [] } :
                       { [type]: [] };
      return { ...acc, ...mimeType };
    }, {}),
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (!dealId) {
      toast.error("Deal ID is required for upload.");
      return;
    }

    if (files.length === 0) {
      toast.error("Please select at least one file to upload.");
      return;
    }

    setUploading(true);
    setProgress(0);

    const uploadedFiles = [];
    const totalFiles = files.length;
    
    try {
      // Get current user to create folder structure
      const user = await getCurrentUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${dealId}/${uuidv4()}.${fileExt}`;

        console.log(`Uploading file ${i + 1}/${totalFiles}: ${file.name}`);

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, file);

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          throw uploadError;
        }

        // Get file type based on extension
        let fileType: 'pdf' | 'docx' | 'xlsx' | 'mp3' = 'pdf';
        if (fileExt === 'docx') fileType = 'docx';
        if (fileExt === 'xlsx') fileType = 'xlsx';
        if (fileExt === 'mp3') fileType = 'mp3';

        // Create document record in the database with the correct column names
        const { data: documentData, error: dbError } = await supabase
          .from('documents')
          .insert({
            deal_id: dealId,
            name: file.name,
            file_path: fileName,
            file_type: fileType,
            size: file.size,
            processed: false,
            uploaded_by: user.id,
            file_name: file.name, // Keep old column for compatibility
            storage_path: fileName, // Keep old column for compatibility
            is_audio: fileExt === 'mp3'
          })
          .select()
          .single();

        if (dbError) {
          console.error("Database insert error:", dbError);
          throw dbError;
        }

        // Start AI processing in the background
        if (documentData) {
          console.log(`Starting AI processing for ${file.name}`);
          processFile(file, dealId).then((result) => {
            if (result.success) {
              console.log(`AI processing completed for ${file.name}`);
              toast.success(`AI analysis completed for ${file.name}`);
            } else {
              console.error(`AI processing failed for ${file.name}:`, result.error);
              toast.error(`AI processing failed for ${file.name}`);
            }
          }).catch((error) => {
            console.error(`AI processing error for ${file.name}:`, error);
          });
        }

        uploadedFiles.push({
          path: fileName,
          name: file.name,
          type: fileType,
          size: file.size
        });

        // Update progress
        setProgress(((i + 1) / totalFiles) * 100);
      }

      toast.success(`Successfully uploaded ${uploadedFiles.length} files.`);
      
      // Call the callback with the uploaded files info
      if (onUploadComplete) {
        onUploadComplete(uploadedFiles);
      }
      
      // Clear the files array
      setFiles([]);
      
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload files. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (extension === 'pdf') return <File className="h-5 w-5 text-red-400" />;
    if (extension === 'docx') return <FileText className="h-5 w-5 text-blue-400" />;
    if (extension === 'xlsx') return <FileText className="h-5 w-5 text-green-400" />;
    if (extension === 'mp3') return <FileText className="h-5 w-5 text-purple-400" />;
    
    return <File className="h-5 w-5" />;
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 transition-colors flex flex-col items-center justify-center cursor-pointer",
          isDragActive ? "border-primary/70 bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30",
          uploading && "opacity-50 pointer-events-none"
        )}
      >
        <input {...getInputProps()} disabled={uploading} />
        
        <div className="flex flex-col items-center justify-center gap-4">
          {isDragActive ? (
            <>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <UploadCloud className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Drop files to upload</p>
                <p className="text-xs text-muted-foreground mt-1">Files will be uploaded immediately</p>
              </div>
            </>
          ) : (
            <>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Drag & drop files here</p>
                <p className="text-xs text-muted-foreground mt-1">
                  or click to browse files
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Supports {allowedFileTypes.join(", ")}
              </p>
            </>
          )}
        </div>
      </div>
      
      {files.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-medium mb-2">Selected Files ({files.length})</div>
          <div className="space-y-2 max-h-60 overflow-y-auto p-1">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-card rounded-md p-2 text-sm border">
                <div className="flex items-center gap-2 overflow-hidden">
                  {getFileIcon(file.name)}
                  <span className="truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          
          <div className="mt-4">
            {uploading ? (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  Uploading... {Math.round(progress)}%
                </p>
              </div>
            ) : (
              <Button onClick={uploadFiles} className="w-full" disabled={files.length === 0}>
                Upload {files.length} {files.length === 1 ? "file" : "files"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
