import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import WebsitePreview from './WebsitePreview';

export default function CustomerWebsite() {
  const { businessPath } = useParams();
  
  // Add error boundary state
  const [hasError, setHasError] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  
  React.useEffect(() => {
    console.log('CustomerWebsite mounted with path:', businessPath);
    return () => console.log('CustomerWebsite unmounted');
  }, [businessPath]);

  const { data: website, isLoading, error } = useQuery({
    queryKey: ['customer-website', businessPath],
    queryFn: async () => {
      if (!businessPath) {
        throw new Error('No business path provided');
      }

      console.log('Fetching website data for path:', businessPath);
      const { data, error } = await supabase
        .from('websites')
        .select('*, profiles(id)')
        .eq('path', businessPath)
        .eq('published', true)
        .single();

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
    },
    retry: 1,
    onError: (err) => {
      console.error('Query error:', err);
      setHasError(true);
      setErrorMessage(err.message);
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading website...</div>
      </div>
    );
  }

  if (hasError || error || !website) {
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