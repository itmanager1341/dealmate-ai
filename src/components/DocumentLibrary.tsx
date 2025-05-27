import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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
  Zap,
  Award,
  TrendingUp,
  Star
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { processFile, processCIM, checkAIServerHealth } from "../utils/aiApi";
import { EnhancedCIMProcessingProgress } from "./EnhancedCIMProcessingProgress";
import { useCIMProcessingStatus } from "../hooks/useCIMProcessingStatus";
import { createProcessingJob, updateProcessingJob } from "../utils/processingJobsApi";

interface DocumentLibraryProps {
  dealId: string;
  onDocumentUpdate?: () => void;
  onCIMAnalysisComplete?: (analysis: any) => void;
}

export function DocumentLibrary({ dealId, onDocumentUpdate, onCIMAnalysisComplete }: DocumentLibraryProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [processingDocs, setProcessingDocs] = useState<Set<string>>(new Set());
  const [isServerHealthy, setIsServerHealthy] = useState<boolean | null>(null);
  const [processingProgress, setProcessingProgress] = useState<Map<string, number>>(new Map());
  
  // Use the new CIM processing status hook
  const cimProcessingStatus = useCIMProcessingStatus(dealId);

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

  const simulateProgress = (documentId: string, isCompleted: (id: string) => boolean) => {
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        const newMap = new Map(prev);
        const current = newMap.get(documentId) || 0;
        
        if (isCompleted(documentId) || current >= 90) {
          clearInterval(interval);
          if (isCompleted(documentId)) {
            newMap.set(documentId, 100);
            setTimeout(() => {
              setProcessingProgress(prev => {
                const updated = new Map(prev);
                updated.delete(documentId);
                return updated;
              });
            }, 2000);
          }
          return newMap;
        }
        
        newMap.set(documentId, Math.min(current + 15, 90));
        return newMap;
      });
    }, 2000);
  };

  const handleDelete = async (documentId: string, filePath: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    console.log(`Attempting to delete document ${documentId} with file path: ${filePath}`);

    try {
      // Delete related records from various tables
      const { error: aiOutputsError } = await supabase
        .from('ai_outputs')
        .delete()
        .eq('document_id', documentId);

      if (aiOutputsError) {
        console.error("Error deleting AI outputs:", aiOutputsError);
        toast.warning("Failed to delete AI outputs, but continuing with document deletion");
      }

      const { error: cimError } = await supabase
        .from('cim_analysis')
        .delete()
        .eq('document_id', documentId);

      if (cimError) {
        console.error("Error deleting CIM analysis:", cimError);
        toast.warning("Failed to delete CIM analysis, but continuing with document deletion");
      }

      // Delete from storage if file path exists
      if (filePath && filePath.trim() !== '') {
        console.log(`Deleting file from storage: ${filePath}`);
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([filePath]);

        if (storageError) {
          console.error("Storage deletion error:", storageError);
          toast.warning("File may not exist in storage, but will remove database record");
        }
      }

      // Delete document record
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
      toast.error(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  const isPotentialCIM = (document: Document): boolean => {
    const fileName = document.name || document.file_name || '';
    const fileSize = document.size || 0;
    
    if (document.file_type !== 'pdf') return false;
    
    const cimKeywords = ['cim', 'confidential information memorandum', 'investment memo', 'offering memo'];
    const hasKeyword = cimKeywords.some(keyword => 
      fileName.toLowerCase().includes(keyword)
    );
    
    const isLargeEnough = fileSize > 2 * 1024 * 1024; // 2MB
    
    return hasKeyword || isLargeEnough;
  };

  const processDocument = async (document: Document) => {
    if (!isServerHealthy) {
      toast.error("AI server is not available");
      return;
    }

    const documentId = document.id;
    setProcessingDocs(prev => new Set(prev).add(documentId));
    simulateProgress(documentId, (id) => !processingDocs.has(id));

    try {
      const storageFilePath = document.file_path || document.storage_path;
      if (!storageFilePath) {
        throw new Error("No file path found for document");
      }

      console.log(`Starting AI processing for document: ${document.name || document.file_name}`);
      
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(storageFilePath);

      if (downloadError) throw downloadError;

      const fileName = document.name || document.file_name || 'unknown';
      const file = new File([fileData], fileName, { 
        type: getFileTypeFromExtension(document.file_type) 
      });

      const result = await processFile(file, dealId, documentId);
      
      if (result.success) {
        const { error: updateError } = await supabase
          .from('documents')
          .update({ 
            processed: true,
            classified_as: result.data?.classification || 'Processed'
          })
          .eq('id', documentId);

        if (updateError) throw updateError;

        toast.success(`Successfully processed ${fileName}`);
        fetchDocuments();
        onDocumentUpdate?.();
      } else {
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

  const processCIMDocument = async (document: Document) => {
    if (!isServerHealthy) {
      toast.error("AI server is not available");
      return;
    }

    const documentId = document.id;
    const fileName = document.name || document.file_name || 'unknown';
    
    try {
      // Create processing job in database
      const processingJob = await createProcessingJob({
        dealId,
        documentId,
        jobType: 'cim_analysis',
        currentStep: 'validation'
      });

      // Start processing status
      cimProcessingStatus.startProcessing(processingJob.id, fileName);
      
      const storageFilePath = document.file_path || document.storage_path;
      if (!storageFilePath) {
        throw new Error("No file path found for document");
      }

      // Update job to processing status
      await updateProcessingJob({
        jobId: processingJob.id,
        status: 'processing',
        currentStep: 'validation',
        progress: 10
      });

      console.log(`Starting CIM analysis for document: ${fileName}`);
      toast.info("Starting comprehensive CIM analysis...", { duration: 3000 });
      
      // Download file
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(storageFilePath);

      if (downloadError) throw downloadError;

      // Update progress
      await updateProcessingJob({
        jobId: processingJob.id,
        currentStep: 'analysis',
        progress: 20
      });

      const file = new File([fileData], fileName, { type: 'application/pdf' });
      
      // Call CIM processing
      const result = await processCIM(file, dealId, documentId);
      
      if (result.success && result.data) {
        console.log(`CIM processing successful for ${fileName}:`, result.data);
        
        // Update job to storage phase
        await updateProcessingJob({
          jobId: processingJob.id,
          currentStep: 'storage',
          progress: 85,
          agentResults: result.data.results_summary || {}
        });
        
        // Update document status
        const { error: updateError } = await supabase
          .from('documents')
          .update({ 
            processed: true,
            classified_as: 'CIM Analysis'
          })
          .eq('id', documentId);

        if (updateError) throw updateError;

        // Complete the job
        await updateProcessingJob({
          jobId: processingJob.id,
          status: 'completed',
          currentStep: 'complete',
          progress: 100
        });

        // Handle response structure
        const analysisData = result.data.parsed_analysis || result.data.analysis || result.data;
        const grade = analysisData?.investment_grade || 'N/A';
        const recommendation = analysisData?.recommendation?.action || 'N/A';
        
        toast.success(
          `CIM analysis complete! Investment Grade: ${grade}, Recommendation: ${recommendation}`,
          { duration: 5000 }
        );
        
        if (onCIMAnalysisComplete && analysisData) {
          onCIMAnalysisComplete(analysisData);
        }
        
        fetchDocuments();
        onDocumentUpdate?.();
        
      } else {
        throw new Error(result.error || 'CIM processing failed');
      }
      
    } catch (error) {
      console.error(`Error processing CIM ${fileName}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update job with error
      if (cimProcessingStatus.jobId) {
        await updateProcessingJob({
          jobId: cimProcessingStatus.jobId,
          status: 'failed',
          errorMessage
        });
      }
      
      cimProcessingStatus.setError(errorMessage);
      toast.error(`Failed to process CIM ${fileName}: ${errorMessage}`);
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

  const getStatusBadge = (processed: boolean, isProcessing: boolean, classified_as?: string, documentId?: string) => {
    const progress = processingProgress.get(documentId || '');
    
    if (isProcessing && progress !== undefined) {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-blue-50 text-blue-700">
            <Loader className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
          <div className="flex items-center gap-1 min-w-[60px]">
            <Progress value={progress} className="h-2 w-12" />
            <span className="text-xs text-muted-foreground">{progress}%</span>
          </div>
        </div>
      );
    }
    
    if (classified_as === 'CIM Analysis') {
      return (
        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
          <Award className="h-3 w-3 mr-1" />
          CIM Analyzed
        </Badge>
      );
    }
    
    if (processed) {
      return (
        <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Processed
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="text-muted-foreground">
        Ready
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
  const cimCount = documents.filter(doc => isPotentialCIM(doc)).length;
  const processedCIMCount = documents.filter(doc => doc.classified_as === 'CIM Analysis').length;
  const processingCount = processingDocs.size + (cimProcessingStatus.isProcessing ? 1 : 0);

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
    <div className="space-y-6">
      {/* Enhanced CIM Processing Progress */}
      {cimProcessingStatus.isProcessing && (
        <EnhancedCIMProcessingProgress
          isProcessing={cimProcessingStatus.isProcessing}
          progress={cimProcessingStatus.progress}
          currentStep={cimProcessingStatus.currentStep}
          fileName="CIM Document"
          error={cimProcessingStatus.error}
          agentResults={cimProcessingStatus.agentResults}
        />
      )}

      {/* CIM Analytics Dashboard - Only show if CIMs detected */}
      {cimCount > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Brain className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-700">{cimCount}</p>
              <p className="text-sm text-purple-600">CIMs Detected</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-700">{processingCount}</p>
              <p className="text-sm text-blue-600">Processing</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-700">{processedCIMCount}</p>
              <p className="text-sm text-green-600">Analyzed</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-700">
                {processedCIMCount > 0 ? Math.round((processedCIMCount / cimCount) * 100) : 0}%
              </p>
              <p className="text-sm text-orange-600">Success Rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Document Library */}
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
                  const potentialCIM = isPotentialCIM(document);
                  
                  return (
                    <TableRow key={document.id} className="hover:bg-muted/50">
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
                            <div className="flex items-center gap-2">
                              {document.classified_as && (
                                <p className="text-sm text-muted-foreground">
                                  {document.classified_as}
                                </p>
                              )}
                              {potentialCIM && document.classified_as !== 'CIM Analysis' && (
                                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                  <Brain className="h-3 w-3 mr-1" />
                                  Potential CIM
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase text-xs">
                          {document.file_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {document.size ? `${(document.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(document.processed, isProcessing, document.classified_as, document.id)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDistanceToNow(new Date(document.uploaded_at), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!document.processed && potentialCIM && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => processCIMDocument(document)}
                              disabled={cimProcessingStatus.isProcessing || !isServerHealthy}
                              title="Process as CIM"
                              className="hover:bg-purple-50 hover:text-purple-600"
                            >
                              {cimProcessingStatus.isProcessing ? (
                                <Loader className="h-4 w-4 animate-spin" />
                              ) : (
                                <Award className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          {!document.processed && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => processDocument(document)}
                              disabled={isProcessing || !isServerHealthy}
                              title="Process with AI"
                              className="hover:bg-blue-50 hover:text-blue-600"
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
                            className="hover:bg-gray-50"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(document.id, filePath)}
                            title="Delete"
                            className="hover:bg-red-50 hover:text-red-600"
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
    </div>
  );
}
