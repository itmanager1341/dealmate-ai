
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { 
  Award,
  Download,
  RefreshCw,
  Share2,
  Clock,
  AlertTriangle,
  Lightbulb,
  Database,
  Loader2
} from "lucide-react";
import { SafeDynamicScanner, DataSection } from './SafeDynamicScanner';
import { DynamicSectionRenderer } from './DynamicRenderers';

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

interface ProgressiveCIMAnalysisProps {
  dealId: string;
}

export function ProgressiveCIMAnalysis({ dealId }: ProgressiveCIMAnalysisProps) {
  const [analysis, setAnalysis] = useState<CIMAnalysis | null>(null);
  const [basicLoading, setBasicLoading] = useState(true);
  const [dynamicLoading, setDynamicLoading] = useState(false);
  const [sections, setSections] = useState<DataSection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [enableDynamic, setEnableDynamic] = useState(false);

  const fetchBasicAnalysis = useCallback(async () => {
    try {
      setError(null);
      console.log('Fetching basic CIM analysis for deal:', dealId);
      
      const { data, error } = await supabase
        .from('cim_analysis')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('CIM analysis data received:', data);
      
      if (data && data.length > 0) {
        setAnalysis(data[0]);
      }
    } catch (error) {
      console.error("Error fetching CIM analysis:", error);
      setError(error instanceof Error ? error.message : "Failed to load CIM analysis");
      toast.error("Failed to load CIM analysis");
    } finally {
      setBasicLoading(false);
    }
  }, [dealId]);

  const enableDynamicAnalysis = useCallback(async () => {
    if (!analysis || dynamicLoading) return;
    
    setDynamicLoading(true);
    try {
      console.log('Starting dynamic analysis...');
      
      // Scan and organize the data dynamically with safety guards
      const allFields = await SafeDynamicScanner.scanDataSafely(analysis);
      console.log('Scanned fields:', allFields);
      
      const organizedSections = SafeDynamicScanner.groupIntoSections(allFields);
      setSections(organizedSections);
      
      console.log('Dynamic analysis completed successfully');
      toast.success('Dynamic analysis loaded successfully!');
    } catch (scanError) {
      console.error('Error during dynamic scanning:', scanError);
      toast.error('Dynamic analysis failed, using standard view');
      setSections([]);
    } finally {
      setDynamicLoading(false);
    }
  }, [analysis, dynamicLoading]);

  useEffect(() => {
    fetchBasicAnalysis();
  }, [fetchBasicAnalysis]);

  const handleFieldEdit = async (field: any, newLabel: string) => {
    try {
      setSections(prevSections => 
        prevSections.map(section => ({
          ...section,
          fields: section.fields.map(f => 
            f.path === field.path ? { ...f, suggestedLabel: newLabel } : f
          )
        }))
      );
      
      toast.success('Field label updated successfully!');
    } catch (error) {
      console.error('Error updating field label:', error);
      toast.error('Failed to update field label');
    }
  };

  const getGradeBadgeColor = (grade: string) => {
    const gradeUpper = grade.toUpperCase();
    if (gradeUpper.startsWith('A')) return "bg-green-500 text-white";
    if (gradeUpper.startsWith('B')) return "bg-yellow-500 text-white";
    return "bg-red-500 text-white";
  };

  if (basicLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading analysis...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Analysis</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchBasicAnalysis}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
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
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Investment Analysis</h2>
          <div className="flex items-center gap-3">
            <Badge className={`text-lg px-4 py-2 ${getGradeBadgeColor(analysis.investment_grade)}`}>
              Grade: {analysis.investment_grade}
            </Badge>
            {!enableDynamic && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setEnableDynamic(true)}
                disabled={dynamicLoading}
              >
                <Database className="w-4 h-4 mr-1" />
                Enable Dynamic View
              </Button>
            )}
            {enableDynamic && !dynamicLoading && sections.length === 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={enableDynamicAnalysis}
              >
                <Lightbulb className="w-4 h-4 mr-1" />
                Load Dynamic Analysis
              </Button>
            )}
            {dynamicLoading && (
              <Badge variant="outline" className="text-sm">
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Processing...
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-1" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={fetchBasicAnalysis}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      <Separator />

      {/* Basic Analysis Display */}
      <div className="grid gap-6">
        {analysis.executive_summary && (
          <Card>
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{analysis.executive_summary}</p>
            </CardContent>
          </Card>
        )}

        {analysis.investment_highlights && analysis.investment_highlights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Investment Highlights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.investment_highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-gray-700">{highlight}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {analysis.key_risks && analysis.key_risks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Key Risks</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.key_risks.map((risk, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">{String(risk)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dynamic Sections - Only show if enabled and loaded */}
      {enableDynamic && sections.length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Dynamic Analysis</h3>
            {sections.map((section) => (
              <DynamicSectionRenderer
                key={section.category}
                section={section}
                onFieldEdit={handleFieldEdit}
              />
            ))}
          </div>
        </>
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
          {sections.length > 0 && (
            <div className="flex items-center gap-1">
              <Database className="w-4 h-4" />
              <span>Dynamic Fields: {sections.reduce((sum, s) => sum + s.fields.length, 0)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
