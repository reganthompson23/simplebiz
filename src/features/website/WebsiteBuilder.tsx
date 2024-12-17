import React from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Website, WebsiteContent, defaultContent } from './types';
import { useAuth } from '../../hooks/useAuth';
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
    .slice(0, 63); // Max length for subdomains
}

export default function WebsiteBuilder() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [previewMode, setPreviewMode] = React.useState(false);
  const [currentContent, setCurrentContent] = React.useState<WebsiteContent>(defaultContent);
  
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

  const { register, handleSubmit, watch, setValue, reset, formState } = useForm<WebsiteContent>({
    defaultValues: defaultContent
  });

  // Log form state changes
  React.useEffect(() => {
    console.log('Form state:', formState);
    console.log('Current form values:', watch());
    console.log('Business name value:', watch('businessName'));
  }, [formState, watch]);

  // Update form and current content when website data loads
  React.useEffect(() => {
    if (website?.content) {
      console.log('Loading website content into form:', website.content);
      reset(website.content);
      setCurrentContent(website.content);
    }
  }, [website, reset]);

  // Update current content when form values change
  React.useEffect(() => {
    const subscription = watch((value) => {
      if (value) {
        setCurrentContent(value as WebsiteContent);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const mutation = useMutation({
    mutationFn: async (content: WebsiteContent) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const subdomain = generateSubdomain(content.businessName);
      console.log('Attempting to save content:', content);
      
      try {
        if (website) {
          console.log('Updating existing website:', website.id);
          const { data, error } = await supabase
            .from('websites')
            .update({ 
              content, 
              subdomain,
              updated_at: new Date().toISOString() 
            })
            .eq('id', website.id)
            .select()
            .single();
          
          if (error) throw error;
          return data;
        } else {
          console.log('Creating new website for user:', user.id);
          const { data, error } = await supabase
            .from('websites')
            .insert([{
              profile_id: user.id,
              subdomain,
              content,
              published: false,
            }])
            .select()
            .single();
          
          if (error) throw error;
          return data;
        }
      } catch (error) {
        console.error('Database operation failed:', error);
        throw error;
      }
    },
    onMutate: () => {
      // Optimistically update UI
      toast({
        title: 'Saving...',
        description: 'Your changes are being saved.',
        type: 'default',
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['website'] });
      toast({
        title: 'Success',
        description: 'Your website has been saved.',
        type: 'success',
      });
    },
    onError: (error: any) => {
      console.error('Mutation failed:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save website',
        type: 'error',
      });
    },
    onSettled: () => {
      // Always run after completion (success or error)
      queryClient.invalidateQueries({ queryKey: ['website'] });
    }
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!website) throw new Error('No website to publish');
      if (!user?.id) throw new Error('User not authenticated');
      
      // First save any pending changes
      await mutation.mutateAsync(watch());
      
      // Then update published status
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
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        type: 'error',
      });
    },
  });

  const onSubmit = async (data: WebsiteContent) => {
    if (!user?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to save changes.',
        type: 'error',
      });
      return;
    }
    
    if (mutation.isPending) {
      return;
    }
    
    try {
      // Clean up services array to remove null values
      const cleanedData = {
        ...data,
        services: (data.services || []).filter(service => service !== null && service !== ''),
        contactInfo: {
          phone: data.contactInfo?.phone || '',
          email: data.contactInfo?.email || '',
          address: data.contactInfo?.address || '',
        },
        theme: {
          primaryColor: data.theme?.primaryColor || '#2563eb',
          secondaryColor: data.theme?.secondaryColor || '#1e40af',
          fontFamily: data.theme?.fontFamily || 'Inter',
          topImage: data.theme?.topImage || '',
          overlayOpacity: data.theme?.overlayOpacity ?? 80,
        },
        leadForm: {
          enabled: data.leadForm?.enabled ?? true,
          fields: {
            name: data.leadForm?.fields?.name ?? true,
            email: data.leadForm?.fields?.email ?? true,
            phone: data.leadForm?.fields?.phone ?? true,
            message: data.leadForm?.fields?.message ?? true,
          }
        }
      };
      
      await mutation.mutateAsync(cleanedData);
    } catch (error) {
      console.error('Error in onSubmit:', error);
    }
  };

  const addService = () => {
    const services = watch('services') || [];
    setValue('services', [...services, '']);
  };

  const removeService = (index: number) => {
    const services = watch('services') || [];
    setValue('services', services.filter((_, i) => i !== index));
  };

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

  const previewSubdomain = generateSubdomain(currentContent.businessName);
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
            disabled={publishMutation.isPending || !currentContent.businessName}
          >
            {publishMutation.isPending ? 'Publishing...' : (website?.published ? 'Published' : 'Publish Website')}
          </Button>
        </div>
      </div>

      {previewMode ? (
        <WebsitePreview content={currentContent} />
      ) : (
        <div className="px-2">
          <form 
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-8"
            onClick={(e) => {
              console.log('Form clicked');
              console.log('Form state:', formState);
              console.log('Is form dirty:', formState.isDirty);
            }}
          >
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
                        {...register('businessName')}
                        value={watch('businessName') || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          console.log('Input change event value:', value);
                          setValue('businessName', value, { shouldDirty: true });
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        About Us
                      </label>
                      <Textarea 
                        {...register('aboutUs')}
                        value={watch('aboutUs') || ''}
                        onChange={(e) => setValue('aboutUs', e.target.value, { shouldDirty: true })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Services
                      </label>
                      {(watch('services') || ['']).map((service, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <Input 
                            {...register(`services.${index}`)}
                            value={service || ''}
                            onChange={(e) => {
                              const services = [...(watch('services') || [''])];
                              services[index] = e.target.value;
                              setValue('services', services, { shouldDirty: true });
                            }}
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
                          {...register('contactInfo.phone')}
                          value={watch('contactInfo.phone') || ''}
                          onChange={(e) => {
                            console.log('Phone changed:', e.target.value);
                            setValue('contactInfo.phone', e.target.value, { shouldDirty: true });
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Email
                        </label>
                        <Input 
                          {...register('contactInfo.email')}
                          value={watch('contactInfo.email') || ''}
                          onChange={(e) => {
                            console.log('Email changed:', e.target.value);
                            setValue('contactInfo.email', e.target.value, { shouldDirty: true });
                          }}
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-2">
                          Address
                        </label>
                        <Input 
                          {...register('contactInfo.address')}
                          value={watch('contactInfo.address') || ''}
                          onChange={(e) => {
                            console.log('Address changed:', e.target.value);
                            setValue('contactInfo.address', e.target.value, { shouldDirty: true });
                          }}
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
                            {...register('theme.topImage')}
                            value={watch('theme.topImage') || ''}
                            onChange={(e) => {
                              setValue('theme.topImage', e.target.value, { shouldDirty: true });
                            }}
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
                            {...register('theme.overlayOpacity')}
                            value={watch('theme.overlayOpacity') || 80}
                            onChange={(e) => {
                              setValue('theme.overlayOpacity', parseInt(e.target.value), { shouldDirty: true });
                            }}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <span className="text-sm text-gray-600 w-12">
                            {watch('theme.overlayOpacity')}%
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
                              {...register('theme.primaryColor')}
                              value={watch('theme.primaryColor') || '#2563eb'}
                              onChange={(e) => {
                                console.log('Primary color changed:', e.target.value);
                                setValue('theme.primaryColor', e.target.value, { shouldDirty: true });
                              }}
                              className="h-10 w-20 p-1 cursor-pointer"
                            />
                          </div>
                          <Input
                            type="text"
                            value={watch('theme.primaryColor') || '#2563eb'}
                            onChange={(e) => {
                              setValue('theme.primaryColor', e.target.value, { shouldDirty: true });
                            }}
                            className="w-32 uppercase"
                            maxLength={7}
                          />
                          <div 
                            className="w-10 h-10 rounded border"
                            style={{ backgroundColor: watch('theme.primaryColor') || '#2563eb' }}
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
                              {...register('theme.secondaryColor')}
                              value={watch('theme.secondaryColor') || '#1e40af'}
                              onChange={(e) => {
                                console.log('Secondary color changed:', e.target.value);
                                setValue('theme.secondaryColor', e.target.value, { shouldDirty: true });
                              }}
                              className="h-10 w-20 p-1 cursor-pointer"
                            />
                          </div>
                          <Input
                            type="text"
                            value={watch('theme.secondaryColor') || '#1e40af'}
                            onChange={(e) => {
                              setValue('theme.secondaryColor', e.target.value, { shouldDirty: true });
                            }}
                            className="w-32 uppercase"
                            maxLength={7}
                          />
                          <div 
                            className="w-10 h-10 rounded border"
                            style={{ backgroundColor: watch('theme.secondaryColor') || '#1e40af' }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setValue('theme.primaryColor', '#2563eb', { shouldDirty: true });
                          setValue('theme.secondaryColor', '#1e40af', { shouldDirty: true });
                        }}
                        className="w-full"
                      >
                        Reset to Default Colors
                      </Button>
                    </div>

                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-sm font-medium mb-2">Color Preview</h3>
                      <div className="space-y-2">
                        <div className="h-10 rounded" style={{ backgroundColor: watch('theme.primaryColor') || '#2563eb' }}>
                          <div className="p-2 text-white text-sm">Primary Color</div>
                        </div>
                        <div className="h-10 rounded" style={{ backgroundColor: watch('theme.secondaryColor') || '#1e40af' }}>
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
                        {...register('leadForm.enabled')}
                      />
                      <label className="text-sm font-medium">
                        Enable Lead Form
                      </label>
                    </div>

                    {watch('leadForm.enabled') && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            {...register('leadForm.fields.name')}
                          />
                          <label className="text-sm">Name Field</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            {...register('leadForm.fields.email')}
                          />
                          <label className="text-sm">Email Field</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            {...register('leadForm.fields.phone')}
                          />
                          <label className="text-sm">Phone Field</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            {...register('leadForm.fields.message')}
                          />
                          <label className="text-sm">Message Field</label>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="submit"
                variant="primary"
                disabled={mutation.isPending}
                onClick={handleSubmit(onSubmit)}
                className="hover:bg-blue-700 active:bg-blue-800 transition-colors"
              >
                {mutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⌛</span> 
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
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
          {!currentContent.businessName && (
            <span className="text-red-500 ml-2">
              (Enter a business name to generate your website URL)
            </span>
          )}
        </p>
      </div>
    </div>
  );
}