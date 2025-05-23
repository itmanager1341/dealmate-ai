
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Compare() {
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  
  const handleAddDeal = () => {
    setSelectedDeals([...selectedDeals, ""]);
  };
  
  const handleDealChange = (value: string, index: number) => {
    const updatedDeals = [...selectedDeals];
    updatedDeals[index] = value;
    setSelectedDeals(updatedDeals);
  };
  
  const handleRemoveDeal = (index: number) => {
    const updatedDeals = selectedDeals.filter((_, i) => i !== index);
    setSelectedDeals(updatedDeals);
  };
  
  const handleCompare = () => {
    const validDeals = selectedDeals.filter(deal => deal !== "");
    
    if (validDeals.length < 2) {
      toast.error("Please select at least two deals to compare");
      return;
    }
    
    toast.info("This feature is coming soon");
  };
  
  return (
    <div className="dealmate-content">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">Compare Deals</h1>
        <p className="text-muted-foreground mb-6">Select two or more deals to compare key metrics side by side</p>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Deals</CardTitle>
            <CardDescription>Choose the deals you want to compare</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedDeals.length > 0 ? (
                selectedDeals.map((deal, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Label htmlFor={`deal-${index}`} className="sr-only">
                        Deal {index + 1}
                      </Label>
                      <Select value={deal} onValueChange={(value) => handleDealChange(value, index)}>
                        <SelectTrigger id={`deal-${index}`}>
                          <SelectValue placeholder={`Select deal ${index + 1}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="deal1">Alpha Acquisition</SelectItem>
                          <SelectItem value="deal2">Beta Buyout</SelectItem>
                          <SelectItem value="deal3">Gamma Growth</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDeal(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">No deals selected for comparison</p>
                </div>
              )}
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleAddDeal}>
                  Add Deal
                </Button>
                <Button onClick={handleCompare} disabled={selectedDeals.length < 2}>
                  Compare
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Comparison</CardTitle>
              <CardDescription>Annual revenue across selected deals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border rounded-md bg-muted/20">
                <p className="text-muted-foreground">Revenue comparison chart will appear here</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>EBITDA Comparison</CardTitle>
              <CardDescription>EBITDA metrics across selected deals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border rounded-md bg-muted/20">
                <p className="text-muted-foreground">EBITDA comparison chart will appear here</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Key Metrics Table</CardTitle>
              <CardDescription>Side-by-side comparison of all metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border rounded-md bg-muted/20">
                <p className="text-muted-foreground">Metrics comparison table will appear here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
