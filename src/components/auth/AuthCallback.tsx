import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the token from the URL
        const query = new URLSearchParams(window.location.search);
        const token = query.get('token');
        const type = query.get('type');

        if (!token) {
          throw new Error('No token found in URL');
        }

        // Get the session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (!session) {
          // If no session, try to verify the token
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token,
            type: type === 'signup' ? 'signup' : 'recovery',
          });

          if (verifyError) throw verifyError;
        }

        // Redirect to home page after successful verification
        navigate('/', { replace: true });
      } catch (err: any) {
        console.error('Error during verification:', err);
        setError(err.message);
        // On error, redirect to login page after a delay
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">
            Error during verification: {error}
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Redirecting to login page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Verifying your email...
        </h2>
        <p className="mt-2 text-gray-600">
          Please wait while we verify your email address.
        </p>
      </div>
    </div>
  );
} 