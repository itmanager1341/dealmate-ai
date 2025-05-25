
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
  Loader2
} from "lucide-react";

interface CIMProcessingProgressProps {
  isProcessing: boolean;
  progress: number;
  currentStep: string;
  fileName: string;
  error?: string;
}

export function CIMProcessingProgress({ 
  isProcessing, 
  progress, 
  currentStep, 
  fileName,
  error 
}: CIMProcessingProgressProps) {
  const steps = [
    { id: 'validation', label: 'Validating File', icon: FileText },
    { id: 'analysis', label: 'AI Analysis', icon: Brain },
    { id: 'storage', label: 'Storing Results', icon: Database },
    { id: 'complete', label: 'Complete', icon: CheckCircle }
  ];

  const getStepStatus = (stepId: string) => {
    if (error) return 'error';
    if (stepId === currentStep) return 'active';
    
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    
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

  if (!isProcessing && !error) return null;

  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-purple-900">Processing CIM Analysis</h3>
              <p className="text-sm text-purple-700">{fileName}</p>
            </div>
            <Badge variant={error ? "destructive" : "secondary"} className="bg-purple-100 text-purple-800">
              {error ? "Failed" : isProcessing ? "Processing" : "Complete"}
            </Badge>
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

          {/* Processing Steps */}
          <div className="grid grid-cols-4 gap-4">
            {steps.map((step) => {
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

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-800">Processing Failed</span>
              </div>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          )}

          {/* Processing Details */}
          {isProcessing && !error && (
            <div className="text-center">
              <p className="text-sm text-purple-600">
                AI is analyzing your CIM document. This may take 1-2 minutes depending on document size.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
