import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import WebsitePreview from './WebsitePreview';

export default function CustomerWebsite() {
  const { businessPath } = useParams();
  
  console.log('Attempting to load website with path:', businessPath);
  
  const { data: website, isLoading, error } = useQuery({
    queryKey: ['customer-website', businessPath],
    queryFn: async () => {
      console.log('Fetching website data from Supabase...');
      const { data, error } = await supabase
        .from('websites')
        .select('*, profiles(id)')
        .eq('path', businessPath)
        .eq('published', true)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      console.log('Website data:', data);
      return data;
    },
  });

  if (isLoading) {
    console.log('Loading website...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !website) {
    console.error('Error or no website found:', error);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
        <p className="text-gray-600 mb-8">We can't seem to find the page you're looking for.</p>
        <p className="text-sm text-gray-500 mb-4">Path: {businessPath}</p>
        <a 
          href="/"
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          GO TO HOME PAGE
        </a>
      </div>
    );
  }

  console.log('Rendering website:', website);
  return (
    <WebsitePreview 
      content={website.content} 
      profileId={website.profiles.id}
    />
  );
} 