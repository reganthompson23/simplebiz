import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Website, WebsiteContent } from '../features/website/types';
import { toast } from '../components/ui/Toast';

// Helper function to update nested object properties
function updateNestedValue(obj: any, path: string[], value: any): any {
  const newObj = { ...obj };
  let current = newObj;
  
  // Navigate to the nested property
  for (let i = 0; i < path.length - 1; i++) {
    current[path[i]] = { ...current[path[i]] };
    current = current[path[i]];
  }
  
  // Set the value
  current[path[path.length - 1]] = value;
  return newObj;
}

export function useWebsiteContent(websiteId: string | undefined) {
  const queryClient = useQueryClient();

  const updateContent = useMutation({
    mutationFn: async ({ path, value }: { path: string[], value: any }) => {
      if (!websiteId) throw new Error('Website ID is required');

      // Get current website data
      const { data: currentWebsite } = await supabase
        .from('websites')
        .select('content')
        .eq('id', websiteId)
        .single();

      if (!currentWebsite) throw new Error('Website not found');

      // Update the specific path in the content
      const updatedContent = updateNestedValue(
        currentWebsite.content,
        path,
        value
      );

      // Save the updated content back to Supabase
      const { data, error } = await supabase
        .from('websites')
        .update({ 
          content: updatedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', websiteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update website',
        type: 'error',
      });
    }
  });

  // Special handler for arrays (like services)
  const updateArray = useMutation({
    mutationFn: async ({ 
      path, 
      operation,
      value,
      index 
    }: { 
      path: string[], 
      operation: 'add' | 'remove' | 'update',
      value?: any,
      index?: number 
    }) => {
      if (!websiteId) throw new Error('Website ID is required');

      const { data: currentWebsite } = await supabase
        .from('websites')
        .select('content')
        .eq('id', websiteId)
        .single();

      if (!currentWebsite) throw new Error('Website not found');

      // Get the current array
      let currentArray = path.reduce((obj, key) => obj[key], currentWebsite.content);
      let updatedArray;

      switch (operation) {
        case 'add':
          updatedArray = [...currentArray, value];
          break;
        case 'remove':
          if (typeof index !== 'number') throw new Error('Index is required for remove operation');
          updatedArray = currentArray.filter((_: any, i: number) => i !== index);
          break;
        case 'update':
          if (typeof index !== 'number') throw new Error('Index is required for update operation');
          updatedArray = [...currentArray];
          updatedArray[index] = value;
          break;
        default:
          throw new Error('Invalid array operation');
      }

      // Update the content with the new array
      const updatedContent = updateNestedValue(
        currentWebsite.content,
        path,
        updatedArray
      );

      const { data, error } = await supabase
        .from('websites')
        .update({ 
          content: updatedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', websiteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update array',
        type: 'error',
      });
    }
  });

  return {
    updateField: (path: string[], value: any) => updateContent.mutate({ path, value }),
    updateArray,
    isUpdating: updateContent.isPending || updateArray.isPending
  };
} 