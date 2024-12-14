import React from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Website, WebsiteContent } from './types';
import { useAuth } from '../../hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Card } from '../../components/ui/Card';
import { toast } from '../../components/ui/Toast';

const defaultContent: WebsiteContent = {
  businessName: '',
  aboutUs: '',
  services: [''],
  contactInfo: {
    phone: '',
    email: '',
    address: '',
  },
  leadForm: {
    enabled: true,
    fields: {
      name: true,
      email: true,
      phone: true,
      message: true,
    },
  },
  theme: {
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    fontFamily: 'Inter',
  },
};

export default function WebsiteBuilder() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [previewMode, setPreviewMode] = React.useState(false);
  
  const { data: website, isLoading } = useQuery({
    queryKey: ['website'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('websites')
        .select('*')
        .eq('profile_id', user?.id)
        .single();
      
      if (error) throw error;
      return data as Website;
    },
  });

  const { register, handleSubmit, watch, setValue } = useForm<WebsiteContent>({
    defaultValues: website?.content || defaultContent,
  });

  const mutation = useMutation({
    mutationFn: async (content: WebsiteContent) => {
      if (website) {
        // Update existing website
        const { error } = await supabase
          .from('websites')
          .update({ content, updated_at: new Date().toISOString() })
          .eq('id', website.id);
        
        if (error) throw error;
      } else {
        // Create new website
        const subdomain = user?.email?.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') || '';
        const { error } = await supabase
          .from('websites')
          .insert([{
            profile_id: user?.id,
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
      const { error } = await supabase
        .from('websites')
        .update({ published: true })
        .eq('id', website?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website'] });
      toast({
        title: 'Success',
        description: 'Your website has been published.',
        type: 'success',
      });
    },
  });

  const onSubmit = (data: WebsiteContent) => {
    mutation.mutate(data);
  };

  const addService = () => {
    const services = watch('services');
    setValue('services', [...services, '']);
  };

  const removeService = (index: number) => {
    const services = watch('services');
    setValue('services', services.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

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
          {website && (
            <Button
              variant="primary"
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
            >
              {website.published ? 'Published' : 'Publish Website'}
            </Button>
          )}
        </div>
      </div>

      {previewMode ? (
        <WebsitePreview content={watch()} />
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
                    <Input {...register('businessName')} />
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

      {website && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Your website will be available at:{' '}
            <a
              href={`https://${website.subdomain}.simplebiz.site`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {`https://${website.subdomain}.simplebiz.site`}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}