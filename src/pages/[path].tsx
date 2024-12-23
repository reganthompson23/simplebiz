import { GetServerSideProps } from 'next';
import { supabase } from '../lib/supabase';
import WebsitePreview from '../features/website/WebsitePreview';
import { Website } from '../features/website/types';

interface Props {
  website: Website | null;
}

export default function WebsitePage({ website }: Props) {
  if (!website) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl">Website not found</h1>
      </div>
    );
  }

  return (
    <WebsitePreview 
      content={website.content} 
      profileId={website.profile_id}
    />
  );
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const path = params?.path as string;

  // Fetch website data based on the path
  const { data: website } = await supabase
    .from('websites')
    .select('*')
    .eq('path', path)
    .single();

  return {
    props: {
      website: website || null,
    },
  };
}; 