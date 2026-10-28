import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { onboardingService } from '../../services/onboardingService';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState('Verifying Google credentials...');

  useEffect(() => {
    let active = true;

    async function handleAuthCallback() {
      try {
        // Exchange session / hash if required
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!session?.user) {
          // If no immediate session, give auth state change a moment
          const { data: authSub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (newSession?.user && active) {
              authSub.subscription.unsubscribe();
              await routeAuthenticatedUser(newSession.user);
            }
          });
          return;
        }

        if (active) {
          await routeAuthenticatedUser(session.user);
        }
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        navigate('/login', { replace: true, state: { message: 'Authentication verification failed. Please try again.' } });
      }
    }

    async function routeAuthenticatedUser(user: any) {
      setStatusMessage('Checking MedTechFixaters practice account...');

      try {
        // Query server-side status
        const status = await onboardingService.getStatus();

        // 1. Returning user with active subscription -> route directly to dashboard
        if (status.is_complete && status.can_access_dashboard) {
          const dest = status.route_destination || '/dashboard';
          navigate(dest, { replace: true });
          return;
        }

        // 2. User with incomplete onboarding -> resume their exact unfinished step
        const stepRoute = status.route_destination || '/onboarding/basic-details';
        navigate(stepRoute, { replace: true });
      } catch (err) {
        console.warn('Status evaluation error in callback:', err);
        navigate('/onboarding/basic-details', { replace: true });
      }
    }

    handleAuthCallback();
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center mx-auto shadow-xs">
        <Loader2 className="w-6 h-6 text-[#FF6A00] animate-spin" />
      </div>
      <div className="space-y-1">
        <h2 className="text-base font-bold text-slate-900">Authenticating Session</h2>
        <p className="text-xs text-slate-500 font-medium">{statusMessage}</p>
      </div>
    </div>
  );
}
