
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { BarChart2, CheckCircle, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";

interface ExcelChunk {
  id: string;
  document_id: string;
  sheet_name: string;
  chunk_label: string;
  data: any;
  verified_by_user: boolean;
  created_at: string;
}

interface ExcelChunksViewProps {
  dealId: string;
}

export function ExcelChunksView({ dealId }: ExcelChunksViewProps) {
  const [chunks, setChunks] = useState<ExcelChunk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExcelChunks();
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
        <Badge variant="outline">
          {chunks.filter(c => c.verified_by_user).length} verified
        </Badge>
      </div>

      <div className="grid gap-4">
        {chunks.map((chunk) => (
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
              <div className="bg-muted/30 rounded-md p-3">
                <pre className="text-xs text-muted-foreground overflow-x-auto">
                  {JSON.stringify(chunk.data, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
