
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUploader } from "@/components/FileUploader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/supabase";

export default function Upload() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: "",
    company_name: "",
    industry: "",
    description: "",
  });
  
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [dealId, setDealId] = useState<string | null>(null);
  
  const industries = [
    "Technology",
    "Healthcare",
    "Financial Services",
    "Consumer Goods",
    "Industrial",
    "Energy",
    "Real Estate",
    "Telecommunications",
    "Media & Entertainment",
    "Other"
  ];
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleIndustryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, industry: value }));
  };
  
  const handleCreateDeal = async () => {
    if (!formData.name || !formData.company_name) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setLoading(true);
    
    try {
      const user = await getCurrentUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      const { data, error } = await supabase
        .from('deals')
        .insert({
          name: formData.name,
          company_name: formData.company_name,
          industry: formData.industry,
          description: formData.description,
          status: 'active',
          created_by: user.id,
          user_id: user.id
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      if (data && data[0]) {
        toast.success("Deal created successfully");
        setDealId(data[0].id);
        setStep(2);
      }
    } catch (error: any) {
      console.error("Error creating deal:", error);
      toast.error(error.message || "Failed to create deal");
    } finally {
      setLoading(false);
    }
  };
  
  const handleUploadComplete = (files: Array<{ path: string; name: string; type: string; size: number }>) => {
    if (files.length > 0 && dealId) {
      navigate(`/deal/${dealId}/details`);
    }
  };
  
  const handleSkip = () => {
    if (dealId) {
      navigate(`/deal/${dealId}/details`);
    }
  };
  
  return (
    <div className="dealmate-content">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">Upload New Deal</h1>
        <p className="text-muted-foreground mb-6">Create a new M&A due diligence project and upload documents</p>
        
        {step === 1 ? (
          <Card>
            <CardHeader>
              <CardTitle>Deal Information</CardTitle>
              <CardDescription>Enter basic information about the deal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Deal Name <span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Project Horizon"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company_name">Target Company <span className="text-destructive">*</span></Label>
                <Input
                  id="company_name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="e.g., Acme Corporation"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select value={formData.industry} onValueChange={handleIndustryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Brief description of the deal and target company"
                  rows={4}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleCreateDeal} disabled={loading} className="ml-auto">
                {loading ? "Creating..." : "Create Deal"}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Upload Documents</CardTitle>
              <CardDescription>
                Upload PDF, DOCX, XLSX, or MP3 files for analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dealId && (
                <FileUploader
                  dealId={dealId}
                  bucketName="documents"
                  allowedFileTypes={[".pdf", ".docx", ".xlsx", ".mp3"]}
                  onUploadComplete={handleUploadComplete}
                />
              )}
            </CardContent>
            <CardFooter className="justify-end">
              <Button variant="outline" onClick={handleSkip} className="mr-2">
                Skip for now
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
