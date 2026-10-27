import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading, isConfigured } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-campus-dark flex items-center justify-center">
        <LoadingSpinner message="Checking authentication session..." />
      </div>
    );
  }

  // If Supabase is not configured yet, allow viewing dashboard with clear configuration banner
  if (!isConfigured) {
    return <>{children}</>;
  }

  // Unauthenticated user
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check onboarding status
  const isOnboardingRoute = location.pathname.startsWith('/onboarding');
  if (profile && !profile.is_onboarded && !isOnboardingRoute) {
    return <Navigate to="/onboarding" replace />;
  }

  // Completed onboarding attempting to access onboarding page
  if (profile && profile.is_onboarded && isOnboardingRoute) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
