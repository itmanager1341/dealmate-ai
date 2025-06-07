
import React, { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ModelService } from '@/services/modelService';
import { checkAIServerHealth } from '@/utils/aiApi';
import { supabase } from '@/lib/supabase';

interface ModelStatus {
  status: 'healthy' | 'degraded' | 'issues';
  message: string;
  cost24h: number;
  serverOnline: boolean;
}

export function ModelStatusIndicator() {
  const [status, setStatus] = useState<ModelStatus>({
    status: 'healthy',
    message: 'Checking AI server status...',
    cost24h: 0,
    serverOnline: false
  });

  useEffect(() => {
    checkModelStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkModelStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkModelStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // First check if AI server is online
      const serverOnline = await checkAIServerHealth();
      console.log('AI Server online:', serverOnline);

      if (!serverOnline) {
        setStatus({
          status: 'issues',
          message: 'AI server is offline - processing unavailable',
          cost24h: 0,
          serverOnline: false
        });
        return;
      }

      // Get 24h usage stats
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);

      const stats = await ModelService.getUsageStats(user.id, undefined, startDate, endDate);
      
      // Determine status based on success rate and cost
      let modelStatus: ModelStatus['status'] = 'healthy';
      let message = 'All AI models operating normally';

      if (stats.success_rate < 0.9) {
        modelStatus = 'degraded';
        message = `Model performance degraded (${(stats.success_rate * 100).toFixed(1)}% success rate)`;
      } else if (stats.success_rate < 0.7) {
        modelStatus = 'issues';
        message = 'AI models experiencing issues';
      }

      setStatus({
        status: modelStatus,
        message,
        cost24h: stats.total_cost,
        serverOnline: true
      });
    } catch (error) {
      console.error('Error checking model status:', error);
      setStatus({
        status: 'issues',
        message: 'Unable to check AI server status',
        cost24h: 0,
        serverOnline: false
      });
    }
  };

  const getStatusColor = () => {
    if (!status.serverOnline) return 'bg-red-500';
    
    switch (status.status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'issues': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative cursor-help">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
            {(status.status !== 'healthy' || !status.serverOnline) && (
              <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`} />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="text-xs space-y-1">
            <div className="font-medium">AI System Status</div>
            <div>{status.message}</div>
            <div className="text-muted-foreground">
              Server: {status.serverOnline ? 'Online' : 'Offline'}
            </div>
            {status.cost24h > 0 && (
              <div className="text-muted-foreground">
                24h cost: ${status.cost24h.toFixed(2)}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
