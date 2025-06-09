import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  BarChart3, 
  MessageSquare, 
  Upload,
  ArrowLeft,
  Building2,
  Calendar,
  User
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { DocumentLibrary } from "@/components/DocumentLibrary";
import { DynamicCIMAnalysisDisplay } from "@/components/DynamicCIMAnalysisDisplay";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import AIFileUpload from "@/components/AIFileUpload";

interface Deal {
  id: string;
  name: string;
  company_name: string;
  industry: string;
  status: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export default function DealWorkspace() {
  const { dealId } = useParams<{ dealId: string }>();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (dealId) {
      fetchDeal();
    }
  }, [dealId]);

  const fetchDeal = async () => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('id', dealId)
        .single();

      if (error) throw error;
      setDeal(data);
    } catch (error) {
      console.error("Error fetching deal:", error);
      toast.error("Failed to load deal details");
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return "bg-green-500 text-white";
      case 'pending': return "bg-yellow-500 text-white";
      case 'archived': return "bg-gray-500 text-white";
      default: return "bg-blue-500 text-white";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Deal not found</h2>
          <p className="text-muted-foreground mb-4">The deal you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{deal.name}</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Building2 className="mr-1 h-4 w-4" />
                    {deal.company_name}
                  </div>
                  {deal.industry && (
                    <div className="flex items-center text-sm text-gray-600">
                      <BarChart3 className="mr-1 h-4 w-4" />
                      {deal.industry}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="mr-1 h-4 w-4" />
                    Created {new Date(deal.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className={getStatusBadgeColor(deal.status)}>
                {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
              </Badge>
            </div>
          </div>
          
          {deal.description && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">{deal.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload & Process
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            <ErrorBoundary>
              <DocumentLibrary dealId={deal.id} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="analysis">
            <ErrorBoundary>
              <DynamicCIMAnalysisDisplay dealId={deal.id} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="upload">
            <ErrorBoundary>
              <AIFileUpload dealId={deal.id} bucketName="documents" />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
