
import { supabase } from '@/lib/supabase';

export interface FieldMetadata {
  id: string;
  field_pattern: string;
  display_label: string;
  category: string;
  icon_name?: string;
  display_format?: string;
  confidence_score: number;
  user_annotations?: any;
  created_at: string;
  updated_at: string;
}

export interface FieldSuggestion {
  fieldPath: string;
  originalName: string;
  suggestedLabel: string;
  category: string;
  confidence: number;
  icon?: string;
}

export class FieldMetadataService {
  // Built-in field patterns for common CIM fields
  private static builtInPatterns = {
    financial: {
      patterns: [
        /cagr|growth.*rate|compound.*annual/i,
        /ebitda|earnings|profit.*margin/i,
        /revenue|sales|income/i,
        /margin|percentage|%/i,
        /multiple|valuation/i,
        /deal.*size|transaction.*value/i
      ],
      labels: {
        'CAGR': 'Revenue Growth Rate',
        'cagr': 'Growth Rate',
        'EBITDA_margin': 'EBITDA Margin',
        'ebitda_margin': 'Profit Margin',
        'revenue_multiple': 'Revenue Multiple',
        'deal_size_estimate': 'Deal Size',
        '2023_revenue': '2023 Revenue',
        '2024_budgeted_revenue': '2024 Projected Revenue'
      }
    },
    business: {
      patterns: [
        /business.*model|model|services/i,
        /revenue.*stream|income.*source/i,
        /client|customer|market/i,
        /feature|capability|offering/i
      ],
      labels: {
        'services': 'Service Offerings',
        'revenue_streams': 'Revenue Sources',
        'client_focus': 'Target Market',
        'key_features': 'Key Capabilities'
      }
    },
    competitive: {
      patterns: [
        /market.*position|presence|share/i,
        /strength|advantage|differentiator/i,
        /weakness|challenge|risk/i,
        /competition|competitor/i
      ],
      labels: {
        'market_presence': 'Market Position',
        'differentiation': 'Competitive Advantages',
        'awards': 'Recognition & Awards',
        'technology_use': 'Technology Advantage'
      }
    },
    recommendation: {
      patterns: [
        /recommendation|decision|action/i,
        /thesis|rationale|reason/i,
        /return|target|goal/i
      ],
      labels: {
        'investment_thesis': 'Investment Rationale',
        'target_return': 'Return Target',
        'action': 'Recommended Action',
        'decision': 'Investment Decision'
      }
    }
  };

  static categorizeField(fieldName: string, value: any): string {
    const name = fieldName.toLowerCase();
    
    if (this.builtInPatterns.financial.patterns.some(p => p.test(name))) return 'financial';
    if (this.builtInPatterns.business.patterns.some(p => p.test(name))) return 'business';
    if (this.builtInPatterns.competitive.patterns.some(p => p.test(name))) return 'competitive';
    if (this.builtInPatterns.recommendation.patterns.some(p => p.test(name))) return 'recommendation';
    
    // Content-based categorization
    if (typeof value === 'number' || (typeof value === 'string' && value.includes('%'))) {
      return 'financial';
    }
    if (Array.isArray(value)) {
      return 'list';
    }
    if (typeof value === 'object' && value !== null) {
      return 'complex';
    }
    
    return 'general';
  }

  static generateLabel(fieldName: string, category: string): string {
    // Check built-in labels first
    for (const cat of Object.values(this.builtInPatterns)) {
      if (cat.labels[fieldName]) {
        return cat.labels[fieldName];
      }
    }

    // Generate human-friendly label from field name
    return fieldName
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim();
  }

  static async saveFieldMetadata(fieldPattern: string, displayLabel: string, category: string): Promise<void> {
    try {
      await supabase
        .from('field_metadata')
        .insert({
          field_pattern: fieldPattern,
          display_label: displayLabel,
          category,
          confidence_score: 1.0
        });
    } catch (error) {
      console.error('Error saving field metadata:', error);
    }
  }

  static async getFieldMetadata(fieldPattern: string): Promise<FieldMetadata | null> {
    try {
      const { data, error } = await supabase
        .from('field_metadata')
        .select('*')
        .eq('field_pattern', fieldPattern)
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      console.error('Error fetching field metadata:', error);
      return null;
    }
  }
}
