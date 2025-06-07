
import { useState, useCallback } from 'react';
import { modelApi } from '@/utils/aiApi';
import type { ModelUsageLog, ModelUseCase } from '@/types/models';

interface CIMModelUsage {
  agent: string;
  modelId?: string;
  inputTokens: number;
  outputTokens: number;
  processingTime: number;
  success: boolean;
  errorMessage?: string;
}

interface CIMModelTrackingState {
  totalCost: number;
  agentUsage: Record<string, CIMModelUsage[]>;
  isTracking: boolean;
}

export function useCIMModelTracking(dealId: string, documentId?: string) {
  const [trackingState, setTrackingState] = useState<CIMModelTrackingState>({
    totalCost: 0,
    agentUsage: {},
    isTracking: false
  });

  const trackModelUsage = useCallback(async (
    agent: string,
    modelId: string,
    useCase: ModelUseCase,
    inputTokens: number,
    outputTokens: number,
    processingTime: number,
    success: boolean,
    errorMessage?: string
  ) => {
    try {
      setTrackingState(prev => ({ ...prev, isTracking: true }));

      // Log usage via modelApi
      await modelApi.logModelUsage(
        modelId,
        useCase,
        inputTokens,
        outputTokens,
        processingTime,
        success,
        dealId,
        documentId,
        undefined, // agentLogId
        errorMessage
      );

      // Update local tracking state
      const usage: CIMModelUsage = {
        agent,
        modelId,
        inputTokens,
        outputTokens,
        processingTime,
        success,
        errorMessage
      };

      setTrackingState(prev => ({
        ...prev,
        agentUsage: {
          ...prev.agentUsage,
          [agent]: [...(prev.agentUsage[agent] || []), usage]
        },
        isTracking: false
      }));

      console.log(`Tracked model usage for agent ${agent}:`, usage);
    } catch (error) {
      console.error('Error tracking model usage:', error);
      setTrackingState(prev => ({ ...prev, isTracking: false }));
    }
  }, [dealId, documentId]);

  const getAgentCost = useCallback((agent: string): number => {
    const agentUsages = trackingState.agentUsage[agent] || [];
    // This would need model cost data to calculate actual cost
    // For now, return estimated cost based on token usage
    return agentUsages.reduce((total, usage) => {
      const estimatedCost = (usage.inputTokens + usage.outputTokens) * 0.00001; // Rough estimate
      return total + estimatedCost;
    }, 0);
  }, [trackingState.agentUsage]);

  const getTotalCost = useCallback((): number => {
    return Object.keys(trackingState.agentUsage).reduce((total, agent) => {
      return total + getAgentCost(agent);
    }, 0);
  }, [trackingState.agentUsage, getAgentCost]);

  const resetTracking = useCallback(() => {
    setTrackingState({
      totalCost: 0,
      agentUsage: {},
      isTracking: false
    });
  }, []);

  return {
    trackingState,
    trackModelUsage,
    getAgentCost,
    getTotalCost,
    resetTracking
  };
}
