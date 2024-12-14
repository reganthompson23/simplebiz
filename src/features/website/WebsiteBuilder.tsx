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
  
  const { data: website, isLoading, error: websiteError } = useQuery({
    queryKey: ['website'],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .eq('profile_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
      return data as Website | null;
    },
    enabled: !!user?.id,
  });

  const { register, handleSubmit, watch, setValue, reset } = useForm<WebsiteContent>({
    defaultValues: defaultContent,
  });

  // Update form when website data loads
  React.useEffect(() => {
    if (website?.content) {
      reset(website.content);
    }
  }, [website, reset]);

  const mutation = useMutation({
    mutationFn: async (content: WebsiteContent) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const subdomain = generateSubdomain(content.businessName);
      
      if (website) {
        // Update existing website
        const { error } = await supabase
          .from('websites')
          .update({ 
            content, 
            subdomain,
            updated_at: new Date().toISOString() 
          })
          .eq('id', website.id);
        
        if (error) throw error;
      } else {
        // Create new website
        const { error } = await supabase
          .from('websites')
          .insert([{
            profile_id: user.id,
            subdomain,
            content,
            published: false,
          }]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website'] });
      toast({
        title: 'Success',
        description: 'Your website has been saved.',
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

  const onSubmit = (data: WebsiteContent) => {
    mutation.mutate(data);
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

  const currentContent = watch();
  const previewSubdomain = generateSubdomain(currentContent.businessName);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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
                    <Input {...register('businessName', { required: true })} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      About Us
                    </label>
                    <Textarea {...register('aboutUs')} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Services
                    </label>
                    {watch('services').map((_, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <Input {...register(`services.${index}`)} />
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
                      <Input {...register('contactInfo.phone')} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Email
                      </label>
                      <Input {...register('contactInfo.email')} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        Address
                      </label>
                      <Input {...register('contactInfo.address')} />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="design">
                <div className="space-y-6 p-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Primary Color
                    </label>
                    <Input
                      type="color"
                      {...register('theme.primaryColor')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Secondary Color
                    </label>
                    <Input
                      type="color"
                      {...register('theme.secondaryColor')}
                    />
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

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          Your website will be available at:{' '}
          <a
            href={`https://${previewSubdomain}.simplebiz.site`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {`https://${previewSubdomain}.simplebiz.site`}
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