import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { onboardingService } from '../../services/onboardingService';

export default function OnboardingRoot() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function evaluateOnboardingRoute() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login', { replace: true });
          return;
        }

        const status = await onboardingService.getStatus();
        if (!mounted) return;

        if (status.is_complete && status.can_access_dashboard) {
          navigate(status.route_destination || '/dashboard', { replace: true });
          return;
        }

        const target = status.route_destination || '/onboarding/basic-details';
        navigate(target, { replace: true });
      } catch (err) {
        console.warn('Onboarding root evaluation error:', err);
        navigate('/onboarding/basic-details', { replace: true });
      } finally {
        if (mounted) setChecking(false);
      }
    }

    evaluateOnboardingRoute();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center space-y-3">
      <Loader2 className="w-8 h-8 text-[#FF6A00] animate-spin" />
      <p className="text-xs text-slate-500 font-semibold tracking-wide">
        Resuming MedTechFixaters Workspace Setup...
      </p>
    </div>
  );
}
