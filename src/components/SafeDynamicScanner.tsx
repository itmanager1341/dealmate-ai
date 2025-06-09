
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

export class SafeDynamicScanner {
  private static readonly MAX_DEPTH = 5;
  private static readonly MAX_FIELDS = 100;
  private static readonly TIMEOUT_MS = 3000;

  static async scanDataSafely(data: any, basePath = '', depth = 0): Promise<ScannedField[]> {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        console.warn('Dynamic scanning timed out, returning empty results');
        resolve([]);
      }, this.TIMEOUT_MS);

      try {
        const result = this.scanDataSync(data, basePath, depth);
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        console.error('Error during dynamic scanning:', error);
        clearTimeout(timeoutId);
        resolve([]);
      }
    });
  }

  private static scanDataSync(data: any, basePath = '', depth = 0): ScannedField[] {
    const fields: ScannedField[] = [];
    
    // Safety guards
    if (!data || typeof data !== 'object' || depth >= this.MAX_DEPTH || fields.length >= this.MAX_FIELDS) {
      return fields;
    }

    try {
      Object.entries(data).forEach(([key, value]) => {
        if (fields.length >= this.MAX_FIELDS) return;

        const currentPath = basePath ? `${basePath}.${key}` : key;
        
        try {
          const category = this.categorizeFieldSafely(key, value);
          const suggestedLabel = this.generateLabelSafely(key, category);
          
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

          // Recursively scan nested objects with depth limit
          if (field.isObject && !this.isSimpleObject(value) && depth < this.MAX_DEPTH - 1) {
            field.children = this.scanDataSync(value, currentPath, depth + 1);
          }

          fields.push(field);
        } catch (fieldError) {
          console.warn(`Error processing field ${key}:`, fieldError);
          // Continue processing other fields
        }
      });
    } catch (error) {
      console.error('Error during object scanning:', error);
    }

    return fields.slice(0, this.MAX_FIELDS);
  }

  static groupIntoSections(fields: ScannedField[]): DataSection[] {
    try {
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
    } catch (error) {
      console.error('Error grouping sections:', error);
      return [];
    }
  }

  private static categorizeFieldSafely(key: string, value: any): string {
    try {
      return FieldMetadataService.categorizeField(key, value);
    } catch (error) {
      // Fallback to simple categorization
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
  }

  private static generateLabelSafely(key: string, category: string): string {
    try {
      return FieldMetadataService.generateLabel(key, category);
    } catch (error) {
      // Fallback to simple label generation
      return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
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
