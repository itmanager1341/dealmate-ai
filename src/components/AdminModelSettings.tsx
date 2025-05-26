
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ModelService } from '@/services/modelService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Settings, Zap, DollarSign, Clock, TrendingUp } from 'lucide-react';
import type { AIModel, ModelConfiguration, ModelUseCase } from '@/types/models';

interface AdminModelSettingsProps {
  dealId?: string;
}

export function AdminModelSettings({ dealId }: AdminModelSettingsProps) {
  const [models, setModels] = useState<AIModel[]>([]);
  const [configurations, setConfigurations] = useState<ModelConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const useCases: { value: ModelUseCase; label: string; description: string }[] = [
    { 
      value: 'cim_analysis', 
      label: 'CIM Analysis', 
      description: 'Investment memorandum analysis and scoring' 
    },
    { 
      value: 'document_processing', 
      label: 'Document Processing', 
      description: 'General document analysis and extraction' 
    },
    { 
      value: 'excel_analysis', 
      label: 'Excel Analysis', 
      description: 'Financial spreadsheet processing' 
    },
    { 
      value: 'audio_transcription', 
      label: 'Audio Transcription', 
      description: 'Audio to text conversion' 
    },
    { 
      value: 'memo_generation', 
      label: 'Memo Generation', 
      description: 'Investment memo creation' 
    },
    { 
      value: 'general_analysis', 
      label: 'General Analysis', 
      description: 'General purpose AI analysis' 
    }
  ];

  useEffect(() => {
    loadData();
  }, [dealId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const [modelsData, configurationsData] = await Promise.all([
        ModelService.getAvailableModels(),
        user ? ModelService.getUserModelConfigurations(user.id, dealId) : []
      ]);

      setModels(modelsData);
      setConfigurations(configurationsData);
    } catch (error) {
      console.error('Error loading model settings:', error);
      toast.error('Failed to load model settings');
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async (useCase: ModelUseCase, modelId: string, isTestingMode: boolean) => {
    if (!user) return;

    try {
      await ModelService.saveModelConfiguration({
        user_id: user.id,
        deal_id: dealId || null,
        use_case: useCase,
        model_id: modelId,
        is_testing_mode: isTestingMode
      });

      await loadData();
      toast.success('Model configuration saved');
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Failed to save configuration');
    }
  };

  const getModelForUseCase = (useCase: ModelUseCase): string | undefined => {
    const config = configurations.find(c => c.use_case === useCase);
    if (config) return config.model_id;

    // Fall back to default model for this use case
    const defaultModel = models.find(m => m.use_case === useCase && m.is_default);
    return defaultModel?.id;
  };

  const getTestingModeForUseCase = (useCase: ModelUseCase): boolean => {
    const config = configurations.find(c => c.use_case === useCase);
    return config?.is_testing_mode || false;
  };

  const getModelById = (modelId: string): AIModel | undefined => {
    return models.find(m => m.id === modelId);
  };

  const formatCost = (costPer1k: number): string => {
    return `$${(costPer1k / 1000).toFixed(4)}/1K tokens`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5" />
        <h2 className="text-xl font-semibold">
          {dealId ? 'Deal-Specific Model Settings' : 'Global Model Settings'}
        </h2>
      </div>

      <div className="grid gap-6">
        {useCases.map((useCase) => {
          const availableModels = models.filter(m => m.use_case === useCase.value);
          const selectedModelId = getModelForUseCase(useCase.value);
          const selectedModel = selectedModelId ? getModelById(selectedModelId) : undefined;
          const isTestingMode = getTestingModeForUseCase(useCase.value);

          return (
            <Card key={useCase.value}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {useCase.label}
                      {isTestingMode && (
                        <Badge variant="outline" className="text-orange-600">
                          <Zap className="h-3 w-3 mr-1" />
                          Testing Mode
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground font-normal mt-1">
                      {useCase.description}
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Selected Model</Label>
                    <Select
                      value={selectedModelId || ''}
                      onValueChange={(value) => saveConfiguration(useCase.value, value, isTestingMode)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{model.name}</span>
                              <div className="flex items-center gap-2 ml-4">
                                <Badge variant="outline" className="text-xs">
                                  {model.provider}
                                </Badge>
                                {model.is_default && (
                                  <Badge variant="outline" className="text-xs text-blue-600">
                                    Default
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`testing-${useCase.value}`}
                      checked={isTestingMode}
                      onCheckedChange={(checked) => 
                        selectedModelId && saveConfiguration(useCase.value, selectedModelId, checked)
                      }
                    />
                    <Label htmlFor={`testing-${useCase.value}`}>Testing Mode</Label>
                  </div>
                </div>

                {selectedModel && (
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <div>
                          <div className="font-medium">Input Cost</div>
                          <div className="text-muted-foreground">
                            {formatCost(selectedModel.cost_per_input_token)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-red-600" />
                        <div>
                          <div className="font-medium">Output Cost</div>
                          <div className="text-muted-foreground">
                            {formatCost(selectedModel.cost_per_output_token)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="font-medium">Performance</div>
                          <div className="text-muted-foreground">
                            {selectedModel.performance_score}/10
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-600" />
                        <div>
                          <div className="font-medium">Speed</div>
                          <div className="text-muted-foreground">
                            {selectedModel.speed_score}/10
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        {selectedModel.context_window.toLocaleString()} context
                      </Badge>
                      <Badge variant="outline">
                        {selectedModel.max_tokens.toLocaleString()} max tokens
                      </Badge>
                      {selectedModel.supports_vision && (
                        <Badge variant="outline" className="text-green-600">
                          Vision
                        </Badge>
                      )}
                      {selectedModel.supports_function_calling && (
                        <Badge variant="outline" className="text-blue-600">
                          Functions
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
