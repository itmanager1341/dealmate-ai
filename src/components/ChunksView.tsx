
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentChunksView } from "./DocumentChunksView";
import { ExcelChunksView } from "./ExcelChunksView";
import { FileText, BarChart2 } from "lucide-react";

interface ChunksViewProps {
  dealId: string;
}

export function ChunksView({ dealId }: ChunksViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Document Analysis Chunks</h2>
        <p className="text-sm text-muted-foreground mb-6">
          View and manage text chunks and structured data extracted from documents for AI processing and analysis.
        </p>
      </div>

      <Tabs defaultValue="document" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="document" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Document Chunks
          </TabsTrigger>
          <TabsTrigger value="excel" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Excel Data
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="document" className="mt-6">
          <DocumentChunksView dealId={dealId} />
        </TabsContent>
        
        <TabsContent value="excel" className="mt-6">
          <ExcelChunksView dealId={dealId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
