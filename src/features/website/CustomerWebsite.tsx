import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import WebsitePreview from './WebsitePreview';

interface Website {
  id: string;
  content: any;
  profiles: {
    id: string;
  };
  published: boolean;
  path: string;
}

export default function CustomerWebsite() {
  const { businessPath } = useParams();
  
  // Add error boundary state
  const [hasError, setHasError] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  
  React.useEffect(() => {
    console.log('CustomerWebsite mounted with path:', businessPath);
  }, [businessPath]);

  const { data: website, isLoading, error } = useQuery<Website>({
    queryKey: ['customer-website', businessPath],
    queryFn: async () => {
      if (!businessPath) {
        console.error('No business path provided');
        throw new Error('No business path provided');
      }

      console.log('Fetching website data for path:', businessPath);
      try {
        const { data, error } = await supabase
          .from('websites')
          .select('*, profiles(id)')
          .eq('path', businessPath)
          .eq('published', true)
          .single();

        console.log('Supabase response:', { data, error });

        if (error) {
          console.error('Supabase error:', error);
          setErrorMessage(error.message);
          throw error;
        }

        if (!data) {
          console.error('No website found for path:', businessPath);
          throw new Error('Website not found');
        }

        console.log('Website data found:', data);
        return data;
      } catch (err) {
        console.error('Error in queryFn:', err);
        setHasError(true);
        setErrorMessage(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      }
    },
    retry: 1,
    enabled: !!businessPath,
    gcTime: 1000 * 60 * 30, // 30 minutes
  });

  console.log('Component state:', { isLoading, error, hasError, errorMessage });

  if (isLoading) {
    console.log('Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading website...</div>
      </div>
    );
  }

  if (hasError || error || !website) {
    console.log('Showing error state:', { hasError, error, website });
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Website Not Found</h1>
        <p className="text-gray-600 mb-4">We couldn't find a website at this address.</p>
        <p className="text-sm text-gray-500 mb-4">Path: {businessPath}</p>
        {errorMessage && (
          <p className="text-sm text-red-500 mb-4">Error: {errorMessage}</p>
        )}
        <a 
          href="/"
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Return Home
        </a>
      </div>
    );
  }

  console.log('Rendering WebsitePreview with:', website);
  try {
    return (
      <WebsitePreview 
        content={website.content} 
        profileId={website.profiles.id}
      />
    );
  } catch (err) {
    console.error('Render error:', err);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Something Went Wrong</h1>
        <p className="text-gray-600 mb-8">We encountered an error while displaying this website.</p>
        <a 
          href="/"
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Return Home
        </a>
      </div>
    );
  }
} 