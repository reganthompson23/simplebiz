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
        const hash = window.location.hash;
        const query = new URLSearchParams(window.location.search);
        const token = query.get('token');
        const refreshToken = query.get('refresh_token');
        const type = query.get('type');

        if (!token) {
          throw new Error('No token found in URL');
        }

        if (type === 'signup') {
          // Handle signup confirmation
          const { error } = await supabase.auth.verifyOtp({
            token,
            type: 'signup',
          });

          if (error) throw error;
        } else if (type === 'recovery') {
          // Handle password reset
          const { error } = await supabase.auth.verifyOtp({
            token,
            type: 'recovery',
          });

          if (error) throw error;
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