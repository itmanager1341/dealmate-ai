
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DollarSign, 
  TrendingUp, 
  Building2, 
  Target, 
  Award,
  BarChart3,
  Users,
  Star,
  Info,
  Edit3,
  Eye,
  EyeOff
} from "lucide-react";
import { ScannedField, DataSection } from './DynamicDataScanner';

interface DynamicMetricsGridProps {
  fields: ScannedField[];
  onFieldEdit?: (field: ScannedField, newLabel: string) => void;
}

export function DynamicMetricsGrid({ fields, onFieldEdit }: DynamicMetricsGridProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const handleEdit = (field: ScannedField) => {
    setEditingField(field.path);
    setEditLabel(field.suggestedLabel);
  };

  const handleSave = (field: ScannedField) => {
    onFieldEdit?.(field, editLabel);
    setEditingField(null);
  };

  const formatValue = (value: any, fieldName: string): string => {
    if (typeof value === 'number') {
      if (fieldName.toLowerCase().includes('margin') || fieldName.toLowerCase().includes('cagr')) {
        return `${value}%`;
      }
      if (fieldName.toLowerCase().includes('revenue') || fieldName.toLowerCase().includes('deal')) {
        return `$${value.toLocaleString()}`;
      }
      return value.toLocaleString();
    }
    return String(value);
  };

  const getColorClass = (index: number): string => {
    const colors = [
      'bg-green-50 text-green-700',
      'bg-blue-50 text-blue-700', 
      'bg-purple-50 text-purple-700',
      'bg-orange-50 text-orange-700',
      'bg-gray-50 text-gray-700'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {fields.map((field, index) => (
        <div key={field.path} className={`text-center p-4 rounded-lg ${getColorClass(index)}`}>
          <div className="flex items-center justify-between mb-2">
            {editingField === field.path ? (
              <Input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onBlur={() => handleSave(field)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave(field)}
                className="text-xs h-6"
                autoFocus
              />
            ) : (
              <>
                <p className="text-xs font-medium flex-1">{field.suggestedLabel}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(field)}
                  className="h-4 w-4 p-0"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
          <p className="text-lg font-bold">{formatValue(field.value, field.name)}</p>
          {field.confidence < 0.8 && (
            <Badge variant="outline" className="text-xs mt-1">
              Confidence: {Math.round(field.confidence * 100)}%
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}

interface DynamicArrayRendererProps {
  field: ScannedField;
  onFieldEdit?: (field: ScannedField, newLabel: string) => void;
}

export function DynamicArrayRenderer({ field, onFieldEdit }: DynamicArrayRendererProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const items = Array.isArray(field.value) ? field.value : [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          {field.suggestedLabel}
          <Badge variant="outline" className="text-xs">
            {items.length} items
          </Badge>
        </h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              <p className="text-gray-800 flex-1">{String(item)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface DynamicObjectRendererProps {
  field: ScannedField;
  onFieldEdit?: (field: ScannedField, newLabel: string) => void;
}

export function DynamicObjectRenderer({ field, onFieldEdit }: DynamicObjectRendererProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const renderObjectValue = (obj: any): React.ReactNode => {
    if (!obj || typeof obj !== 'object') {
      return <span className="text-gray-800">{String(obj)}</span>;
    }

    return (
      <div className="space-y-2">
        {Object.entries(obj).map(([key, value]) => (
          <div key={key} className="flex items-start gap-2">
            <span className="text-sm font-medium text-gray-600 min-w-0 flex-shrink-0">
              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
            </span>
            <span className="text-sm text-gray-800">{String(value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">{field.suggestedLabel}</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="p-4 bg-gray-50 rounded-lg">
          {renderObjectValue(field.value)}
        </div>
      )}
    </div>
  );
}

interface DynamicTextRendererProps {
  field: ScannedField;
  maxLength?: number;
  onFieldEdit?: (field: ScannedField, newLabel: string) => void;
}

export function DynamicTextRenderer({ field, maxLength = 500, onFieldEdit }: DynamicTextRendererProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const text = String(field.value);
  const needsTruncation = text.length > maxLength;
  const displayText = isExpanded || !needsTruncation ? text : `${text.slice(0, maxLength)}...`;

  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-gray-900">{field.suggestedLabel}</h4>
      <p className="text-gray-800 leading-relaxed">{displayText}</p>
      {needsTruncation && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-700"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </Button>
      )}
    </div>
  );
}

interface DynamicSectionRendererProps {
  section: DataSection;
  onFieldEdit?: (field: ScannedField, newLabel: string) => void;
}

export function DynamicSectionRenderer({ section, onFieldEdit }: DynamicSectionRendererProps) {
  const getSectionIcon = (category: string) => {
    switch (category) {
      case 'financial': return <DollarSign className="w-5 h-5 text-green-600" />;
      case 'business': return <Building2 className="w-5 h-5 text-blue-600" />;
      case 'competitive': return <Target className="w-5 h-5 text-purple-600" />;
      case 'recommendation': return <Award className="w-5 h-5 text-orange-600" />;
      default: return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const renderField = (field: ScannedField) => {
    if (field.isArray) {
      return <DynamicArrayRenderer key={field.path} field={field} onFieldEdit={onFieldEdit} />;
    }
    if (field.isObject) {
      return <DynamicObjectRenderer key={field.path} field={field} onFieldEdit={onFieldEdit} />;
    }
    if (field.type === 'string' && String(field.value).length > 100) {
      return <DynamicTextRenderer key={field.path} field={field} onFieldEdit={onFieldEdit} />;
    }
    return null; // Will be handled by metrics grid
  };

  const metricsFields = section.fields.filter(f => !f.isArray && !f.isObject && !(f.type === 'string' && String(f.value).length > 100));
  const complexFields = section.fields.filter(f => f.isArray || f.isObject || (f.type === 'string' && String(f.value).length > 100));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getSectionIcon(section.category)}
          {section.title}
          <Badge variant="outline" className="text-xs">
            {section.fields.length} fields
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {metricsFields.length > 0 && (
          <DynamicMetricsGrid fields={metricsFields} onFieldEdit={onFieldEdit} />
        )}
        
        {complexFields.map(field => renderField(field))}
      </CardContent>
    </Card>
  );
}
