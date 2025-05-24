
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { BarChart2, Pin, PinOff, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface DealMetric {
  id: string;
  deal_id: string;
  metric_name: string;
  metric_value: number;
  metric_unit: string;
  pinned: boolean;
  created_at: string;
}

interface MetricsViewProps {
  dealId: string;
}

export function MetricsView({ dealId }: MetricsViewProps) {
  const [metrics, setMetrics] = useState<DealMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, [dealId]);

  const fetchMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('deal_metrics')
        .select('*')
        .eq('deal_id', dealId)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMetrics(data || []);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      toast.error("Failed to load metrics");
    } finally {
      setLoading(false);
    }
  };

  const togglePin = async (metricId: string, currentPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('deal_metrics')
        .update({ pinned: !currentPinned })
        .eq('id', metricId);

      if (error) throw error;
      
      setMetrics(prev => prev.map(metric => 
        metric.id === metricId 
          ? { ...metric, pinned: !currentPinned }
          : metric
      ));
      
      toast.success(`Metric ${!currentPinned ? 'pinned' : 'unpinned'}`);
    } catch (error) {
      console.error("Error updating pin status:", error);
      toast.error("Failed to update pin status");
    }
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === '%') {
      return `${value.toFixed(2)}%`;
    }
    if (unit === '$' || unit === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    return `${value.toLocaleString()} ${unit}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-1">No metrics available</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Process financial documents to extract key metrics
        </p>
      </div>
    );
  }

  const pinnedMetrics = metrics.filter(m => m.pinned);
  const unpinnedMetrics = metrics.filter(m => !m.pinned);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Financial Metrics ({metrics.length})</h3>
        <Badge variant="outline">
          {pinnedMetrics.length} pinned
        </Badge>
      </div>

      {pinnedMetrics.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Pin className="h-4 w-4" />
            Pinned Metrics
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pinnedMetrics.map((metric) => (
              <Card key={metric.id} className="border-primary/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {metric.metric_name}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePin(metric.id, metric.pinned)}
                      className="h-6 w-6 p-0"
                    >
                      <Pin className="h-3 w-3 text-primary" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatValue(metric.metric_value, metric.metric_unit)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {unpinnedMetrics.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            All Metrics
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unpinnedMetrics.map((metric) => (
              <Card key={metric.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {metric.metric_name}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePin(metric.id, metric.pinned)}
                      className="h-6 w-6 p-0"
                    >
                      <PinOff className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatValue(metric.metric_value, metric.metric_unit)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
