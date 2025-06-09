
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DynamicTableRendererProps {
  data: any;
  title?: string;
}

export function DynamicTableRenderer({ data, title }: DynamicTableRendererProps) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  // Flatten nested objects with dot notation
  const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
    const flattened: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(flattened, flattenObject(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    }
    
    return flattened;
  };

  // Format field names for display
  const formatFieldName = (key: string): string => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format values for display
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  };

  const flatData = flattenObject(data);
  const entries = Object.entries(flatData);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {title && <h4 className="font-semibold text-lg">{title}</h4>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Field</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map(([key, value]) => (
            <TableRow key={key}>
              <TableCell className="font-medium">{formatFieldName(key)}</TableCell>
              <TableCell>{formatValue(value)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
