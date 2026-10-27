import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export const ResetPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  const { user, isConfigured } = useAuth();

  useEffect(() => {
    // If user is already authenticated (e.g., clicked password reset link with token)
    if (user) {
      setIsUpdateMode(true);
    }
  }, [user]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your university email address.');
      return;
    }

    if (!isConfigured) {
      setErrorMessage('Supabase is not configured.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPasswordForEmail(email.trim());
      setSuccessMessage('Password reset instructions have been sent to your email.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.updatePassword(newPassword);
      setSuccessMessage('Your password has been reset successfully! Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={isUpdateMode ? 'Set New Password' : 'Reset Password'}
      subtitle={
        isUpdateMode
          ? 'Enter your new secure password below'
          : "We'll send password reset instructions to your university email"
      }
    >
      {successMessage && (
        <div className="p-3.5 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isUpdateMode ? (
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            placeholder="Minimum 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Update Password
          </Button>
        </form>
      ) : (
        <form onSubmit={handleRequestReset} className="space-y-4">
          <Input
            label="University Email"
            type="email"
            placeholder="your.name@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />

          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Send Reset Link
          </Button>

          <p className="text-center text-xs text-slate-400 pt-2">
            Remembered your password?{' '}
            <Link
              to="/login"
              className="font-semibold text-campus-primary hover:text-indigo-400 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
};
