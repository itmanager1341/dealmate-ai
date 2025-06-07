
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Zap, DollarSign, Target, Settings } from "lucide-react";
import { ModelService } from '@/services/modelService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { ModelUseCase } from '@/types/models';

interface PresetConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  costLevel: 'low' | 'medium' | 'high';
  speedLevel: 'fast' | 'medium' | 'slow';
  qualityLevel: 'good' | 'better' | 'best';
}

const presets: PresetConfig[] = [
  {
    id: 'fast',
    name: 'Fast & Efficient',
    description: 'Optimized for speed and cost-effectiveness',
    icon: Zap,
    color: 'bg-blue-50 border-blue-200 text-blue-800',
    costLevel: 'low',
    speedLevel: 'fast',
    qualityLevel: 'good'
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Best balance of speed, cost, and accuracy',
    icon: Target,
    color: 'bg-green-50 border-green-200 text-green-800',
    costLevel: 'medium',
    speedLevel: 'medium',
    qualityLevel: 'better'
  },
  {
    id: 'accurate',
    name: 'High Accuracy',
    description: 'Maximum quality and detailed analysis',
    icon: Target,
    color: 'bg-purple-50 border-purple-200 text-purple-800',
    costLevel: 'high',
    speedLevel: 'slow',
    qualityLevel: 'best'
  }
];

interface ModelPresetSelectorProps {
  dealId?: string;
}

export function ModelPresetSelector({ dealId }: ModelPresetSelectorProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('balanced');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [applying, setApplying] = useState(false);

  const applyPreset = async (presetId: string) => {
    setApplying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get available models
      const models = await ModelService.getAvailableModels();
      
      // Apply preset logic based on selection
      const useCases: ModelUseCase[] = [
        'cim_analysis',
        'document_processing', 
        'excel_analysis',
        'memo_generation'
      ];

      for (const useCase of useCases) {
        const compatibleModels = models.filter(m => 
          m.compatible_use_cases?.includes(useCase)
        );

        if (compatibleModels.length === 0) continue;

        let selectedModel;
        
        switch (presetId) {
          case 'fast':
            // Choose fastest, cheapest model
            selectedModel = compatibleModels.sort((a, b) => 
              (a.cost_per_input_token + a.cost_per_output_token) - 
              (b.cost_per_input_token + b.cost_per_output_token)
            )[0];
            break;
            
          case 'accurate':
            // Choose highest quality model
            selectedModel = compatibleModels.sort((a, b) => 
              b.performance_score - a.performance_score
            )[0];
            break;
            
          default: // balanced
            // Choose default or best balanced model
            selectedModel = compatibleModels.find(m => m.is_default) || 
                          compatibleModels[0];
        }

        if (selectedModel) {
          await ModelService.saveModelConfiguration({
            user_id: user.id,
            deal_id: dealId || null,
            use_case: useCase,
            model_id: selectedModel.id,
            is_testing_mode: false
          });
        }
      }

      setSelectedPreset(presetId);
      toast.success(`Applied ${presets.find(p => p.id === presetId)?.name} preset`);
    } catch (error) {
      console.error('Error applying preset:', error);
      toast.error('Failed to apply preset');
    } finally {
      setApplying(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quick Model Setup
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Advanced</span>
            <Switch
              checked={showAdvanced}
              onCheckedChange={setShowAdvanced}
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Choose a preset that matches your priorities, or use advanced mode for granular control.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {presets.map((preset) => {
            const IconComponent = preset.icon;
            const isSelected = selectedPreset === preset.id;
            
            return (
              <Card 
                key={preset.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? preset.color : 'hover:bg-gray-50'
                }`}
                onClick={() => applyPreset(preset.id)}
              >
                <CardContent className="p-4 text-center">
                  <div className="flex flex-col items-center space-y-3">
                    <IconComponent className="h-8 w-8" />
                    <div>
                      <h3 className="font-semibold">{preset.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {preset.description}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 justify-center">
                      <Badge variant="outline" className="text-xs">
                        <DollarSign className="h-2 w-2 mr-1" />
                        {preset.costLevel}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Zap className="h-2 w-2 mr-1" />
                        {preset.speedLevel}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Target className="h-2 w-2 mr-1" />
                        {preset.qualityLevel}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {applying && (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              Applying preset configuration...
            </div>
          </div>
        )}

        {showAdvanced && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-4">
              Advanced model configuration is available in the detailed table below.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
