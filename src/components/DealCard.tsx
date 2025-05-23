
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, File } from "lucide-react";
import { Link } from "react-router-dom";
import { type Deal } from "@/types";
import { cn } from "@/lib/utils";

interface DealCardProps {
  deal: Deal;
  className?: string;
}

const getStatusColor = (status: Deal['status']) => {
  switch (status) {
    case 'active':
      return 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30';
    case 'pending':
      return 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30';
    case 'archived':
      return 'bg-slate-500/20 text-slate-400 hover:bg-slate-500/30';
    default:
      return 'bg-slate-500/20 text-slate-400 hover:bg-slate-500/30';
  }
};

export function DealCard({ deal, className }: DealCardProps) {
  const formattedDate = new Date(deal.updated_at).toLocaleDateString();
  
  return (
    <Card className={cn("overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/20", className)}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-bold line-clamp-1">{deal.name}</CardTitle>
          <Badge className={cn("font-normal capitalize", getStatusColor(deal.status))}>
            {deal.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-1">{deal.company_name}</p>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Calendar className="h-4 w-4" />
          <span>Updated {formattedDate}</span>
        </div>
        {deal.industry && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <File className="h-4 w-4" />
            <span>{deal.industry}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button asChild className="w-full" variant="secondary">
          <Link to={`/deal/${deal.id}`}>
            Open Workspace
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
