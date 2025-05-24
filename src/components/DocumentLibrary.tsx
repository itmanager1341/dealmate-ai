import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";
import { Document } from "@/types";
import { toast } from "sonner";
import { 
  FileText, 
  FileSpreadsheet, 
  Music, 
  Download, 
  Trash2, 
  Search,
  Eye,
  Calendar,
  FileQuestion,
  Brain,
  Loader,
  CheckCircle,
  XCircle,
  Zap
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { processFile, checkAIServerHealth } from "../utils/aiApi";

interface DocumentLibraryProps {
  dealId: string;
  onDocumentUpdate?: () => void;
}

export function DocumentLibrary({ dealId, onDocumentUpdate }: DocumentLibraryProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [processingDocs, setProcessingDocs] = useState<Set<string>>(new Set());
  const [isServerHealthy, setIsServerHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    fetchDocuments();
    checkServerHealth();
  }, [dealId]);

  const checkServerHealth = async () => {
    console.log('Checking AI server health...');
    const healthy = await checkAIServerHealth();
    setIsServerHealthy(healthy);
    console.log('AI server health:', healthy);
  };

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
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId: string, filePath: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;

      toast.success("Document deleted successfully");
      fetchDocuments();
      onDocumentUpdate?.();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    }
  };

  const processDocument = async (document: Document) => {
    if (!isServerHealthy) {
      toast.error("AI server is not available");
      return;
    }

    const documentId = document.id;
    setProcessingDocs(prev => new Set(prev).add(documentId));

    try {
      const storageFilePath = document.file_path || document.storage_path;
      if (!storageFilePath) {
        throw new Error("No file path found for document");
      }

      console.log(`Starting AI processing for document: ${document.name || document.file_name}`);
      
      // Download the file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(storageFilePath);

      if (downloadError) {
        console.error("Error downloading file:", downloadError);
        throw downloadError;
      }

      const fileName = document.name || document.file_name || 'unknown';
      const file = new File([fileData], fileName, { 
        type: getFileTypeFromExtension(document.file_type) 
      });

      console.log(`Processing file: ${fileName} (${file.size} bytes)`);
      
      // Call AI processing with document ID to enable data storage
      const result = await processFile(file, dealId, documentId);
      
      if (result.success) {
        console.log(`AI processing successful for ${fileName}:`, result.data);
        
        // Update document as processed in database
        const { error: updateError } = await supabase
          .from('documents')
          .update({ 
            processed: true,
            classified_as: result.data?.classification || 'Processed'
          })
          .eq('id', documentId);

        if (updateError) {
          console.error("Error updating document status:", updateError);
          throw updateError;
        }

        toast.success(`Successfully processed ${fileName} - Data extracted and saved`);
        
        // Refresh documents list
        fetchDocuments();
        onDocumentUpdate?.();
        
      } else {
        console.error(`AI processing failed for ${fileName}:`, result.error);
        throw new Error(result.error || 'Processing failed');
      }
      
    } catch (error) {
      console.error(`Error processing ${document.name || document.file_name}:`, error);
      toast.error(`Failed to process ${document.name || document.file_name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessingDocs(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const processSelectedDocuments = async () => {
    if (selectedDocs.size === 0) {
      toast.error("Please select documents to process");
      return;
    }

    const documentsToProcess = documents.filter(doc => 
      selectedDocs.has(doc.id) && !doc.processed
    );

    if (documentsToProcess.length === 0) {
      toast.error("Selected documents are already processed");
      return;
    }

    for (const document of documentsToProcess) {
      await processDocument(document);
    }

    setSelectedDocs(new Set());
  };

  const getFileTypeFromExtension = (fileType: string): string => {
    switch (fileType) {
      case 'pdf': return 'application/pdf';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'mp3': return 'audio/mpeg';
      default: return 'application/octet-stream';
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'xlsx':
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
      case 'mp3':
        return <Music className="h-5 w-5 text-purple-500" />;
      default:
        return <FileQuestion className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (processed: boolean, isProcessing: boolean) => {
    if (isProcessing) {
      return <Badge variant="secondary"><Loader className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
    }
    return (
      <Badge variant={processed ? "default" : "secondary"}>
        {processed ? "Processed" : "Ready"}
      </Badge>
    );
  };

  const toggleDocumentSelection = (docId: string) => {
    const newSelected = new Set(selectedDocs);
    if (newSelected.has(docId)) {
      newSelected.delete(docId);
    } else {
      newSelected.add(docId);
    }
    setSelectedDocs(newSelected);
  };

  const filteredDocuments = documents.filter(doc => {
    const displayName = doc.name || doc.file_name || '';
    return displayName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const unprocessedCount = documents.filter(doc => !doc.processed).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Library ({documents.length})
            {unprocessedCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unprocessedCount} unprocessed
              </Badge>
            )}
            {isServerHealthy !== null && (
              <Badge variant={isServerHealthy ? "default" : "destructive"} className="ml-2">
                AI Server: {isServerHealthy ? "Online" : "Offline"}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {selectedDocs.size > 0 && (
              <Button
                onClick={processSelectedDocuments}
                disabled={!isServerHealthy}
                size="sm"
                variant="outline"
              >
                <Brain className="h-4 w-4 mr-1" />
                Process Selected ({selectedDocs.size})
              </Button>
            )}
            <div className="flex items-center gap-2 max-w-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {documents.length === 0 ? "No documents uploaded" : "No documents found"}
            </h3>
            <p className="text-muted-foreground">
              {documents.length === 0 
                ? "Upload documents using the form above to get started"
                : "Try adjusting your search terms"
              }
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedDocs.size === filteredDocuments.length && filteredDocuments.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedDocs(new Set(filteredDocuments.map(doc => doc.id)));
                      } else {
                        setSelectedDocs(new Set());
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((document) => {
                const isProcessing = processingDocs.has(document.id);
                const displayName = document.name || document.file_name || 'Unknown';
                const filePath = document.file_path || document.storage_path || '';
                
                return (
                  <TableRow key={document.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedDocs.has(document.id)}
                        onCheckedChange={() => toggleDocumentSelection(document.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getFileIcon(document.file_type)}
                        <div>
                          <p className="font-medium">{displayName}</p>
                          {document.classified_as && (
                            <p className="text-sm text-muted-foreground">
                              {document.classified_as}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase">
                        {document.file_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {document.size ? `${(document.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(document.processed, isProcessing)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDistanceToNow(new Date(document.uploaded_at), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!document.processed && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => processDocument(document)}
                            disabled={isProcessing || !isServerHealthy}
                            title="Process with AI"
                          >
                            {isProcessing ? (
                              <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                              <Brain className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(filePath, displayName)}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(document.id, filePath)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
