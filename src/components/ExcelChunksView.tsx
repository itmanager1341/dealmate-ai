
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { BarChart2, CheckCircle, XCircle, Eye, Link } from "lucide-react";
import { toast } from "sonner";
import type { ExcelChunk, ExcelToChunkLink } from "@/types/chunks";

interface ExcelChunksViewProps {
  dealId: string;
}

export function ExcelChunksView({ dealId }: ExcelChunksViewProps) {
  const [chunks, setChunks] = useState<ExcelChunk[]>([]);
  const [chunkLinks, setChunkLinks] = useState<ExcelToChunkLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExcelChunks();
    fetchChunkLinks();
  }, [dealId]);

  const fetchExcelChunks = async () => {
    try {
      // Get chunks for documents belonging to this deal
      const { data, error } = await supabase
        .from('xlsx_chunks')
        .select(`
          *,
          documents!inner(deal_id, name)
        `)
        .eq('documents.deal_id', dealId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChunks(data || []);
    } catch (error) {
      console.error("Error fetching Excel chunks:", error);
      toast.error("Failed to load Excel data");
    }
  };

  const fetchChunkLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('excel_to_chunk_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChunkLinks(data || []);
    } catch (error) {
      console.error("Error fetching chunk links:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleVerification = async (chunkId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('xlsx_chunks')
        .update({ verified_by_user: !currentStatus })
        .eq('id', chunkId);

      if (error) throw error;
      
      setChunks(prev => prev.map(chunk => 
        chunk.id === chunkId 
          ? { ...chunk, verified_by_user: !currentStatus }
          : chunk
      ));
      
      toast.success(`Chunk ${!currentStatus ? 'verified' : 'unverified'}`);
    } catch (error) {
      console.error("Error updating verification:", error);
      toast.error("Failed to update verification status");
    }
  };

  const getLinkedDocumentChunks = (excelChunkId: string) => {
    return chunkLinks.filter(link => link.xlsx_chunk_id === excelChunkId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (chunks.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-1">No Excel data available</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Process Excel files to extract financial data and metrics
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Excel Data Chunks ({chunks.length})</h3>
        <div className="flex gap-2">
          <Badge variant="outline">
            {chunks.filter(c => c.verified_by_user).length} verified
          </Badge>
          <Badge variant="outline">
            {chunkLinks.length} document links
          </Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {chunks.map((chunk) => {
          const linkedChunks = getLinkedDocumentChunks(chunk.id);
          
          return (
            <Card key={chunk.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {chunk.chunk_label}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {chunk.sheet_name}
                    </Badge>
                    {linkedChunks.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <Link className="h-3 w-3 mr-1" />
                        {linkedChunks.length} links
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleVerification(chunk.id, chunk.verified_by_user)}
                      className="h-8 px-2"
                    >
                      {chunk.verified_by_user ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="data" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="data">Data</TabsTrigger>
                    <TabsTrigger value="links" disabled={linkedChunks.length === 0}>
                      <Link className="h-4 w-4 mr-1" />
                      Links ({linkedChunks.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="data" className="mt-4">
                    <div className="bg-muted/30 rounded-md p-3 max-h-64 overflow-auto">
                      <pre className="text-xs text-muted-foreground">
                        {JSON.stringify(chunk.data, null, 2)}
                      </pre>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="links" className="mt-4">
                    <div className="space-y-2">
                      {linkedChunks.map((link) => (
                        <div key={link.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                          <span className="text-sm">{link.relationship_type}</span>
                          <Badge variant="outline" className="text-xs">
                            {(link.confidence * 100).toFixed(0)}% confidence
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
