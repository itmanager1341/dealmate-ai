
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Search,
  Filter,
  Brain,
  Link,
  Book
} from "lucide-react";
import { toast } from "sonner";
import type { DocumentChunk, ChunkRelationship, ExcelToChunkLink } from "@/types/chunks";

interface DocumentChunksViewProps {
  dealId: string;
}

export function DocumentChunksView({ dealId }: DocumentChunksViewProps) {
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [relationships, setRelationships] = useState<ChunkRelationship[]>([]);
  const [excelLinks, setExcelLinks] = useState<ExcelToChunkLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [processedFilter, setProcessedFilter] = useState("all");

  useEffect(() => {
    fetchDocumentChunks();
    fetchRelationships();
    fetchExcelLinks();
  }, [dealId]);

  const fetchDocumentChunks = async () => {
    try {
      const { data, error } = await supabase
        .from('document_chunks')
        .select('*')
        .eq('deal_id', dealId)
        .order('document_id', { ascending: true })
        .order('chunk_index', { ascending: true });

      if (error) throw error;
      setChunks(data || []);
    } catch (error) {
      console.error("Error fetching document chunks:", error);
      toast.error("Failed to load document chunks");
    }
  };

  const fetchRelationships = async () => {
    try {
      const { data, error } = await supabase
        .from('chunk_relationships')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRelationships(data || []);
    } catch (error) {
      console.error("Error fetching chunk relationships:", error);
    }
  };

  const fetchExcelLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('excel_to_chunk_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExcelLinks(data || []);
    } catch (error) {
      console.error("Error fetching excel links:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProcessed = async (chunkId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('document_chunks')
        .update({ processed_by_ai: !currentStatus })
        .eq('id', chunkId);

      if (error) throw error;
      
      setChunks(prev => prev.map(chunk => 
        chunk.id === chunkId 
          ? { ...chunk, processed_by_ai: !currentStatus }
          : chunk
      ));
      
      toast.success(`Chunk ${!currentStatus ? 'marked as processed' : 'marked as unprocessed'}`);
    } catch (error) {
      console.error("Error updating processed status:", error);
      toast.error("Failed to update processed status");
    }
  };

  const filteredChunks = chunks.filter(chunk => {
    const matchesSearch = chunk.chunk_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chunk.section_title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSection = sectionFilter === "all" || chunk.section_type === sectionFilter;
    const matchesProcessed = processedFilter === "all" || 
                            (processedFilter === "processed" && chunk.processed_by_ai) ||
                            (processedFilter === "unprocessed" && !chunk.processed_by_ai);
    
    return matchesSearch && matchesSection && matchesProcessed;
  });

  const getSectionTypes = () => {
    const types = [...new Set(chunks.map(c => c.section_type).filter(Boolean))];
    return types;
  };

  const getChunkRelationships = (chunkId: string) => {
    return relationships.filter(rel => 
      rel.parent_chunk_id === chunkId || rel.child_chunk_id === chunkId
    );
  };

  const getExcelLinks = (chunkId: string) => {
    return excelLinks.filter(link => link.document_chunk_id === chunkId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Document Chunks ({chunks.length})</h3>
        <div className="flex gap-2">
          <Badge variant="outline">
            {chunks.filter(c => c.processed_by_ai).length} processed
          </Badge>
          <Badge variant="outline">
            {relationships.length} relationships
          </Badge>
          <Badge variant="outline">
            {excelLinks.length} excel links
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search chunks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={sectionFilter} onValueChange={setSectionFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sections</SelectItem>
            {getSectionTypes().map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={processedFilter} onValueChange={setProcessedFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All chunks</SelectItem>
            <SelectItem value="processed">Processed</SelectItem>
            <SelectItem value="unprocessed">Unprocessed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredChunks.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">No document chunks found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Process documents to create chunks for analysis
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredChunks.map((chunk) => {
            const chunkRelationships = getChunkRelationships(chunk.id);
            const chunkExcelLinks = getExcelLinks(chunk.id);
            
            return (
              <Card key={chunk.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-sm font-medium">
                          Chunk #{chunk.chunk_index}
                        </CardTitle>
                        {chunk.section_type && (
                          <Badge variant="outline" className="text-xs">
                            {chunk.section_type}
                          </Badge>
                        )}
                        {chunk.section_title && (
                          <Badge variant="secondary" className="text-xs">
                            {chunk.section_title}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{chunk.chunk_size} chars</span>
                        {chunk.start_page && (
                          <span>Pages {chunk.start_page}-{chunk.end_page}</span>
                        )}
                        {chunk.confidence_score && (
                          <span>Confidence: {(chunk.confidence_score * 100).toFixed(0)}%</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {chunkRelationships.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Link className="h-3 w-3 mr-1" />
                          {chunkRelationships.length}
                        </Badge>
                      )}
                      {chunkExcelLinks.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Book className="h-3 w-3 mr-1" />
                          {chunkExcelLinks.length}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleProcessed(chunk.id, chunk.processed_by_ai)}
                        className="h-8 px-2"
                      >
                        {chunk.processed_by_ai ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Tabs defaultValue="content" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="content">Content</TabsTrigger>
                      <TabsTrigger value="ai" disabled={!chunk.ai_output}>
                        <Brain className="h-4 w-4 mr-1" />
                        AI Output
                      </TabsTrigger>
                      <TabsTrigger value="relationships" disabled={chunkRelationships.length === 0}>
                        <Link className="h-4 w-4 mr-1" />
                        Relations
                      </TabsTrigger>
                      <TabsTrigger value="metadata">Metadata</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="content" className="mt-4">
                      <div className="bg-muted/30 rounded-md p-3 max-h-64 overflow-y-auto">
                        <p className="text-sm whitespace-pre-wrap">{chunk.chunk_text}</p>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="ai" className="mt-4">
                      {chunk.ai_output && (
                        <div className="bg-muted/30 rounded-md p-3 max-h-64 overflow-y-auto">
                          <pre className="text-xs text-muted-foreground">
                            {JSON.stringify(chunk.ai_output, null, 2)}
                          </pre>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="relationships" className="mt-4">
                      <div className="space-y-2">
                        {chunkRelationships.map((rel) => (
                          <div key={rel.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                            <span className="text-sm">{rel.relationship_type}</span>
                            <Badge variant="outline" className="text-xs">
                              {(rel.strength * 100).toFixed(0)}%
                            </Badge>
                          </div>
                        ))}
                        {chunkExcelLinks.map((link) => (
                          <div key={link.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                            <span className="text-sm">Excel: {link.relationship_type}</span>
                            <Badge variant="outline" className="text-xs">
                              {(link.confidence * 100).toFixed(0)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="metadata" className="mt-4">
                      <div className="bg-muted/30 rounded-md p-3 max-h-64 overflow-y-auto">
                        <pre className="text-xs text-muted-foreground">
                          {JSON.stringify(chunk.metadata, null, 2)}
                        </pre>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
