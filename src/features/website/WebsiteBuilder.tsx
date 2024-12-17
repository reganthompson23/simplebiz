import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Website, WebsiteContent, defaultContent } from './types';
import { useAuth } from '../../hooks/useAuth';
import { useWebsiteContent } from '../../hooks/useWebsiteContent';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Card } from '../../components/ui/Card';
import { toast } from '../../components/ui/Toast';
import WebsitePreview from './WebsitePreview';

function generateSubdomain(businessName: string | undefined): string {
  if (!businessName) return '';
  return businessName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 63);
}

export default function WebsiteBuilder() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [previewMode, setPreviewMode] = React.useState(false);
  
  // Load website data
  const { data: website, isLoading, error: websiteError } = useQuery({
    queryKey: ['website'],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .eq('profile_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as Website | null;
    },
    enabled: !!user?.id,
  });

  // Get our atomic update functions
  const { updateField, updateArray, isUpdating } = useWebsiteContent(website?.id);

  // Handle field changes
  const handleFieldChange = (path: string[], value: any) => {
    updateField(path, value);
  };

  // Handle service changes
  const addService = () => {
    updateArray.mutate({
      path: ['services'],
      operation: 'add',
      value: ''
    });
  };

  const updateService = (index: number, value: string) => {
    updateArray.mutate({
      path: ['services'],
      operation: 'update',
      index,
      value
    });
  };

  const removeService = (index: number) => {
    updateArray.mutate({
      path: ['services'],
      operation: 'remove',
      index
    });
  };

  // Publication mutation
  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!website) throw new Error('No website to publish');
      if (!user?.id) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('websites')
        .update({ 
          published: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', website.id)
        .eq('profile_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website'] });
      toast({
        title: 'Success',
        description: 'Your website has been published and is now live.',
        type: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        type: 'error',
      });
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (websiteError) {
    return (
      <div className="p-4 text-red-600">
        Error loading website: {websiteError.message}
      </div>
    );
  }

  if (!user) {
    return <div>Please log in to access the website builder.</div>;
  }

  const content = website?.content || defaultContent;
  const previewSubdomain = generateSubdomain(content.businessName);
  const baseUrl = 'https://simplebizsites.netlify.app';
  const websiteUrl = `${baseUrl}/sites/${previewSubdomain}`;

  return (
    <div className="container mx-auto py-8 px-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8 px-2">
        <h1 className="text-3xl font-bold">Website Builder</h1>
        <div className="space-x-4">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? 'Edit Mode' : 'Preview Mode'}
          </Button>
          <Button
            variant="primary"
            onClick={() => publishMutation.mutate()}
            disabled={publishMutation.isPending || !content.businessName}
          >
            {publishMutation.isPending ? 'Publishing...' : (website?.published ? 'Published' : 'Publish Website')}
          </Button>
        </div>
      </div>

      {previewMode ? (
        <WebsitePreview content={content} />
      ) : (
        <div className="px-2">
          <Card>
            <Tabs defaultValue="content">
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="leadForm">Lead Form</TabsTrigger>
              </TabsList>

              <TabsContent value="content">
                <div className="space-y-6 p-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Business Name
                    </label>
                    <Input 
                      value={content.businessName}
                      onChange={(e) => handleFieldChange(['businessName'], e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      About Us
                    </label>
                    <Textarea 
                      value={content.aboutUs}
                      onChange={(e) => handleFieldChange(['aboutUs'], e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Services
                    </label>
                    {content.services.map((service, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <Input 
                          value={service}
                          onChange={(e) => updateService(index, e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => removeService(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addService}
                    >
                      Add Service
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Phone
                      </label>
                      <Input 
                        value={content.contactInfo.phone}
                        onChange={(e) => handleFieldChange(['contactInfo', 'phone'], e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Email
                      </label>
                      <Input 
                        value={content.contactInfo.email}
                        onChange={(e) => handleFieldChange(['contactInfo', 'email'], e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        Address
                      </label>
                      <Input 
                        value={content.contactInfo.address}
                        onChange={(e) => handleFieldChange(['contactInfo', 'address'], e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="design">
                <div className="space-y-8 p-6">
                  <div className="grid gap-6">
                    <div className="space-y-4">
                      <label className="block text-sm font-medium mb-2">
                        Top Image
                      </label>
                      <div className="space-y-2">
                        <Input
                          type="url"
                          placeholder="Enter image URL (e.g., https://images.unsplash.com/...)"
                          value={content.theme.topImage}
                          onChange={(e) => handleFieldChange(['theme', 'topImage'], e.target.value)}
                        />
                        <p className="text-sm text-gray-500">
                          Tip: Use a high-quality image from{' '}
                          <a 
                            href="https://unsplash.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            Unsplash
                          </a>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-sm font-medium mb-2">
                        Overlay Opacity
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={content.theme.overlayOpacity}
                          onChange={(e) => handleFieldChange(['theme', 'overlayOpacity'], parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-sm text-gray-600 w-12">
                          {content.theme.overlayOpacity}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-sm font-medium mb-2">
                        Primary Color
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Input
                            type="color"
                            value={content.theme.primaryColor}
                            onChange={(e) => handleFieldChange(['theme', 'primaryColor'], e.target.value)}
                            className="h-10 w-20 p-1 cursor-pointer"
                          />
                        </div>
                        <Input
                          type="text"
                          value={content.theme.primaryColor}
                          onChange={(e) => handleFieldChange(['theme', 'primaryColor'], e.target.value)}
                          className="w-32 uppercase"
                          maxLength={7}
                        />
                        <div 
                          className="w-10 h-10 rounded border"
                          style={{ backgroundColor: content.theme.primaryColor }}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-sm font-medium mb-2">
                        Secondary Color
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Input
                            type="color"
                            value={content.theme.secondaryColor}
                            onChange={(e) => handleFieldChange(['theme', 'secondaryColor'], e.target.value)}
                            className="h-10 w-20 p-1 cursor-pointer"
                          />
                        </div>
                        <Input
                          type="text"
                          value={content.theme.secondaryColor}
                          onChange={(e) => handleFieldChange(['theme', 'secondaryColor'], e.target.value)}
                          className="w-32 uppercase"
                          maxLength={7}
                        />
                        <div 
                          className="w-10 h-10 rounded border"
                          style={{ backgroundColor: content.theme.secondaryColor }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        handleFieldChange(['theme', 'primaryColor'], '#2563eb');
                        handleFieldChange(['theme', 'secondaryColor'], '#1e40af');
                      }}
                      className="w-full"
                    >
                      Reset to Default Colors
                    </Button>
                  </div>

                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium mb-2">Color Preview</h3>
                    <div className="space-y-2">
                      <div className="h-10 rounded" style={{ backgroundColor: content.theme.primaryColor }}>
                        <div className="p-2 text-white text-sm">Primary Color</div>
                      </div>
                      <div className="h-10 rounded" style={{ backgroundColor: content.theme.secondaryColor }}>
                        <div className="p-2 text-white text-sm">Secondary Color</div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="leadForm">
                <div className="space-y-6 p-6">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={content.leadForm.enabled}
                      onChange={(e) => handleFieldChange(['leadForm', 'enabled'], e.target.checked)}
                    />
                    <label className="text-sm font-medium">
                      Enable Lead Form
                    </label>
                  </div>

                  {content.leadForm.enabled && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={content.leadForm.fields.name}
                          onChange={(e) => handleFieldChange(['leadForm', 'fields', 'name'], e.target.checked)}
                        />
                        <label className="text-sm">Name Field</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={content.leadForm.fields.email}
                          onChange={(e) => handleFieldChange(['leadForm', 'fields', 'email'], e.target.checked)}
                        />
                        <label className="text-sm">Email Field</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={content.leadForm.fields.phone}
                          onChange={(e) => handleFieldChange(['leadForm', 'fields', 'phone'], e.target.checked)}
                        />
                        <label className="text-sm">Phone Field</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={content.leadForm.fields.message}
                          onChange={(e) => handleFieldChange(['leadForm', 'fields', 'message'], e.target.checked)}
                        />
                        <label className="text-sm">Message Field</label>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          Your website will be available at:{' '}
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {websiteUrl}
          </a>
          {!content.businessName && (
            <span className="text-red-500 ml-2">
              (Enter a business name to generate your website URL)
            </span>
          )}
        </p>
      </div>
    </div>
  );
}