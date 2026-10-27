import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Lock,
  Shield,
  Ban,
  LogOut,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Profile } from '../types/database.types';

export const SettingsPage: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState<{ id: string; user: Profile }[]>([]);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(true);

  const loadBlockedUsers = async () => {
    if (!user || !isSupabaseConfigured) {
      setIsLoadingBlocks(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('blocks')
        .select('id, user:profiles!blocked_id(*)')
        .eq('blocker_id', user.id);

      if (!error && data) {
        setBlockedUsers(data as any);
      }
    } catch (err) {
      console.error('Error fetching blocks:', err);
    } finally {
      setIsLoadingBlocks(false);
    }
  };

  useEffect(() => {
    loadBlockedUsers();
  }, [user]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await authService.updatePassword(newPassword);
      setPasswordSuccess('Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleUnblock = async (blockId: string) => {
    try {
      await supabase.from('blocks').delete().eq('id', blockId);
      setBlockedUsers((prev) => prev.filter((b) => b.id !== blockId));
    } catch (err: any) {
      alert(err.message || 'Failed to unblock user.');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-400" />
          <span>Account Settings & Privacy</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your login credentials, safety controls, and session preferences.
        </p>
      </div>

      {/* Account Info Card */}
      <Card className="p-6 space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span>University Account Details</span>
        </h2>
        <div className="text-xs text-slate-300 space-y-2">
          <p>
            <span className="text-slate-500 font-medium">Email: </span>
            <span className="font-semibold text-white">{user?.email}</span>
          </p>
          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Verified Student Account
            </span>
            <span className="text-[11px] text-slate-400">&bull; {profile?.school || 'Campus Member'}</span>
          </div>
        </div>
      </Card>

      {/* Change Password Card */}
      <Card className="p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
          <KeyRound className="w-4 h-4" />
          <span>Change Password</span>
        </h2>

        {passwordSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
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
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
          />

          <Button type="submit" size="sm" isLoading={isUpdatingPassword}>
            Update Password
          </Button>
        </form>
      </Card>

      {/* Blocked Users Card */}
      <Card className="p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
          <Ban className="w-4 h-4" />
          <span>Blocked Users ({blockedUsers.length})</span>
        </h2>
        <p className="text-xs text-slate-400">
          Blocked students cannot view your profile cards, send connection requests, or message you.
        </p>

        {isLoadingBlocks ? (
          <LoadingSpinner message="Checking blocked accounts..." />
        ) : blockedUsers.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No blocked users.</p>
        ) : (
          <div className="space-y-2">
            {blockedUsers.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-900 border border-campus-border flex items-center justify-between gap-3 text-xs"
              >
                <span className="font-semibold text-slate-200">
                  {item.user?.full_name || 'Blocked student'}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUnblock(item.id)}
                  className="text-xs"
                >
                  Unblock
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Sign Out Card */}
      <Card className="p-6 border-rose-500/20 bg-rose-500/5 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-white">Sign Out of Session</h3>
          <p className="text-[11px] text-slate-400">Securely sign out of this device</p>
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={handleSignOut}
          leftIcon={<LogOut className="w-4 h-4" />}
        >
          Sign Out
        </Button>
      </Card>
    </div>
  );
};
