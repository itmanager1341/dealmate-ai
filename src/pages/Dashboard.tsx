
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Upload } from "lucide-react";
import { SearchInput } from "@/components/ui/search";
import { DealCard } from "@/components/DealCard";
import { supabase } from "@/lib/supabase";
import { type Deal } from "@/types";
import { toast } from "sonner";

export default function Dashboard() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const { data, error } = await supabase
          .from('deals')
          .select('*')
          .eq('status', 'active')
          .order('updated_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        setDeals(data || []);
      } catch (error: any) {
        console.error("Error fetching deals:", error);
        toast.error("Failed to load deals");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDeals();
  }, []);

  const filteredDeals = deals.filter(deal => 
    deal.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (deal.company_name && deal.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (deal.industry && deal.industry.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="dealmate-content">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Active Deals</h1>
          <p className="text-muted-foreground mt-1">Manage and track your ongoing due diligence projects</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput
            placeholder="Search deals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:w-64"
          />
          <Button asChild>
            <Link to="/upload">
              <Upload className="h-4 w-4 mr-2" />
              <span>New Deal</span>
            </Link>
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <Card key={index} className="h-52 animate-pulse-subtle">
              <CardContent className="p-0"></CardContent>
            </Card>
          ))}
        </div>
      ) : filteredDeals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <Card className="overflow-hidden border-dashed border-2 hover:border-primary/40 transition-colors">
            <Link to="/upload" className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <PlusCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-1">Upload New Deal</h3>
              <p className="text-sm text-muted-foreground">Start a new M&A due diligence project</p>
            </Link>
          </Card>
          
          {filteredDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <PlusCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">No active deals found</h3>
          <p className="text-sm text-muted-foreground mb-4">Upload a new deal to get started</p>
          <Button asChild>
            <Link to="/upload">
              <Upload className="h-4 w-4 mr-2" />
              <span>New Deal</span>
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
