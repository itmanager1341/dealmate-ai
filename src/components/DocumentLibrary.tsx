
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  FileQuestion
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DocumentLibraryProps {
  dealId: string;
  onDocumentUpdate?: () => void;
}

export function DocumentLibrary({ dealId, onDocumentUpdate }: DocumentLibraryProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchDocuments();
  }, [dealId]);

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

  const getStatusBadge = (processed: boolean) => {
    return (
      <Badge variant={processed ? "default" : "secondary"}>
        {processed ? "Processed" : "Processing"}
      </Badge>
    );
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          </CardTitle>
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
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((document) => (
                <TableRow key={document.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {getFileIcon(document.file_type)}
                      <div>
                        <p className="font-medium">{document.name}</p>
                        {document.classification && (
                          <p className="text-sm text-muted-foreground">
                            {document.classification}
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
                    {getStatusBadge(document.processed)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDistanceToNow(new Date(document.uploaded_at), { addSuffix: true })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(document.file_path, document.name)}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(document.id, document.file_path)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
