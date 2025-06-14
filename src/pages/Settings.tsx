
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModelUsageAnalytics } from "@/components/ModelUsageAnalytics";
import { APIKeyManagement } from "@/components/APIKeyManagement";
import { ModelPresetSelector } from "@/components/ModelPresetSelector";
import { Settings as SettingsIcon, Bot, Key, BarChart3 } from "lucide-react";
import { SimpleModelTable } from "@/components/SimpleModelTable";

export default function Settings() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage AI models, API keys, and track usage across your platform
          </p>
        </div>
      </div>

      <Tabs defaultValue="models" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="models" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Model Management
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Usage Analytics
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-6">
          {/* Quick Setup Presets */}
          <ModelPresetSelector />
          
          {/* Detailed Model Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Advanced Model Configuration</CardTitle>
              <p className="text-sm text-muted-foreground">
                Fine-tune which AI models to use for each analysis type. Costs shown are per 1 million tokens.
              </p>
            </CardHeader>
            <CardContent>
              <SimpleModelTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Global Usage Analytics</CardTitle>
              <p className="text-sm text-muted-foreground">
                Track AI model usage, costs, and performance across all deals
              </p>
            </CardHeader>
            <CardContent>
              <ModelUsageAnalytics />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Key Management</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage API keys for various AI providers and external services
              </p>
            </CardHeader>
            <CardContent>
              <APIKeyManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
