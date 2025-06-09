
import { ProgressiveCIMAnalysis } from './ProgressiveCIMAnalysis';

interface DynamicCIMAnalysisDisplayProps {
  dealId: string;
}

export function DynamicCIMAnalysisDisplay({ dealId }: DynamicCIMAnalysisDisplayProps) {
  return <ProgressiveCIMAnalysis dealId={dealId} />;
}
