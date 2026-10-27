import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export const SignInPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { isConfigured, refreshProfile } = useAuth();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Please fill in both your university email and password.');
      return;
    }

    if (!isConfigured) {
      setErrorMessage('Supabase is not configured. Please add your credentials to .env.local to sign in.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.signIn({ email, password });
      await refreshProfile();
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Sign in error:', err);
      if (err.message?.includes('Email not confirmed')) {
          setErrorMessage("Almost there! Please check your email inbox and click the verification link we sent you.");
        } else if (err.message?.includes('Invalid login credentials')) {
          setErrorMessage("Hmm, that email or password doesn't look right. Give it another try!");
        } else {
          setErrorMessage(err.message || 'Something went wrong. Please try again.');
        }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Hey, welcome back! 👋"
      subtitle="Sign in and pick up where you left off"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <Input
          label="University Email"
          type="email"
          placeholder="your.name@university.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          autoComplete="email"
          required
        />

        <div className="space-y-1">
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            autoComplete="current-password"
            required
          />
          <div className="flex justify-end">
            <Link
              to="/reset-password"
              className="text-[11px] font-medium text-campus-primary hover:text-indigo-400 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full mt-2"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Sign In
        </Button>

        <p className="text-center text-xs text-slate-400 pt-2">
          New here?{' '}
          <Link
            to="/register"
            className="font-semibold text-campus-primary hover:text-indigo-400 hover:underline"
          >
            Join the community
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};
