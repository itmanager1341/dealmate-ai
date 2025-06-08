import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Eye, EyeOff, Key, CheckCircle, XCircle, RefreshCw, Server, Globe } from 'lucide-react';
import { getAIServerURL, setAIServerURL, resetAIServerURL, modelApi } from '@/utils/aiApi';

interface APIKey {
  name: string;
  key: string;
  description: string;
  isConfigured: boolean;
  isValid?: boolean;
  lastTested?: string;
}

export function APIKeyManagement() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    {
      name: 'OPENAI_API_KEY',
      key: '',
      description: 'OpenAI API key for GPT models and other AI services',
      isConfigured: false
    },
    {
      name: 'ANTHROPIC_API_KEY',
      key: '',
      description: 'Anthropic API key for Claude models',
      isConfigured: false
    },
    {
      name: 'GOOGLE_API_KEY',
      key: '',
      description: 'Google API key for Gemini models',
      isConfigured: false
    }
  ]);
  
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // AI Server URL management state
  const [serverUrl, setServerUrl] = useState(getAIServerURL());
  const [serverStatus, setServerStatus] = useState<'unknown' | 'online' | 'offline' | 'testing'>('unknown');
  const [serverLoading, setServerLoading] = useState(false);

  useEffect(() => {
    checkConfiguredKeys();
    checkServerStatus();
  }, []);

  const checkConfiguredKeys = async () => {
    try {
      // Check which keys are configured in Supabase Edge Function secrets
      const response = await supabase.functions.invoke('check-api-keys');
      
      if (response.data) {
        setApiKeys(prev => prev.map(key => ({
          ...key,
          isConfigured: response.data.configured?.includes(key.name) || false,
          isValid: response.data.valid?.[key.name],
          lastTested: response.data.lastTested?.[key.name]
        })));
      }
    } catch (error) {
      console.error('Error checking API keys:', error);
    }
  };

  const checkServerStatus = async () => {
    setServerStatus('testing');
    try {
      const isHealthy = await modelApi.checkServerHealth();
      setServerStatus(isHealthy ? 'online' : 'offline');
    } catch (error) {
      console.error('Error checking server status:', error);
      setServerStatus('offline');
    }
  };

  const handleServerUrlUpdate = (value: string) => {
    setServerUrl(value);
  };

  const saveServerUrl = async () => {
    if (!serverUrl.trim()) {
      toast.error('Please enter a valid server URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(serverUrl);
    } catch {
      toast.error('Please enter a valid URL format');
      return;
    }

    setServerLoading(true);
    try {
      setAIServerURL(serverUrl.trim());
      toast.success('AI server URL saved successfully');
      await checkServerStatus();
    } catch (error) {
      console.error('Error saving server URL:', error);
      toast.error('Failed to save server URL');
    } finally {
      setServerLoading(false);
    }
  };

  const testServerConnection = async () => {
    if (!serverUrl.trim()) {
      toast.error('Please enter a server URL first');
      return;
    }

    setServerLoading(true);
    try {
      // Temporarily set the URL for testing without saving
      const originalUrl = getAIServerURL();
      setAIServerURL(serverUrl.trim());
      
      const isHealthy = await modelApi.checkServerHealth();
      
      // Restore original URL if test failed
      if (!isHealthy) {
        setAIServerURL(originalUrl);
      }
      
      setServerStatus(isHealthy ? 'online' : 'offline');
      toast.success(isHealthy ? 'Server connection successful!' : 'Server connection failed');
    } catch (error) {
      console.error('Error testing server connection:', error);
      toast.error('Failed to test server connection');
      setServerStatus('offline');
    } finally {
      setServerLoading(false);
    }
  };

  const resetToDefaultUrl = () => {
    resetAIServerURL();
    setServerUrl(getAIServerURL());
    setServerStatus('unknown');
    toast.success('Reset to default server URL');
  };

  const handleKeyUpdate = (keyName: string, value: string) => {
    setApiKeys(prev => prev.map(key => 
      key.name === keyName ? { ...key, key: value } : key
    ));
  };

  const saveKey = async (keyName: string) => {
    const apiKey = apiKeys.find(k => k.name === keyName);
    if (!apiKey?.key.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }

    setLoading(prev => ({ ...prev, [keyName]: true }));

    try {
      const response = await supabase.functions.invoke('save-api-key', {
        body: {
          keyName,
          keyValue: apiKey.key.trim()
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success(`${keyName} saved successfully`);
      await checkConfiguredKeys();
      
      // Clear the input field
      setApiKeys(prev => prev.map(key => 
        key.name === keyName ? { ...key, key: '' } : key
      ));
    } catch (error) {
      console.error('Error saving API key:', error);
      toast.error(`Failed to save ${keyName}`);
    } finally {
      setLoading(prev => ({ ...prev, [keyName]: false }));
    }
  };

  const testKey = async (keyName: string) => {
    setLoading(prev => ({ ...prev, [`test-${keyName}`]: true }));

    try {
      const response = await supabase.functions.invoke('test-api-key', {
        body: { keyName }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const isValid = response.data?.valid;
      toast.success(isValid ? `${keyName} is valid` : `${keyName} is invalid`);
      
      setApiKeys(prev => prev.map(key => 
        key.name === keyName ? { 
          ...key, 
          isValid,
          lastTested: new Date().toISOString()
        } : key
      ));
    } catch (error) {
      console.error('Error testing API key:', error);
      toast.error(`Failed to test ${keyName}`);
    } finally {
      setLoading(prev => ({ ...prev, [`test-${keyName}`]: false }));
    }
  };

  const toggleKeyVisibility = (keyName: string) => {
    setShowKeys(prev => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  const maskKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '••••••••';
    return `${key.substring(0, 4)}${'•'.repeat(key.length - 8)}${key.substring(key.length - 4)}`;
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Key className="h-4 w-4" />
        <AlertDescription>
          API keys are securely stored in Supabase Edge Function secrets and never exposed in your frontend code.
          Test your keys after saving to ensure they're working correctly.
        </AlertDescription>
      </Alert>

      {/* AI Server Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Server className="h-5 w-5" />
            AI Server Configuration
            <Badge variant="outline" className="flex items-center gap-1">
              {serverStatus === 'online' ? (
                <CheckCircle className="h-3 w-3 text-green-600" />
              ) : serverStatus === 'offline' ? (
                <XCircle className="h-3 w-3 text-red-600" />
              ) : serverStatus === 'testing' ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <Globe className="h-3 w-3" />
              )}
              {serverStatus === 'testing' ? 'Testing...' : 
               serverStatus === 'online' ? 'Online' : 
               serverStatus === 'offline' ? 'Offline' : 'Unknown'}
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure the AI server URL for document processing and analysis. Update this when your RunPod server restarts.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="server-url">AI Server URL</Label>
              <Input
                id="server-url"
                type="url"
                placeholder="https://your-server-url-8000.proxy.runpod.net"
                value={serverUrl}
                onChange={(e) => handleServerUrlUpdate(e.target.value)}
              />
            </div>
            <div className="pt-6 flex gap-2">
              <Button
                variant="outline"
                onClick={testServerConnection}
                disabled={serverLoading || !serverUrl.trim()}
              >
                {serverLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Test
              </Button>
              <Button
                onClick={saveServerUrl}
                disabled={serverLoading || !serverUrl.trim()}
              >
                {serverLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save
              </Button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Current URL: {getAIServerURL()}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToDefaultUrl}
            >
              Reset to Default
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing API Keys Section */}
      <div className="grid gap-6">
        {apiKeys.map((apiKey) => {
          const currentKey = apiKey.key;
          const isTestLoading = loading[`test-${apiKey.name}`];
          const isSaveLoading = loading[apiKey.name];

          return (
            <Card key={apiKey.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {apiKey.name}
                    {apiKey.isConfigured && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        {apiKey.isValid === true ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : apiKey.isValid === false ? (
                          <XCircle className="h-3 w-3 text-red-600" />
                        ) : (
                          <Key className="h-3 w-3" />
                        )}
                        {apiKey.isValid === true ? 'Valid' : 
                         apiKey.isValid === false ? 'Invalid' : 'Configured'}
                      </Badge>
                    )}
                  </CardTitle>
                  {apiKey.isConfigured && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testKey(apiKey.name)}
                      disabled={isTestLoading}
                    >
                      {isTestLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        'Test Key'
                      )}
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {apiKey.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor={`${apiKey.name}-input`}>API Key</Label>
                    <div className="relative">
                      <Input
                        id={`${apiKey.name}-input`}
                        type={showKeys[apiKey.name] ? "text" : "password"}
                        placeholder="Enter your API key..."
                        value={currentKey}
                        onChange={(e) => handleKeyUpdate(apiKey.name, e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => toggleKeyVisibility(apiKey.name)}
                      >
                        {showKeys[apiKey.name] ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="pt-6">
                    <Button
                      onClick={() => saveKey(apiKey.name)}
                      disabled={!currentKey.trim() || isSaveLoading}
                    >
                      {isSaveLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {apiKey.isConfigured ? 'Update' : 'Save'}
                    </Button>
                  </div>
                </div>

                {apiKey.lastTested && (
                  <p className="text-xs text-muted-foreground">
                    Last tested: {new Date(apiKey.lastTested).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
