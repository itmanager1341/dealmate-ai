
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search";
import { Button } from "@/components/ui/button";
import { Archive, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { DealCard } from "@/components/DealCard";
import { Deal } from "@/types";

export default function ArchivePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Dummy data for archived deals
  const archivedDeals: Deal[] = [
    {
      id: "1",
      name: "Project Alpha",
      company_name: "Alpha Corp",
      industry: "Technology",
      status: "archived",
      created_at: "2024-03-15T10:30:00Z",
      updated_at: "2024-04-20T14:45:00Z",
      created_by: "user-1"
    },
    {
      id: "2",
      name: "Project Beta",
      company_name: "Beta Industries",
      industry: "Manufacturing",
      status: "archived",
      created_at: "2024-02-10T09:15:00Z",
      updated_at: "2024-03-25T11:20:00Z",
      created_by: "user-1"
    },
    {
      id: "3",
      name: "Project Gamma",
      company_name: "Gamma Services",
      industry: "Financial Services",
      status: "archived",
      created_at: "2024-01-05T16:45:00Z",
      updated_at: "2024-02-18T13:10:00Z",
      created_by: "user-1"
    }
  ];
  
  const filteredDeals = archivedDeals.filter(
    (deal) =>
      deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (deal.industry && deal.industry.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  
  const handleRefresh = () => {
    setLoading(true);
    
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };
  
  return (
    <div className="dealmate-content">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Archive</h1>
          <p className="text-muted-foreground mt-1">Access completed deals and reusable templates</p>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput
            placeholder="Search archive..."
            value={searchTerm}
            onChange={handleSearch}
            className="md:w-64"
          />
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Archive className="h-5 w-5 mr-2" />
              Archived Deals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredDeals.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {filteredDeals.map((deal) => (
                    <DealCard key={deal.id} deal={deal} />
                  ))}
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={filteredDeals.length < 9}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Archive className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-1">No archived deals found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? "Try a different search term" : "Archived deals will appear here"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Archive className="h-5 w-5 mr-2" />
              Saved Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Archive className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No templates available</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Save agent prompts as templates for reuse
              </p>
              <Button variant="outline">Create Template</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
