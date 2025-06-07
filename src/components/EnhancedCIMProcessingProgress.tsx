import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  FileText, 
  Database, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  DollarSign,
  Shield,
  FileCheck,
  Zap,
  RefreshCw
} from "lucide-react";
import { useCIMModelTracking } from '@/hooks/useCIMModelTracking';
import { useCIMErrorRecovery } from '@/hooks/useCIMErrorRecovery';

interface AgentStatus {
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  progress?: number;
  usage?: {
    modelId?: string;
    inputTokens?: number;
    outputTokens?: number;
    processingTime?: number;
  };
}

interface EnhancedCIMProcessingProgressProps {
  isProcessing: boolean;
  progress: number;
  currentStep: string;
  fileName: string;
  error?: string;
  agentResults?: Record<string, AgentStatus>;
  dealId: string;
  documentId?: string;
  onRetry?: () => void;
}

export function EnhancedCIMProcessingProgress({ 
  isProcessing, 
  progress, 
  currentStep, 
  fileName,
  error,
  agentResults = {},
  dealId,
  documentId,
  onRetry
}: EnhancedCIMProcessingProgressProps) {
  const { trackingState, getTotalCost, getAgentCost } = useCIMModelTracking(dealId, documentId);
  const { recoveryState, getLastError } = useCIMErrorRecovery();

  const mainSteps = [
    { id: 'validation', label: 'Validating File', icon: FileText },
    { id: 'analysis', label: 'AI Analysis', icon: Brain },
    { id: 'storage', label: 'Storing Results', icon: Database },
    { id: 'complete', label: 'Complete', icon: CheckCircle }
  ];

  const agents = [
    { id: 'financial', label: 'Financial Analysis', icon: DollarSign, color: 'text-green-600' },
    { id: 'risk', label: 'Risk Assessment', icon: Shield, color: 'text-red-600' },
    { id: 'consistency', label: 'Consistency Check', icon: FileCheck, color: 'text-blue-600' },
    { id: 'memo', label: 'Memo Generation', icon: Zap, color: 'text-purple-600' }
  ];

  const getStepStatus = (stepId: string) => {
    if (error) return 'error';
    if (stepId === currentStep) return 'active';
    
    const stepIndex = mainSteps.findIndex(s => s.id === stepId);
    const currentIndex = mainSteps.findIndex(s => s.id === currentStep);
    
    if (stepIndex < currentIndex) return 'complete';
    return 'pending';
  };

  const getStepIcon = (step: any, status: string) => {
    const IconComponent = step.icon;
    
    if (status === 'error') {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (status === 'active') {
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    if (status === 'complete') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    return <IconComponent className="h-4 w-4 text-gray-400" />;
  };

  const getAgentIcon = (agent: any, agentStatus: AgentStatus) => {
    const IconComponent = agent.icon;
    
    if (agentStatus.status === 'error') {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    if (agentStatus.status === 'processing') {
      return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    if (agentStatus.status === 'completed') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    return <IconComponent className={`h-4 w-4 ${agent.color}`} />;
  };

  const lastError = getLastError();
  const totalCost = getTotalCost();

  if (!isProcessing && !error) return null;

  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-purple-900">Processing CIM Analysis</h3>
              <p className="text-sm text-purple-700">{fileName}</p>
            </div>
            <div className="flex items-center gap-2">
              {totalCost > 0 && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <DollarSign className="h-3 w-3 mr-1" />
                  ${totalCost.toFixed(4)}
                </Badge>
              )}
              <Badge variant={error ? "destructive" : "secondary"} className="bg-purple-100 text-purple-800">
                {error ? "Failed" : isProcessing ? "Processing" : "Complete"}
              </Badge>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-purple-700">
                {error ? "Processing Failed" : currentStep === 'complete' ? "Analysis Complete" : currentStep}
              </span>
              <span className="text-sm text-purple-600">{Math.round(progress)}%</span>
            </div>
            <Progress 
              value={progress} 
              className="h-3 bg-purple-100" 
            />
          </div>

          {/* Main Processing Steps */}
          <div className="grid grid-cols-4 gap-4">
            {mainSteps.map((step) => {
              const status = getStepStatus(step.id);
              return (
                <div key={step.id} className="flex flex-col items-center text-center">
                  <div className={`
                    p-2 rounded-full mb-2 border
                    ${status === 'complete' ? 'bg-green-50 border-green-200' : ''}
                    ${status === 'active' ? 'bg-blue-50 border-blue-200' : ''}
                    ${status === 'pending' ? 'bg-gray-50 border-gray-200' : ''}
                    ${status === 'error' ? 'bg-red-50 border-red-200' : ''}
                  `}>
                    {getStepIcon(step, status)}
                  </div>
                  <span className={`
                    text-xs font-medium
                    ${status === 'complete' ? 'text-green-700' : ''}
                    ${status === 'active' ? 'text-blue-700' : ''}
                    ${status === 'pending' ? 'text-gray-500' : ''}
                    ${status === 'error' ? 'text-red-700' : ''}
                  `}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Agent Progress - Only show during analysis phase */}
          {currentStep === 'analysis' && Object.keys(agentResults).length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-purple-800">Agent Progress</h4>
              <div className="grid grid-cols-2 gap-3">
                {agents.map((agent) => {
                  const agentStatus = agentResults[agent.id] || { status: 'pending' };
                  const agentCost = getAgentCost(agent.id);
                  return (
                    <div key={agent.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                      {getAgentIcon(agent, agentStatus)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{agent.label}</p>
                        <p className={`text-xs capitalize ${
                          agentStatus.status === 'completed' ? 'text-green-600' :
                          agentStatus.status === 'processing' ? 'text-blue-600' :
                          agentStatus.status === 'error' ? 'text-red-600' :
                          'text-gray-500'
                        }`}>
                          {agentStatus.status}
                        </p>
                      </div>
                      <div className="text-right">
                        {agentStatus.progress !== undefined && (
                          <span className="text-xs text-gray-500">{agentStatus.progress}%</span>
                        )}
                        {agentCost > 0 && (
                          <div className="text-xs text-green-600">${agentCost.toFixed(4)}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error Message with Recovery Options */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-800">Processing Failed</span>
                {onRetry && lastError?.retryable && !recoveryState.isRecovering && (
                  <button
                    onClick={onRetry}
                    className="ml-auto flex items-center gap-1 text-sm text-red-700 hover:text-red-800"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Retry
                  </button>
                )}
              </div>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              {lastError?.recoveryAction && (
                <p className="text-xs text-red-600 mt-1 italic">{lastError.recoveryAction}</p>
              )}
            </div>
          )}

          {/* Model Usage Summary */}
          {trackingState.isTracking && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-800">Tracking Model Usage</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Monitoring AI model performance and costs across all agents...
              </p>
            </div>
          )}

          {/* Processing Details */}
          {isProcessing && !error && (
            <div className="text-center">
              <p className="text-sm text-purple-600">
                AI is analyzing your CIM document with multiple specialized agents. This may take 2-3 minutes depending on document size.
              </p>
              {recoveryState.retryCount > 0 && (
                <p className="text-xs text-purple-500 mt-1">
                  Retry attempt {recoveryState.retryCount} of {recoveryState.maxRetries}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
