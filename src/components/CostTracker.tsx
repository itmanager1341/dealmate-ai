
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, X, TrendingUp, TrendingDown } from "lucide-react";
import { ModelService } from '@/services/modelService';
import { supabase } from '@/lib/supabase';

interface CostTrackerProps {
  dealId?: string;
  onDismiss?: () => void;
}

export function CostTracker({ dealId, onDismiss }: CostTrackerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [costData, setCostData] = useState({
    current: 0,
    daily: 0,
    weekly: 0,
    trend: 0
  });

  useEffect(() => {
    loadCostData();
    
    // Show tracker during active processing
    const interval = setInterval(loadCostData, 5000);
    return () => clearInterval(interval);
  }, [dealId]);

  const loadCostData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [dailyStats, weeklyStats] = await Promise.all([
        ModelService.getUsageStats(user.id, dealId, oneDayAgo, now),
        ModelService.getUsageStats(user.id, dealId, oneWeekAgo, now)
      ]);

      setCostData({
        current: dailyStats.total_cost,
        daily: dailyStats.total_cost,
        weekly: weeklyStats.total_cost,
        trend: weeklyStats.total_cost > 0 ? (dailyStats.total_cost / (weeklyStats.total_cost / 7)) - 1 : 0
      });

      // Show tracker if there's meaningful cost data
      setIsVisible(dailyStats.total_cost > 0.01);
    } catch (error) {
      console.error('Error loading cost data:', error);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 shadow-lg border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">AI Usage Cost</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-green-700">
                ${costData.daily.toFixed(2)}
              </div>
              <div className="text-xs text-green-600">Today</div>
            </div>

            <div className="text-center">
              <div className="text-lg font-bold text-green-700">
                ${costData.weekly.toFixed(2)}
              </div>
              <div className="text-xs text-green-600">This Week</div>
            </div>
          </div>

          {Math.abs(costData.trend) > 0.1 && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <div className="flex items-center justify-center gap-1">
                {costData.trend > 0 ? (
                  <TrendingUp className="h-3 w-3 text-orange-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-green-600" />
                )}
                <span className="text-xs text-green-700">
                  {costData.trend > 0 ? '+' : ''}{(costData.trend * 100).toFixed(1)}% vs last week
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
