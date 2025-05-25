
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  RefreshCw
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
      {/* Investment Grade & Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <Award className="h-6 w-6" />
              Investment Analysis
            </CardTitle>
            <Badge className={getGradeBadgeColor(analysis.investment_grade)}>
              Grade: {analysis.investment_grade}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {analysis.executive_summary && (
            <div className="mb-4">
              <h4 className="font-medium mb-2">Executive Summary</h4>
              <p className="text-sm text-muted-foreground">{analysis.executive_summary}</p>
            </div>
          )}
          
          {analysis.business_model && (
            <div>
              <h4 className="font-medium mb-2">Business Model</h4>
              <p className="text-sm text-muted-foreground">
                {typeof analysis.business_model === 'string' 
                  ? analysis.business_model 
                  : analysis.business_model.description || 'Business model details not available'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Metrics */}
      {analysis.financial_metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6" />
              Financial Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analysis.financial_metrics.revenue_cagr && (
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{analysis.financial_metrics.revenue_cagr}</div>
                  <div className="text-sm text-muted-foreground">Revenue CAGR</div>
                </div>
              )}
              {analysis.financial_metrics.ebitda_margin && (
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{analysis.financial_metrics.ebitda_margin}</div>
                  <div className="text-sm text-muted-foreground">EBITDA Margin</div>
                </div>
              )}
              {analysis.financial_metrics.deal_size_estimate && (
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{analysis.financial_metrics.deal_size_estimate}</div>
                  <div className="text-sm text-muted-foreground">Deal Size Estimate</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Investment Highlights */}
      {analysis.investment_highlights && analysis.investment_highlights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Target className="h-6 w-6" />
              Investment Highlights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.investment_highlights.map((highlight, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{highlight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Risk Assessment */}
      {analysis.key_risks && analysis.key_risks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6" />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.key_risks.map((risk, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{risk.risk || risk.name || `Risk ${index + 1}`}</h4>
                    {getRiskSeverityBadge(risk.severity)}
                  </div>
                  {risk.impact && (
                    <p className="text-sm text-muted-foreground">{risk.impact}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Management Questions */}
      {analysis.management_questions && analysis.management_questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Users className="h-6 w-6" />
              Management Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.management_questions.map((question, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary font-medium text-sm">Q{index + 1}:</span>
                  <span className="text-sm">{question}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recommendation */}
      {analysis.recommendation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {getRecommendationIcon(analysis.recommendation.action || analysis.recommendation.decision)}
              Investment Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-lg">
                  {analysis.recommendation.action || analysis.recommendation.decision || 'No recommendation'}
                </div>
                {analysis.recommendation.rationale && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {analysis.recommendation.rationale}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
