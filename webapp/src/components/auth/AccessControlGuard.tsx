import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { subscriptionService, AccountAccessStatus } from '../../services/subscriptionService';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface AccessControlGuardProps {
  children: React.ReactNode;
  allowedCategories?: ('solo_doctor_clinic' | 'hospital')[];
  requireActiveSubscription?: boolean;
}

export default function AccessControlGuard({
  children,
  allowedCategories,
  requireActiveSubscription = true,
}: AccessControlGuardProps) {
  const location = useLocation();
  const [loading, setLoading] = useState<boolean>(true);
  const [accessStatus, setAccessStatus] = useState<AccountAccessStatus | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function checkAccess() {
      try {
        const status = await subscriptionService.getAccountAccessStatus();
        if (isMounted) {
          setAccessStatus(status);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    checkAccess();
    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-lg shadow-blue-500/5 mb-4 animate-pulse">
          <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Verifying Clinical Workspace Security</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Validating authorization credentials, organization membership, and active subscription status...
        </p>
      </div>
    );
  }

  // 1. Not Authenticated
  if (!accessStatus?.authenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Category Not Selected
  if (!accessStatus.customer_category) {
    if (location.pathname !== '/onboarding/category') {
      return <Navigate to="/onboarding/category" replace />;
    }
    return <>{children}</>;
  }

  // 3. Profile Incomplete
  if (!accessStatus.profile_completed) {
    if (location.pathname !== '/onboarding/profile') {
      return <Navigate to="/onboarding/profile" replace />;
    }
    return <>{children}</>;
  }

  // 4. Category-specific Access Checks
  if (allowedCategories && accessStatus.customer_category) {
    if (!allowedCategories.includes(accessStatus.customer_category)) {
      // Divert to their category's designated home
      const destination = accessStatus.customer_category === 'hospital'
        ? '/hospital/inquiry-status'
        : '/doctor';
      return <Navigate to={destination} replace />;
    }
  }

  // 5. Hospital Category Status Check
  if (accessStatus.customer_category === 'hospital') {
    if (!accessStatus.can_access_dashboard && location.pathname.startsWith('/hospitaldashboard')) {
      return <Navigate to="/hospital/inquiry-status" replace />;
    }
  }

  // 6. Solo Doctor Subscription Requirement
  if (requireActiveSubscription && accessStatus.customer_category === 'solo_doctor_clinic') {
    if (!accessStatus.can_access_dashboard) {
      if (accessStatus.subscription_status === 'expired') {
        return <Navigate to="/subscription/expired" replace />;
      }
      if (accessStatus.introductory_offer_used) {
        return <Navigate to="/subscription/renew" replace />;
      }
      return <Navigate to="/checkout/intro" replace />;
    }
  }

  return <>{children}</>;
}
