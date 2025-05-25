
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { supabase } from "@/lib/supabase";
import { Deal } from "@/types";
import { toast } from "sonner";
import { File, FileText, MessageSquare, BarChart2, FileQuestion, FileEdit, ChevronLeft, Award } from "lucide-react";
import AIFileUpload from "@/components/AIFileUpload";
import { DocumentLibrary } from "@/components/DocumentLibrary";
import { ExcelChunksView } from "@/components/ExcelChunksView";
import { TranscriptsView } from "@/components/TranscriptsView";
import { MetricsView } from "@/components/MetricsView";
import { CIMAnalysisDisplay } from "@/components/CIMAnalysisDisplay";

export default function DealWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("documents");
  const [documentUpdateTrigger, setDocumentUpdateTrigger] = useState(0);
  const [hasCIMAnalysis, setHasCIMAnalysis] = useState(false);

  useEffect(() => {
    const fetchDeal = async () => {
      if (!id) {
        navigate("/dashboard");
        return;
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        console.error("Invalid deal ID format:", id);
        toast.error("Invalid deal ID");
        navigate("/dashboard");
        return;
      }
      
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
        
        // Check if this deal has CIM analysis
        checkForCIMAnalysis(id);
      } catch (error: any) {
        console.error("Error fetching deal:", error);
        toast.error("Failed to load deal details");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDeal();
  }, [id, navigate]);

  const checkForCIMAnalysis = async (dealId: string) => {
    try {
      const { data, error } = await supabase
        .from('cim_analysis')
        .select('id')
        .eq('deal_id', dealId)
        .limit(1);

      if (error) {
        console.error("Error checking for CIM analysis:", error);
        return;
      }

      setHasCIMAnalysis(data && data.length > 0);
    } catch (error) {
      console.error("Error checking for CIM analysis:", error);
    }
  };

  const handleDocumentUpdate = () => {
    setDocumentUpdateTrigger(prev => prev + 1);
    // Re-check for CIM analysis when documents are updated
    if (deal?.id) {
      checkForCIMAnalysis(deal.id);
    }
  };

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
            <Link to="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="dealmate-content pb-0">
      {/* Breadcrumb Navigation */}
      <div className="mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{deal.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
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
          {hasCIMAnalysis && (
            <TabsTrigger value="cim-analysis" className="flex items-center">
              <Award className="h-4 w-4 mr-2" />
              <span>CIM Analysis</span>
            </TabsTrigger>
          )}
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
          <TabsContent value="documents" className="p-4 m-0 space-y-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Document Management</h3>
              <p className="text-sm text-muted-foreground mb-4">Upload and manage documents for deal analysis</p>
            </div>
            
            <DocumentLibrary 
              dealId={deal.id} 
              key={documentUpdateTrigger}
              onDocumentUpdate={handleDocumentUpdate}
            />
            
            <div>
              <h4 className="text-md font-medium mb-3">Upload New Documents</h4>
              <AIFileUpload 
                dealId={deal.id}
                onUploadComplete={(results) => {
                  console.log('Upload completed:', results);
                  toast.success(`Successfully uploaded ${results.length} files`);
                  handleDocumentUpdate();
                }}
                maxFiles={10}
              />
            </div>
          </TabsContent>

          {hasCIMAnalysis && (
            <TabsContent value="cim-analysis" className="p-4 m-0">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">CIM Investment Analysis</h3>
                <p className="text-sm text-muted-foreground mb-4">AI-powered investment analysis of Confidential Information Memorandum</p>
              </div>
              <CIMAnalysisDisplay dealId={deal.id} />
            </TabsContent>
          )}
          
          <TabsContent value="transcripts" className="p-4 m-0">
            <TranscriptsView dealId={deal.id} />
          </TabsContent>
          
          <TabsContent value="excel" className="p-4 m-0">
            <ExcelChunksView dealId={deal.id} />
          </TabsContent>
          
          <TabsContent value="metrics" className="p-4 m-0">
            <MetricsView dealId={deal.id} />
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
