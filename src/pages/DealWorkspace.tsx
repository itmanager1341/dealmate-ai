
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { supabase } from "@/lib/supabase";
import { Deal } from "@/types";
import { toast } from "sonner";
import { 
  File, 
  FileText, 
  MessageSquare, 
  BarChart2, 
  FileEdit, 
  ChevronLeft, 
  Award,
  Users,
  Building2,
  TrendingUp,
  Brain,
  Star,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Share2,
  Plus
} from "lucide-react";
import AIFileUpload from "@/components/AIFileUpload";
import { DocumentLibrary } from "@/components/DocumentLibrary";
import { ExcelChunksView } from "@/components/ExcelChunksView";
import { TranscriptsView } from "@/components/TranscriptsView";
import { MetricsView } from "@/components/MetricsView";
import { CIMAnalysisDisplay } from "@/components/CIMAnalysisDisplay";

interface CIMAnalysis {
  id: string;
  investment_grade: string;
  executive_summary: string;
  business_model: any;
  financial_metrics: any;
  key_risks: any[];
  investment_highlights: string[];
  management_questions: string[];
  competitive_position: any;
  recommendation: any;
  created_at: string;
}

export default function DealWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [documentUpdateTrigger, setDocumentUpdateTrigger] = useState(0);
  const [hasCIMAnalysis, setHasCIMAnalysis] = useState(false);
  const [currentCIMAnalysis, setCurrentCIMAnalysis] = useState<CIMAnalysis | null>(null);
  const [documentsCount, setDocumentsCount] = useState(0);

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
        
        // Check for CIM analysis and get documents count
        await Promise.all([
          checkForCIMAnalysis(id),
          fetchDocumentsCount(id)
        ]);
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
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error checking for CIM analysis:", error);
        return;
      }

      if (data && data.length > 0) {
        setHasCIMAnalysis(true);
        setCurrentCIMAnalysis(data[0]);
      }
    } catch (error) {
      console.error("Error checking for CIM analysis:", error);
    }
  };

  const fetchDocumentsCount = async (dealId: string) => {
    try {
      const { count, error } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('deal_id', dealId);

      if (error) {
        console.error("Error fetching documents count:", error);
        return;
      }

      setDocumentsCount(count || 0);
    } catch (error) {
      console.error("Error fetching documents count:", error);
    }
  };

  const handleDocumentUpdate = () => {
    setDocumentUpdateTrigger(prev => prev + 1);
    // Re-check for CIM analysis and documents count when documents are updated
    if (deal?.id) {
      checkForCIMAnalysis(deal.id);
      fetchDocumentsCount(deal.id);
    }
  };

  const handleCIMAnalysisComplete = (analysis: any) => {
    setCurrentCIMAnalysis(analysis);
    setHasCIMAnalysis(true);
    setActiveTab('cim-analysis');
    toast.success('CIM analysis completed successfully!');
  };

  const handleExportAnalysis = () => {
    if (!currentCIMAnalysis || !deal) return;
    
    const analysisData = {
      dealName: deal.name,
      dealId: deal.id,
      exportDate: new Date().toISOString(),
      analysis: currentCIMAnalysis
    };
    
    const blob = new Blob([JSON.stringify(analysisData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cim-analysis-${deal.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Analysis exported successfully!');
  };

  const handleShareAnalysis = () => {
    if (!currentCIMAnalysis || !deal) return;
    
    const summary = `CIM Analysis Summary - ${deal.name}
Investment Grade: ${currentCIMAnalysis.investment_grade}
Recommendation: ${currentCIMAnalysis.recommendation?.action || 'N/A'}
Deal Size: ${currentCIMAnalysis.financial_metrics?.deal_size_estimate || 'N/A'}
Revenue CAGR: ${currentCIMAnalysis.financial_metrics?.revenue_cagr || 'N/A'}
EBITDA Margin: ${currentCIMAnalysis.financial_metrics?.ebitda_margin || 'N/A'}

Key Highlights:
${currentCIMAnalysis.investment_highlights?.slice(0, 3).map(h => `• ${h}`).join('\n') || 'None available'}

Generated by DealMate AI`;
    
    navigator.clipboard.writeText(summary).then(() => {
      toast.success('Analysis summary copied to clipboard!');
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'archived':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInvestmentGradeColor = (grade?: string) => {
    if (!grade) return 'text-gray-500';
    if (grade.startsWith('A')) return 'text-green-600';
    if (grade.startsWith('B')) return 'text-yellow-600';
    return 'text-red-600';
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

      {/* Enhanced Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{deal.name}</h1>
            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(deal.status)}>
                {getStatusIcon(deal.status)}
                <span className="ml-1 capitalize">{deal.status}</span>
              </Badge>
              <Badge variant="outline">
                <Building2 className="h-4 w-4 mr-1" />
                {deal.company_name || 'Company'}
              </Badge>
              {deal.industry && (
                <Badge variant="outline">
                  {deal.industry}
                </Badge>
              )}
              {currentCIMAnalysis && (
                <Badge 
                  variant="outline" 
                  className={getInvestmentGradeColor(currentCIMAnalysis.investment_grade)}
                >
                  <Star className="h-4 w-4 mr-1" />
                  Grade: {currentCIMAnalysis.investment_grade}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {currentCIMAnalysis && (
              <>
                <Button variant="outline" size="sm" onClick={handleShareAnalysis}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Analysis
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportAnalysis}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </>
            )}
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Run Analysis
            </Button>
          </div>
        </div>

        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">8</p>
                <p className="text-sm text-muted-foreground">Participants</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{documentsCount}</p>
                <p className="text-sm text-muted-foreground">Documents</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{hasCIMAnalysis ? '1' : '0'}</p>
                <p className="text-sm text-muted-foreground">AI Analysis</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">
                  {currentCIMAnalysis?.financial_metrics?.revenue_cagr || 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">Revenue CAGR</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-600" />
              <div>
                <p className={`text-2xl font-bold ${getInvestmentGradeColor(currentCIMAnalysis?.investment_grade)}`}>
                  {currentCIMAnalysis?.investment_grade || 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">Investment Grade</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview" className="flex items-center">
            <Building2 className="h-4 w-4 mr-2" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center">
            <File className="h-4 w-4 mr-2" />
            <span>Documents</span>
          </TabsTrigger>
          {hasCIMAnalysis && (
            <TabsTrigger value="cim-analysis" className="flex items-center">
              <Award className="h-4 w-4 mr-2" />
              <span>CIM Analysis</span>
              <Badge variant="secondary" className="ml-2 text-xs">
                {currentCIMAnalysis?.investment_grade}
              </Badge>
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
          {/* Overview Tab */}
          <TabsContent value="overview" className="p-6 m-0 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Deal Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Company</p>
                      <p className="font-semibold">{deal.company_name || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Industry</p>
                      <p className="font-semibold">{deal.industry || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-semibold capitalize">{deal.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-semibold">{new Date(deal.created_at).toLocaleDateString()}</p>
                    </div>
                    {currentCIMAnalysis && (
                      <div>
                        <p className="text-sm text-muted-foreground">AI Recommendation</p>
                        <p className={`font-semibold ${getInvestmentGradeColor(currentCIMAnalysis.investment_grade)}`}>
                          {currentCIMAnalysis.recommendation?.action || 'Not available'}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentCIMAnalysis && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <div>
                          <p className="text-sm font-medium">CIM analysis completed</p>
                          <p className="text-xs text-muted-foreground">
                            Grade: {currentCIMAnalysis.investment_grade}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Documents uploaded</p>
                        <p className="text-xs text-muted-foreground">{documentsCount} total files</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <p className="text-sm font-medium">Deal created</p>
                        <p className="text-xs text-muted-foreground">{new Date(deal.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* CIM Analysis Summary */}
            {currentCIMAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    CIM Analysis Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className={`text-2xl font-bold ${getInvestmentGradeColor(currentCIMAnalysis.investment_grade)}`}>
                        {currentCIMAnalysis.investment_grade}
                      </div>
                      <div className="text-sm text-muted-foreground">Investment Grade</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {currentCIMAnalysis.financial_metrics?.deal_size_estimate || 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">Deal Size Estimate</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {currentCIMAnalysis.financial_metrics?.ebitda_margin || 'N/A'}
                      </div>
                      <div className="text-sm text-muted-foreground">EBITDA Margin</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button onClick={() => setActiveTab('cim-analysis')} className="w-full">
                      View Full Analysis
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="documents" className="p-4 m-0 space-y-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Document Management</h3>
              <p className="text-sm text-muted-foreground mb-4">Upload and manage documents for deal analysis</p>
            </div>
            
            <DocumentLibrary 
              dealId={deal.id} 
              key={documentUpdateTrigger}
              onDocumentUpdate={handleDocumentUpdate}
              onCIMAnalysisComplete={handleCIMAnalysisComplete}
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
