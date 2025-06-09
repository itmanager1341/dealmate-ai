
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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

// Simple JSON display component that's safe for complex data
function SafeJSONDisplay({ data, title }: { data: any; title?: string }) {
  if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
    return null;
  }

  const renderValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const renderObject = (obj: any) => {
    if (typeof obj !== 'object' || obj === null) {
      return <div className="text-gray-800">{renderValue(obj)}</div>;
    }

    return (
      <div className="space-y-2">
        {Object.entries(obj).map(([key, value]) => (
          <div key={key} className="border-l-2 border-gray-200 pl-3">
            <div className="font-medium text-gray-900 capitalize">
              {key.replace(/_/g, ' ')}
            </div>
            <div className="text-gray-700 mt-1">
              {typeof value === 'object' && value !== null ? (
                <ScrollArea className="h-32 w-full rounded border p-2 bg-gray-50">
                  <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(value, null, 2)}
                  </pre>
                </ScrollArea>
              ) : (
                renderValue(value)
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {title && <h4 className="font-semibold text-lg">{title}</h4>}
      {renderObject(data)}
    </div>
  );
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

Key Highlights:
${analysis.investment_highlights?.slice(0, 3).map(h => `• ${h}`).join('\n') || 'None available'}

Generated by DealMate AI`;
    
    navigator.clipboard.writeText(summary).then(() => {
      toast.success('Analysis summary copied to clipboard!');
    });
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

      {/* Financial Metrics */}
      {analysis.financial_metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Financial Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SafeJSONDisplay data={analysis.financial_metrics} />
          </CardContent>
        </Card>
      )}

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
            <SafeJSONDisplay data={analysis.business_model} />
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
            <SafeJSONDisplay data={analysis.competitive_position} />
          </CardContent>
        </Card>
      )}

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
            <SafeJSONDisplay data={analysis.recommendation} />
          </CardContent>
        </Card>
      )}

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
