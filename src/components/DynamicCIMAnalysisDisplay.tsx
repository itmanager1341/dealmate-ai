
import { CIMAnalysisDisplay } from './CIMAnalysisDisplay';

interface DynamicCIMAnalysisDisplayProps {
  dealId: string;
}

export function DynamicCIMAnalysisDisplay({ dealId }: DynamicCIMAnalysisDisplayProps) {
  return <CIMAnalysisDisplay dealId={dealId} />;
}
