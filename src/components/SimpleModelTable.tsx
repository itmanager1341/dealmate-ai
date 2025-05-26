
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ModelService } from '@/services/modelService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Settings, DollarSign } from 'lucide-react';
import type { AIModel, ModelConfiguration, ModelUseCase } from '@/types/models';

interface SimpleModelTableProps {
  dealId?: string;
}

export function SimpleModelTable({ dealId }: SimpleModelTableProps) {
  const [models, setModels] = useState<AIModel[]>([]);
  const [configurations, setConfigurations] = useState<ModelConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const useCases: { value: ModelUseCase; label: string }[] = [
    { value: 'cim_analysis', label: 'CIM Analysis' },
    { value: 'document_processing', label: 'Document Processing' },
    { value: 'excel_analysis', label: 'Excel Analysis' },
    { value: 'audio_transcription', label: 'Audio Transcription' },
    { value: 'memo_generation', label: 'Memo Generation' },
    { value: 'general_analysis', label: 'General Analysis' }
  ];

  useEffect(() => {
    loadData();
  }, [dealId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (!user) {
        setLoading(false);
        return;
      }

      const [modelsData, configurationsData] = await Promise.all([
        ModelService.getAvailableModels(),
        ModelService.getUserModelConfigurations(user.id, dealId)
      ]);

      setModels(modelsData);
      setConfigurations(configurationsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load model settings');
    } finally {
      setLoading(false);
    }
  };

  const getAssignedModel = (useCase: ModelUseCase): string | undefined => {
    const config = configurations.find(c => c.use_case === useCase);
    return config?.model_id;
  };

  const getTestingMode = (useCase: ModelUseCase): boolean => {
    const config = configurations.find(c => c.use_case === useCase);
    return config?.is_testing_mode || false;
  };

  const saveConfiguration = async (useCase: ModelUseCase, modelId?: string, isTestingMode?: boolean) => {
    if (!user) return;

    const savingKey = `${useCase}-${modelId ? 'model' : 'testing'}`;
    setSaving(savingKey);

    try {
      const existing = configurations.find(c => c.use_case === useCase);
      
      await ModelService.saveModelConfiguration({
        user_id: user.id,
        deal_id: dealId || null,
        use_case: useCase,
        model_id: modelId !== undefined ? modelId : (existing?.model_id || ''),
        is_testing_mode: isTestingMode !== undefined ? isTestingMode : (existing?.is_testing_mode || false)
      });

      await loadData();
      toast.success('Configuration saved');
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(null);
    }
  };

  const formatCost = (cost: number): string => {
    return `$${cost.toFixed(4)}/1K`;
  };

  const isModelCompatible = (model: AIModel, useCase: ModelUseCase): boolean => {
    return model.compatible_use_cases?.includes(useCase) || false;
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            AI Model Configuration
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Assign AI models to different analysis tasks. Costs shown are per 1,000 tokens.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Input Cost</TableHead>
                <TableHead>Output Cost</TableHead>
                <TableHead>Capabilities</TableHead>
                <TableHead>Description</TableHead>
                {useCases.map(useCase => (
                  <TableHead key={useCase.value} className="text-center min-w-[120px]">
                    {useCase.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model) => (
                <TableRow key={model.id}>
                  <TableCell className="font-medium">
                    <div className="space-y-1">
                      <div className="font-semibold">{model.name}</div>
                      <div className="flex gap-1">
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
                  </TableCell>
                  <TableCell className="text-green-600">
                    {formatCost(model.cost_per_input_token)}
                  </TableCell>
                  <TableCell className="text-red-600">
                    {formatCost(model.cost_per_output_token)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {model.supports_vision && (
                        <Badge variant="outline" className="text-xs text-green-600">Vision</Badge>
                      )}
                      {model.supports_function_calling && (
                        <Badge variant="outline" className="text-xs text-blue-600">Functions</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {model.performance_score}/10 Quality
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="text-sm text-muted-foreground">
                      {model.description}
                    </div>
                  </TableCell>
                  {useCases.map(useCase => {
                    const isCompatible = isModelCompatible(model, useCase.value);
                    const isAssigned = getAssignedModel(useCase.value) === model.id;
                    const isTestingMode = getTestingMode(useCase.value);
                    
                    return (
                      <TableCell key={useCase.value} className="text-center">
                        {isCompatible ? (
                          <div className="space-y-2">
                            <Button
                              variant={isAssigned ? "default" : "outline"}
                              size="sm"
                              onClick={() => saveConfiguration(useCase.value, model.id)}
                              disabled={saving === `${useCase.value}-model`}
                              className="w-full text-xs"
                            >
                              {isAssigned ? 'Assigned' : 'Assign'}
                            </Button>
                            {isAssigned && (
                              <div className="flex items-center justify-center gap-1">
                                <Switch
                                  checked={isTestingMode}
                                  onCheckedChange={(checked) => 
                                    saveConfiguration(useCase.value, undefined, checked)
                                  }
                                  disabled={saving === `${useCase.value}-testing`}
                                />
                                <span className="text-xs text-muted-foreground">Test</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
