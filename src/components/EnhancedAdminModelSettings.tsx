
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ModelService } from '@/services/modelService';
import { EnhancedModelService } from '@/services/enhancedModelService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  Settings, 
  Zap, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Target,
  Wrench,
  RotateCcw
} from 'lucide-react';
import type { AIModel, ModelConfiguration, ModelUseCase, ConfigurationPreset } from '@/types/models';

interface EnhancedAdminModelSettingsProps {
  dealId?: string;
}

export function EnhancedAdminModelSettings({ dealId }: EnhancedAdminModelSettingsProps) {
  const [models, setModels] = useState<AIModel[]>([]);
  const [configurations, setConfigurations] = useState<ModelConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [user, setUser] = useState<any>(null);

  const useCases: { value: ModelUseCase; label: string; description: string; icon: React.ReactNode }[] = [
    { 
      value: 'cim_analysis', 
      label: 'CIM Analysis', 
      description: 'Investment memorandum analysis and scoring',
      icon: <Target className="h-4 w-4" />
    },
    { 
      value: 'document_processing', 
      label: 'Document Processing', 
      description: 'General document analysis and extraction',
      icon: <TrendingUp className="h-4 w-4" />
    },
    { 
      value: 'excel_analysis', 
      label: 'Excel Analysis', 
      description: 'Financial spreadsheet processing',
      icon: <DollarSign className="h-4 w-4" />
    },
    { 
      value: 'audio_transcription', 
      label: 'Audio Transcription', 
      description: 'Audio to text conversion',
      icon: <Zap className="h-4 w-4" />
    },
    { 
      value: 'memo_generation', 
      label: 'Memo Generation', 
      description: 'Investment memo creation',
      icon: <Wrench className="h-4 w-4" />
    },
    { 
      value: 'general_analysis', 
      label: 'General Analysis', 
      description: 'General purpose AI analysis',
      icon: <Settings className="h-4 w-4" />
    }
  ];

  useEffect(() => {
    loadData();
  }, [dealId]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading data for dealId:', dealId);
      
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      console.log('Current user:', user?.id);

      if (!user) {
        console.warn('No user found');
        setLoading(false);
        return;
      }

      const [modelsData, configurationsData] = await Promise.all([
        ModelService.getAvailableModels(),
        ModelService.getUserModelConfigurations(user.id, dealId)
      ]);

      console.log('Loaded models:', modelsData);
      console.log('Loaded configurations:', configurationsData);

      setModels(modelsData);
      setConfigurations(configurationsData);
    } catch (error) {
      console.error('Error loading model settings:', error);
      toast.error('Failed to load model settings');
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async (useCase: ModelUseCase, modelId?: string, isTestingMode?: boolean) => {
    if (!user) {
      console.warn('No user found for saving configuration');
      return;
    }

    const savingKey = `${useCase}-${modelId ? 'model' : 'testing'}`;
    setSaving(prev => ({ ...prev, [savingKey]: true }));

    try {
      console.log('Saving configuration:', { useCase, modelId, isTestingMode });
      
      await EnhancedModelService.saveModelConfiguration(
        user.id,
        dealId || null,
        useCase,
        modelId,
        isTestingMode
      );

      // Reload data to reflect changes
      await loadData();
      toast.success('Configuration saved successfully');
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Failed to save configuration. Please try again.');
    } finally {
      setSaving(prev => ({ ...prev, [savingKey]: false }));
    }
  };

  const handleBulkAction = async (action: 'set-all-testing' | 'reset-all' | 'set-recommended') => {
    if (!user) return;

    setSaving(prev => ({ ...prev, bulk: true }));

    try {
      console.log('Executing bulk action:', action);

      if (action === 'set-all-testing') {
        await EnhancedModelService.bulkUpdateConfigurations(user.id, dealId || null, [
          { applyToAll: true, isTestingMode: true }
        ]);
        toast.success('All models set to testing mode');
      } else if (action === 'reset-all') {
        // Clear all configurations to fall back to defaults
        const { error } = await supabase
          .from('model_configurations')
          .delete()
          .eq('user_id', user.id)
          .eq('deal_id', dealId || null);
        
        if (error) throw error;
        toast.success('All configurations reset to defaults');
      } else if (action === 'set-recommended') {
        await EnhancedModelService.applyPreset(user.id, dealId || null, 'recommended', models);
        toast.success('Recommended models applied');
      }

      await loadData();
    } catch (error) {
      console.error('Error in bulk action:', error);
      toast.error(`Failed to ${action.replace('-', ' ')}. Please try again.`);
    } finally {
      setSaving(prev => ({ ...prev, bulk: false }));
    }
  };

  const applyPreset = async (preset: ConfigurationPreset) => {
    if (!user) return;

    setSaving(prev => ({ ...prev, [preset]: true }));

    try {
      console.log('Applying preset:', preset);
      await EnhancedModelService.applyPreset(user.id, dealId || null, preset, models);
      await loadData();
      toast.success(`${preset.charAt(0).toUpperCase() + preset.slice(1).replace('-', ' ')} preset applied`);
    } catch (error) {
      console.error('Error applying preset:', error);
      toast.error('Failed to apply preset. Please try again.');
    } finally {
      setSaving(prev => ({ ...prev, [preset]: false }));
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

  const formatCost = (costPer1k: number): string => {
    return `$${costPer1k.toFixed(4)}/1K tokens`;
  };

  const getCostEfficiencyColor = (efficiency: string) => {
    switch (efficiency) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRecommendationBadge = (level: string) => {
    switch (level) {
      case 'recommended':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="h-3 w-3 mr-1" />Recommended</Badge>;
      case 'acceptable':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><AlertTriangle className="h-3 w-3 mr-1" />Acceptable</Badge>;
      default:
        return null;
    }
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <h2 className="text-xl font-semibold">
            {dealId ? 'Deal-Specific Model Settings' : 'Global Model Settings'}
          </h2>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('set-all-testing')}
              disabled={saving.bulk}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              {saving.bulk ? 'Updating...' : 'Set All to Testing'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('set-recommended')}
              disabled={saving.bulk}
              className="flex items-center gap-2"
            >
              <Target className="h-4 w-4" />
              {saving.bulk ? 'Applying...' : 'Apply Recommended'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkAction('reset-all')}
              disabled={saving.bulk}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              {saving.bulk ? 'Resetting...' : 'Reset to Defaults'}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Label className="text-sm font-medium">Presets:</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyPreset('cost-optimized')}
              disabled={saving['cost-optimized']}
            >
              {saving['cost-optimized'] ? 'Applying...' : 'Cost-Optimized'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyPreset('performance-optimized')}
              disabled={saving['performance-optimized']}
            >
              {saving['performance-optimized'] ? 'Applying...' : 'Performance'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => applyPreset('balanced')}
              disabled={saving['balanced']}
            >
              {saving['balanced'] ? 'Applying...' : 'Balanced'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Model Configurations */}
      <div className="grid gap-6">
        {useCases.map((useCase) => {
          const availableModels = EnhancedModelService.getModelRecommendations(
            models.filter(m => m.use_case === useCase.value),
            useCase.value
          );
          const selectedModelId = getModelForUseCase(useCase.value);
          const selectedModel = selectedModelId ? availableModels.find(m => m.id === selectedModelId) : undefined;
          const isTestingMode = getTestingModeForUseCase(useCase.value);

          return (
            <Card key={useCase.value}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {useCase.icon}
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
                      onValueChange={(value) => saveConfiguration(useCase.value, value, undefined)}
                      disabled={saving[`${useCase.value}-model`]}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <span>{model.name}</span>
                                {model.recommendation && getRecommendationBadge(model.recommendation.level)}
                              </div>
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
                      onCheckedChange={(checked) => saveConfiguration(useCase.value, undefined, checked)}
                      disabled={saving[`${useCase.value}-testing`]}
                    />
                    <Label htmlFor={`testing-${useCase.value}`}>Testing Mode</Label>
                  </div>
                </div>

                {selectedModel && (
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    {selectedModel.recommendation && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>{selectedModel.recommendation.level.charAt(0).toUpperCase() + selectedModel.recommendation.level.slice(1)}:</strong> {selectedModel.recommendation.reason}
                        </AlertDescription>
                      </Alert>
                    )}

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

                    {selectedModel.recommendation && (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Cost Efficiency:</span>
                          <span className={getCostEfficiencyColor(selectedModel.recommendation.costEfficiency)}>
                            {selectedModel.recommendation.costEfficiency}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Quality Rating:</span>
                          <span>{selectedModel.recommendation.qualityRating}/10</span>
                        </div>
                      </div>
                    )}

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
