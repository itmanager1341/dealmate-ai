
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { FileText, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Transcript {
  id: string;
  document_id: string;
  content: string;
  timestamps: any;
  created_at: string;
  documents?: {
    name: string;
  };
}

interface TranscriptsViewProps {
  dealId: string;
}

export function TranscriptsView({ dealId }: TranscriptsViewProps) {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTranscripts();
  }, [dealId]);

  const fetchTranscripts = async () => {
    try {
      const { data, error } = await supabase
        .from('transcripts')
        .select(`
          *,
          documents!inner(deal_id, name)
        `)
        .eq('documents.deal_id', dealId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTranscripts(data || []);
    } catch (error) {
      console.error("Error fetching transcripts:", error);
      toast.error("Failed to load transcripts");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (transcripts.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-1">No transcripts available</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Process audio files to generate transcripts
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Audio Transcripts ({transcripts.length})</h3>
      </div>

      <div className="space-y-4">
        {transcripts.map((transcript) => (
          <Card key={transcript.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {transcript.documents?.name || 'Unknown Document'}
                </CardTitle>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(transcript.created_at), { addSuffix: true })}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {transcript.content}
                </p>
              </div>
              {transcript.timestamps && (
                <div className="mt-4 pt-4 border-t">
                  <Badge variant="outline" className="text-xs">
                    Timestamped transcript available
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
