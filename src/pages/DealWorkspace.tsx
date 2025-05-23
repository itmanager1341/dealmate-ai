
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Deal } from "@/types";
import { toast } from "sonner";
import { File, FileText, MessageSquare, BarChart2, FileQuestion, FileEdit } from "lucide-react";

export default function DealWorkspace() {
  const { id } = useParams<{ id: string }>();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("documents");

  useEffect(() => {
    const fetchDeal = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('deals')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          throw error;
        }
        
        setDeal(data);
      } catch (error: any) {
        console.error("Error fetching deal:", error);
        toast.error("Failed to load deal details");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDeal();
  }, [id]);

  if (loading) {
    return (
      <div className="dealmate-content">
        <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto mt-20"></div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="dealmate-content">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Deal not found</h2>
          <p className="text-muted-foreground mb-4">The deal you're looking for doesn't exist or you don't have access to it.</p>
          <Button asChild>
            <a href="/dashboard">Return to Dashboard</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="dealmate-content pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{deal.name}</h1>
          <p className="text-muted-foreground">{deal.company_name} {deal.industry ? `• ${deal.industry}` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button>Run Analysis</Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 w-full justify-start overflow-x-auto">
          <TabsTrigger value="documents" className="flex items-center">
            <File className="h-4 w-4 mr-2" />
            <span>Documents</span>
          </TabsTrigger>
          <TabsTrigger value="transcripts" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            <span>Transcripts</span>
          </TabsTrigger>
          <TabsTrigger value="excel" className="flex items-center">
            <BarChart2 className="h-4 w-4 mr-2" />
            <span>Excel Chunks</span>
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center">
            <BarChart2 className="h-4 w-4 mr-2" />
            <span>Metrics</span>
          </TabsTrigger>
          <TabsTrigger value="agent" className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-2" />
            <span>Agent Query</span>
          </TabsTrigger>
          <TabsTrigger value="memo" className="flex items-center">
            <FileEdit className="h-4 w-4 mr-2" />
            <span>Memo Builder</span>
          </TabsTrigger>
        </TabsList>
        
        <div className="border rounded-md min-h-[calc(100vh-240px)]">
          <TabsContent value="documents" className="p-4 m-0">
            <div className="text-center py-12">
              <FileQuestion className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No documents yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Upload documents to start the analysis</p>
              <Button>Upload Documents</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="transcripts" className="p-4 m-0">
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No transcripts available</h3>
              <p className="text-sm text-muted-foreground mb-4">Upload audio files to generate transcripts</p>
              <Button>Upload Audio</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="excel" className="p-4 m-0">
            <div className="text-center py-12">
              <BarChart2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No Excel data available</h3>
              <p className="text-sm text-muted-foreground mb-4">Upload Excel files to extract data</p>
              <Button>Upload Excel Files</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="metrics" className="p-4 m-0">
            <div className="text-center py-12">
              <BarChart2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No metrics available</h3>
              <p className="text-sm text-muted-foreground mb-4">Run analysis to extract metrics</p>
              <Button>Run Analysis</Button>
            </div>
          </TabsContent>
          
          <TabsContent value="agent" className="p-4 m-0">
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">Agent Query</h3>
              <p className="text-sm text-muted-foreground mb-4">Ask questions about the deal documents</p>
              <div className="max-w-xl mx-auto">
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground mb-4">This feature will be available after uploading and processing documents</p>
                  <Button disabled>Ask Question</Button>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="memo" className="p-4 m-0">
            <div className="text-center py-12">
              <FileEdit className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">Memo Builder</h3>
              <p className="text-sm text-muted-foreground mb-4">Create and edit memos based on the analysis</p>
              <Button disabled>Create Memo</Button>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
