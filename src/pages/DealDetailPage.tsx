
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Building } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { type Deal } from "@/types";
import { toast } from "sonner";
import AIFileUpload from "@/components/AIFileUpload";

const getStatusColor = (status: Deal['status']) => {
  switch (status) {
    case 'active':
      return 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30';
    case 'pending':
      return 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30';
    case 'archived':
      return 'bg-slate-500/20 text-slate-400 hover:bg-slate-500/30';
    default:
      return 'bg-slate-500/20 text-slate-400 hover:bg-slate-500/30';
  }
};

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);

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
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="dealmate-content">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Deal Not Found</h1>
          <p className="text-gray-600">The deal you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(deal.updated_at).toLocaleDateString();

  return (
    <div className="dealmate-content">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{deal.name}</h1>
        <p className="text-muted-foreground">Manage documents and analyze deal metrics</p>
      </div>

      {/* Deal Information Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Deal Information</CardTitle>
            <Badge className={getStatusColor(deal.status)}>
              {deal.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Company:</span>
              <span className="font-medium">{deal.company_name || 'Not specified'}</span>
            </div>
            {deal.industry && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Industry:</span>
                <span className="font-medium">{deal.industry}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Last Updated:</span>
              <span className="font-medium">{formattedDate}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI File Upload Component */}
      <AIFileUpload 
        dealId={deal.id}
        onProcessingComplete={(results) => {
          console.log('Processing completed:', results);
          toast.success(`Successfully processed ${results.length} files`);
        }}
        maxFiles={10}
      />
    </div>
  );
}
