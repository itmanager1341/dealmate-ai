
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Users, 
  DollarSign,
  Award,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  RefreshCw,
  Share2,
  BookOpen,
  BarChart3,
  Building2,
  Clock
} from "lucide-react";

interface CIMAnalysis {
  id: string;
  deal_id: string;
  document_id: string;
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
  updated_at: string;
}

interface CIMAnalysisDisplayProps {
  dealId: string;
}

export function CIMAnalysisDisplay({ dealId }: CIMAnalysisDisplayProps) {
  const [analysis, setAnalysis] = useState<CIMAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCIMAnalysis();
  }, [dealId]);

  const fetchCIMAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .from('cim_analysis')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setAnalysis(data[0]);
      }
    } catch (error) {
      console.error("Error fetching CIM analysis:", error);
      toast.error("Failed to load CIM analysis");
    } finally {
      setLoading(false);
    }
  };

  const getGradeBadgeColor = (grade: string) => {
    const gradeUpper = grade.toUpperCase();
    if (gradeUpper.startsWith('A')) return "bg-green-500 text-white";
    if (gradeUpper.startsWith('B')) return "bg-yellow-500 text-white";
    return "bg-red-500 text-white";
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation?.toLowerCase()) {
      case 'pursue':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pass':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getRiskSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return <Badge variant="destructive">High Risk</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>;
      case 'low':
        return <Badge variant="outline">Low Risk</Badge>;
      default:
        return <Badge variant="outline">{severity || 'Unknown'}</Badge>;
    }
  };

  const handleExportAnalysis = () => {
    if (!analysis) return;
    
    const analysisData = {
      dealId,
      exportDate: new Date().toISOString(),
      analysis
    };
    
    const blob = new Blob([JSON.stringify(analysisData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cim-analysis-${dealId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Analysis exported successfully!');
  };

  const handleShareAnalysis = () => {
    if (!analysis) return;
    
    const summary = `CIM Analysis Summary
Investment Grade: ${analysis.investment_grade}
Recommendation: ${analysis.recommendation?.action || 'N/A'}
Deal Size: ${analysis.financial_metrics?.deal_size_estimate || 'N/A'}
Revenue CAGR: ${analysis.financial_metrics?.revenue_cagr || 'N/A'}
EBITDA Margin: ${analysis.financial_metrics?.ebitda_margin || 'N/A'}

Key Highlights:
${analysis.investment_highlights?.slice(0, 3).map(h => `• ${h}`).join('\n') || 'None available'}

Generated by DealMate AI`;
    
    navigator.clipboard.writeText(summary).then(() => {
      toast.success('Analysis summary copied to clipboard!');
    });
  };

  // Helper function to safely get array from competitive position data
  const getCompetitiveArray = (data: any, key: string): string[] => {
    if (!data || !data[key]) return [];
    if (Array.isArray(data[key])) return data[key];
    if (typeof data[key] === 'string') return [data[key]];
    return [];
  };

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

  if (!analysis) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No CIM Analysis Available</h3>
            <p className="text-muted-foreground">Upload and process a CIM document to see investment analysis here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section with Investment Grade */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Investment Analysis</h2>
          <div className="flex items-center gap-3">
            <Badge className={`text-lg px-4 py-2 ${getGradeBadgeColor(analysis.investment_grade)}`}>
              Grade: {analysis.investment_grade}
            </Badge>
            {analysis.business_model && (
              <Badge variant="outline" className="text-sm">
                <Building2 className="w-4 h-4 mr-1" />
                {typeof analysis.business_model === 'string' 
                  ? analysis.business_model 
                  : analysis.business_model.type || 'Business model'}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleShareAnalysis}>
            <Share2 className="w-4 h-4 mr-1" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportAnalysis}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={fetchCIMAnalysis}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      <Separator />

      {/* Executive Summary */}
      {analysis.executive_summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-800 leading-relaxed">{analysis.executive_summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Financial Metrics Dashboard */}
      {analysis.financial_metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Financial Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {analysis.financial_metrics.revenue_cagr && (
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 font-medium mb-1">Revenue CAGR</p>
                  <p className="text-xl font-bold text-green-700">{analysis.financial_metrics.revenue_cagr}</p>
                </div>
              )}
              {analysis.financial_metrics.ebitda_margin && (
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium mb-1">EBITDA Margin</p>
                  <p className="text-xl font-bold text-blue-700">{analysis.financial_metrics.ebitda_margin}</p>
                </div>
              )}
              {analysis.financial_metrics.deal_size_estimate && (
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium mb-1">Deal Size</p>
                  <p className="text-xl font-bold text-purple-700">{analysis.financial_metrics.deal_size_estimate}</p>
                </div>
              )}
              {analysis.financial_metrics.revenue_multiple && (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 font-medium mb-1">Revenue Multiple</p>
                  <p className="text-xl font-bold text-gray-900">{analysis.financial_metrics.revenue_multiple}</p>
                </div>
              )}
              {analysis.financial_metrics.ebitda_multiple && (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 font-medium mb-1">EBITDA Multiple</p>
                  <p className="text-xl font-bold text-gray-900">{analysis.financial_metrics.ebitda_multiple}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Model & Investment Highlights */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Business Model */}
        {analysis.business_model && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Business Model
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-800 leading-relaxed">
                {typeof analysis.business_model === 'string' 
                  ? analysis.business_model 
                  : analysis.business_model.description || 'Business model details not available'}
              </p>
              
              {typeof analysis.business_model === 'object' && analysis.business_model.revenue_streams && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2 font-semibold">Revenue Streams</p>
                  <div className="space-y-2">
                    {Array.isArray(analysis.business_model.revenue_streams) && analysis.business_model.revenue_streams.map((stream: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                        <p className="text-sm text-gray-800">{stream}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Investment Highlights */}
        {analysis.investment_highlights && analysis.investment_highlights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Investment Highlights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.investment_highlights.map((highlight, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-gray-800">{highlight}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Risk Assessment */}
      {analysis.key_risks && analysis.key_risks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.key_risks.map((risk, index) => (
                <div key={index} className="border rounded-lg p-4 bg-red-50 border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-red-900">{risk.risk || risk.name || `Risk ${index + 1}`}</h4>
                    {getRiskSeverityBadge(risk.severity)}
                  </div>
                  {risk.impact && (
                    <p className="text-sm text-red-800">{risk.impact}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Competitive Position */}
      {analysis.competitive_position && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              Competitive Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {analysis.competitive_position.market_position && (
                <div>
                  <p className="text-sm text-gray-600 mb-2 font-semibold">Market Position</p>
                  <p className="text-gray-800">{analysis.competitive_position.market_position}</p>
                </div>
              )}
              
              {getCompetitiveArray(analysis.competitive_position, 'strengths').length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2 font-semibold">Strengths</p>
                  <div className="space-y-1">
                    {getCompetitiveArray(analysis.competitive_position, 'strengths').map((strength: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        <p className="text-sm text-gray-800">{strength}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {getCompetitiveArray(analysis.competitive_position, 'weaknesses').length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2 font-semibold">Areas for Improvement</p>
                  <div className="space-y-1">
                    {getCompetitiveArray(analysis.competitive_position, 'weaknesses').map((weakness: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                        <p className="text-sm text-gray-800">{weakness}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Management Questions & Recommendation */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Management Questions */}
        {analysis.management_questions && analysis.management_questions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-600" />
                Due Diligence Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.management_questions.map((question, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                    <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-gray-800">{question}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendation */}
        {analysis.recommendation && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getRecommendationIcon(analysis.recommendation.action || analysis.recommendation.decision)}
                Investment Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Recommendation</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analysis.recommendation.action || analysis.recommendation.decision || 'No recommendation'}
                  </p>
                </div>
                
                {analysis.recommendation.rationale && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2 font-semibold">Rationale</p>
                    <p className="text-gray-800 leading-relaxed">{analysis.recommendation.rationale}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Analysis Metadata */}
      <div className="text-center text-sm text-gray-500 mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>Created: {new Date(analysis.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Award className="w-4 h-4" />
            <span>Investment Grade: {analysis.investment_grade}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
