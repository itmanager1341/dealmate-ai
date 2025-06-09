
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DynamicTableRendererProps {
  data: any;
  title?: string;
}

export function DynamicTableRenderer({ data, title }: DynamicTableRendererProps) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  // Flatten nested objects with dot notation - with safety guards
  const flattenObject = (obj: any, prefix = '', depth = 0, visited = new WeakSet()): Record<string, any> => {
    const flattened: Record<string, any> = {};
    
    // Safety guard: prevent infinite recursion with depth limit
    if (depth > 5) {
      return { [`${prefix}_max_depth_reached`]: '[Complex Object]' };
    }
    
    // Safety guard: prevent circular references
    if (visited.has(obj)) {
      return { [`${prefix}_circular_ref`]: '[Circular Reference]' };
    }
    
    // Mark this object as visited
    if (typeof obj === 'object' && obj !== null) {
      visited.add(obj);
    }
    
    try {
      for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(flattened, flattenObject(value, newKey, depth + 1, visited));
        } else {
          flattened[newKey] = value;
        }
      }
    } catch (error) {
      console.error('Error flattening object:', error);
      return { error: 'Failed to process data' };
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

  let flatData: Record<string, any>;
  let entries: [string, any][];

  try {
    flatData = flattenObject(data);
    entries = Object.entries(flatData);
  } catch (error) {
    console.error('Error processing table data:', error);
    return (
      <div className="space-y-2">
        {title && <h4 className="font-semibold text-lg">{title}</h4>}
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">Error processing data for display</p>
        </div>
      </div>
    );
  }

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
