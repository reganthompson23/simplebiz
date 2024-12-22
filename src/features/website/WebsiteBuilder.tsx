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
import { Save } from 'lucide-react';

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
  
  // Local state for field editing
  const [editingContent, setEditingContent] = React.useState<WebsiteContent>(defaultContent);
  
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

  // Update local state when website data loads
  React.useEffect(() => {
    if (website?.content) {
      setEditingContent(website.content);
    }
  }, [website]);

  // Get our atomic update functions
  const { updateField, updateArray, isUpdating } = useWebsiteContent(website?.id);

  // Handle field changes (local state only)
  const handleFieldChange = (path: string[], value: any) => {
    setEditingContent(prev => {
      const newContent = { ...prev };
      
      if (path.length === 1) {
        // Top level field
        return {
          ...newContent,
          [path[0]]: value
        };
      }
      
      if (path.length === 2) {
        // Nested one level (e.g., theme.primaryColor)
        return {
          ...newContent,
          [path[0]]: {
            ...newContent[path[0]],
            [path[1]]: value
          }
        };
      }
      
      if (path.length === 3) {
        // Nested two levels (e.g., leadForm.fields.name)
        return {
          ...newContent,
          [path[0]]: {
            ...newContent[path[0]],
            [path[1]]: {
              ...newContent[path[0]][path[1]],
              [path[2]]: value
            }
          }
        };
      }
      
      return newContent;
    });
  };

  // Handle saving a field
  const handleSaveField = async (path: string[], value: any) => {
    try {
      await updateField(path, value);
      // Refetch the website data to ensure we have the latest state
      await queryClient.invalidateQueries({ queryKey: ['website'] });
      toast({
        title: 'Success',
        description: 'Field updated successfully',
        type: 'success',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update field',
        type: 'error',
      });
    }
  };

  // Handle service changes (local state)
  const handleServiceChange = (index: number, value: string) => {
    setEditingContent(prev => {
      const newServices = [...prev.services];
      newServices[index] = value;
      return { ...prev, services: newServices };
    });
  };

  const handleSaveService = (index: number, value: string) => {
    updateArray.mutate({
      path: ['services'],
      operation: 'update',
      index,
      value
    });
  };

  const addService = () => {
    setEditingContent(prev => ({
      ...prev,
      services: [...prev.services, '']
    }));
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
  const baseUrl = 'https://litebiz.co';
  const websiteUrl = `${baseUrl}/${previewSubdomain}`;

  // Helper component for input fields with save button
  const FieldWithSave = ({ 
    label, 
    value, 
    path, 
    onChange, 
    onSave,
    type = 'text',
    component: Component = Input,
    allowUpload = false
  }: { 
    label: string;
    value: string;
    path: string[];
    onChange: (value: string) => void;
    onSave: () => Promise<void>;
    type?: string;
    component?: typeof Input | typeof Textarea;
    allowUpload?: boolean;
  }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(value);
    const [isUploading, setIsUploading] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Update edit value when prop value changes
    React.useEffect(() => {
      if (!isEditing) {
        setEditValue(value);
      }
    }, [value, isEditing]);

    const handleSave = async () => {
      try {
        // First update the parent state
        onChange(editValue);
        // Then save to database using the current editValue
        await handleSaveField(path, editValue);
        // Finally exit edit mode
        setIsEditing(false);
      } catch (error) {
        // If save fails, stay in edit mode
        console.error('Save failed:', error);
      }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        setIsUploading(true);

        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `website-images/${fileName}`;

        const { data, error } = await supabase.storage
          .from('public')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('public')
          .getPublicUrl(filePath);

        // Update the field value
        setEditValue(publicUrl);
        onChange(publicUrl);
        await handleSaveField(path, publicUrl);

        toast({
          title: 'Success',
          description: 'Image uploaded successfully',
          type: 'success',
        });
      } catch (error) {
        console.error('Upload failed:', error);
        toast({
          title: 'Error',
          description: 'Failed to upload image',
          type: 'error',
        });
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    return (
      <div>
        <label className="block text-sm font-medium mb-2">
          {label}
        </label>
        <div className="flex gap-2">
          <Component
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            disabled={!isEditing}
            className="flex-1"
          />
          {allowUpload && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3"
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
            </>
          )}
          {!isEditing ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="px-3"
            >
              Edit
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleSave}
                disabled={isUpdating}
                className="px-3"
              >
                <Save className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditValue(value); // Reset to original value
                }}
                className="px-3"
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

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
                  <FieldWithSave
                    label="Business Name"
                    value={editingContent.businessName}
                    path={['businessName']}
                    onChange={(value) => handleFieldChange(['businessName'], value)}
                    onSave={() => handleSaveField(['businessName'], editingContent.businessName)}
                  />

                  <FieldWithSave
                    label="About Us"
                    value={editingContent.aboutUs}
                    path={['aboutUs']}
                    onChange={(value) => handleFieldChange(['aboutUs'], value)}
                    onSave={() => handleSaveField(['aboutUs'], editingContent.aboutUs)}
                    component={Textarea}
                  />

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Services
                    </label>
                    {editingContent.services.map((service, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <Input 
                          value={service}
                          onChange={(e) => handleServiceChange(index, e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleSaveService(index, service)}
                          disabled={isUpdating}
                          className="px-3"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
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
                    <FieldWithSave
                      label="Phone"
                      value={editingContent.contactInfo.phone}
                      path={['contactInfo', 'phone']}
                      onChange={(value) => handleFieldChange(['contactInfo', 'phone'], value)}
                      onSave={() => handleSaveField(['contactInfo', 'phone'], editingContent.contactInfo.phone)}
                    />
                    <FieldWithSave
                      label="Email"
                      value={editingContent.contactInfo.email}
                      path={['contactInfo', 'email']}
                      onChange={(value) => handleFieldChange(['contactInfo', 'email'], value)}
                      onSave={() => handleSaveField(['contactInfo', 'email'], editingContent.contactInfo.email)}
                    />
                    <div className="col-span-2">
                      <FieldWithSave
                        label="Address"
                        value={editingContent.contactInfo.address}
                        path={['contactInfo', 'address']}
                        onChange={(value) => handleFieldChange(['contactInfo', 'address'], value)}
                        onSave={() => handleSaveField(['contactInfo', 'address'], editingContent.contactInfo.address)}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="design">
                <div className="space-y-8 p-6">
                  <div className="grid gap-6">
                    <FieldWithSave
                      label="Top Image"
                      value={editingContent.theme.topImage}
                      path={['theme', 'topImage']}
                      onChange={(value) => handleFieldChange(['theme', 'topImage'], value)}
                      onSave={() => handleSaveField(['theme', 'topImage'], editingContent.theme.topImage)}
                      type="url"
                      allowUpload
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Browse professional royalty free images in{' '}
                      <a 
                        href="https://unsplash.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        Unsplash
                      </a>
                      {' '}to find the perfect hero image for your business. Right click and copy image address from any image on the internet and paste it in the line above to display it as your hero image on your website.
                    </p>

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
                          value={editingContent.theme.overlayOpacity}
                          onChange={(e) => handleFieldChange(['theme', 'overlayOpacity'], parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-sm text-gray-600 w-12">
                          {editingContent.theme.overlayOpacity}%
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleSaveField(['theme', 'overlayOpacity'], editingContent.theme.overlayOpacity)}
                          disabled={isUpdating}
                          className="px-3"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
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
                            value={editingContent.theme.primaryColor}
                            onChange={(e) => handleFieldChange(['theme', 'primaryColor'], e.target.value)}
                            className="h-10 w-20 p-1 cursor-pointer"
                          />
                        </div>
                        <Input
                          type="text"
                          value={editingContent.theme.primaryColor}
                          onChange={(e) => handleFieldChange(['theme', 'primaryColor'], e.target.value)}
                          className="w-32 uppercase"
                          maxLength={7}
                        />
                        <div 
                          className="w-10 h-10 rounded border"
                          style={{ backgroundColor: editingContent.theme.primaryColor }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleSaveField(['theme', 'primaryColor'], editingContent.theme.primaryColor)}
                          disabled={isUpdating}
                          className="px-3"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
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
                            value={editingContent.theme.secondaryColor}
                            onChange={(e) => handleFieldChange(['theme', 'secondaryColor'], e.target.value)}
                            className="h-10 w-20 p-1 cursor-pointer"
                          />
                        </div>
                        <Input
                          type="text"
                          value={editingContent.theme.secondaryColor}
                          onChange={(e) => handleFieldChange(['theme', 'secondaryColor'], e.target.value)}
                          className="w-32 uppercase"
                          maxLength={7}
                        />
                        <div 
                          className="w-10 h-10 rounded border"
                          style={{ backgroundColor: editingContent.theme.secondaryColor }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleSaveField(['theme', 'secondaryColor'], editingContent.theme.secondaryColor)}
                          disabled={isUpdating}
                          className="px-3"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
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
                        handleSaveField(['theme', 'primaryColor'], '#2563eb');
                        handleSaveField(['theme', 'secondaryColor'], '#1e40af');
                      }}
                      className="w-full"
                    >
                      Reset to Default Colors
                    </Button>
                  </div>

                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium mb-2">Color Preview</h3>
                    <div className="space-y-2">
                      <div className="h-10 rounded" style={{ backgroundColor: editingContent.theme.primaryColor }}>
                        <div className="p-2 text-white text-sm">Primary Color</div>
                      </div>
                      <div className="h-10 rounded" style={{ backgroundColor: editingContent.theme.secondaryColor }}>
                        <div className="p-2 text-white text-sm">Secondary Color</div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="leadForm">
                <div className="space-y-6 p-6">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={editingContent.leadForm.enabled}
                      onChange={(e) => handleFieldChange(['leadForm', 'enabled'], e.target.checked)}
                    />
                    <label className="text-sm font-medium">
                      Enable Lead Form
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleSaveField(['leadForm', 'enabled'], editingContent.leadForm.enabled)}
                      disabled={isUpdating}
                      className="px-3 ml-auto"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>

                  {editingContent.leadForm.enabled && (
                    <div className="space-y-4">
                      {Object.entries(editingContent.leadForm.fields).map(([field, enabled]) => (
                        <div key={field} className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => handleFieldChange(['leadForm', 'fields', field], e.target.checked)}
                          />
                          <label className="text-sm">{field.charAt(0).toUpperCase() + field.slice(1)} Field</label>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleSaveField(['leadForm', 'fields', field], editingContent.leadForm.fields[field])}
                            disabled={isUpdating}
                            className="px-3 ml-auto"
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
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