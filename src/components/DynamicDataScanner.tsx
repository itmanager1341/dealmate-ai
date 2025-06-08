
import { FieldMetadataService, FieldSuggestion } from '@/services/fieldMetadataService';

export interface ScannedField {
  path: string;
  name: string;
  value: any;
  type: string;
  category: string;
  suggestedLabel: string;
  confidence: number;
  isArray: boolean;
  isObject: boolean;
  children?: ScannedField[];
}

export interface DataSection {
  category: string;
  title: string;
  fields: ScannedField[];
  priority: number;
}

export class DynamicDataScanner {
  static scanData(data: any, basePath = ''): ScannedField[] {
    const fields: ScannedField[] = [];
    
    if (!data || typeof data !== 'object') {
      return fields;
    }

    Object.entries(data).forEach(([key, value]) => {
      const currentPath = basePath ? `${basePath}.${key}` : key;
      const category = FieldMetadataService.categorizeField(key, value);
      const suggestedLabel = FieldMetadataService.generateLabel(key, category);
      
      const field: ScannedField = {
        path: currentPath,
        name: key,
        value,
        type: this.getDataType(value),
        category,
        suggestedLabel,
        confidence: this.calculateConfidence(key, value, category),
        isArray: Array.isArray(value),
        isObject: typeof value === 'object' && value !== null && !Array.isArray(value)
      };

      // Recursively scan nested objects
      if (field.isObject && !this.isSimpleObject(value)) {
        field.children = this.scanData(value, currentPath);
      }

      fields.push(field);
    });

    return fields;
  }

  static groupIntoSections(fields: ScannedField[]): DataSection[] {
    const sections: Map<string, ScannedField[]> = new Map();
    
    fields.forEach(field => {
      const category = field.category;
      if (!sections.has(category)) {
        sections.set(category, []);
      }
      sections.get(category)?.push(field);
    });

    const sectionConfigs = {
      financial: { title: 'Financial Metrics', priority: 1 },
      business: { title: 'Business Model', priority: 2 },
      competitive: { title: 'Competitive Position', priority: 3 },
      recommendation: { title: 'Investment Recommendation', priority: 4 },
      list: { title: 'Key Information', priority: 5 },
      complex: { title: 'Detailed Analysis', priority: 6 },
      general: { title: 'Additional Information', priority: 7 }
    };

    return Array.from(sections.entries())
      .map(([category, fields]) => ({
        category,
        title: sectionConfigs[category]?.title || category.charAt(0).toUpperCase() + category.slice(1),
        fields: fields.sort((a, b) => b.confidence - a.confidence),
        priority: sectionConfigs[category]?.priority || 999
      }))
      .sort((a, b) => a.priority - b.priority);
  }

  private static getDataType(value: any): string {
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object' && value !== null) return 'object';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    return 'string';
  }

  private static calculateConfidence(key: string, value: any, category: string): number {
    let confidence = 0.5; // Base confidence

    // Boost confidence for well-known patterns
    const knownPatterns = [
      /cagr|ebitda|revenue|margin/i,
      /recommendation|decision|action/i,
      /market|competitive|position/i
    ];

    if (knownPatterns.some(pattern => pattern.test(key))) {
      confidence += 0.3;
    }

    // Boost for structured data
    if (typeof value === 'number' || (typeof value === 'string' && value.includes('%'))) {
      confidence += 0.2;
    }

    return Math.min(confidence, 1.0);
  }

  private static isSimpleObject(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return true;
    
    const values = Object.values(obj);
    return values.every(v => 
      typeof v === 'string' || 
      typeof v === 'number' || 
      typeof v === 'boolean' ||
      (typeof v === 'object' && v === null)
    );
  }
}
