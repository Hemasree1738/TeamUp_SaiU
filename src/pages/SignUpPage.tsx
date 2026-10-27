import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export const SignUpPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();
  const { isConfigured, refreshProfile } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMessage('Please fill in all the fields to get started 😊');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Your password needs to be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Those passwords don't match — try typing them again!");
      return;
    }

    if (!isConfigured) {
      setErrorMessage('Supabase credentials are missing. Please add them to .env.local before registering.');
      return;
    }

    setIsLoading(true);
    try {
      const data = await authService.signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
      });

      // If Supabase has email confirmation enabled and session is not immediately available
      if (data.user && !data.session) {
        setIsSuccess(true);
      } else {
        // If auto-confirm is on (e.g. local dev / disabled email confirm), proceed to onboarding
        await refreshProfile();
        navigate('/onboarding');
      }
    } catch (err: any) {
      console.error('Sign up error:', err);
      if (err.message?.includes('already registered')) {
        setErrorMessage('Looks like you already have an account! Try signing in instead.');
      } else {
        setErrorMessage(err.message || 'Something went wrong. Give it another try!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout
        title="You're almost in! 🎉"
        subtitle="Check your inbox for a quick verification link"
      >
        <div className="text-center py-4 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">We sent you an email!</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Just click the link in the email we sent to <strong className="text-slate-200">{email}</strong> and you'll be all set. Can't find it? Check your spam folder!
            </p>
          </div>
          <div className="pt-2">
            <Link to="/login">
              <Button variant="outline" className="w-full">
                Back to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your profile 🚀"
      subtitle="Join your campus community and find people to build with"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <Input
          label="Full Name"
          type="text"
          placeholder="e.g. Alex Chen"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          leftIcon={<User className="w-4 h-4" />}
          required
        />

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

        <Input
          label="Password"
          type="password"
          placeholder="Minimum 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          autoComplete="new-password"
          required
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Re-enter password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          autoComplete="new-password"
          required
        />

        <Button
          type="submit"
          className="w-full mt-2"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Create Account
        </Button>

        <p className="text-center text-xs text-slate-400 pt-2">
          Already a member?{' '}
          <Link
            to="/login"
            className="font-semibold text-campus-primary hover:text-indigo-400 hover:underline"
          >
            Sign in instead
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};
