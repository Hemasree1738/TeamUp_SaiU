import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
  unreadNotifs?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileMenu,
  isMobileMenuOpen,
  unreadNotifs = 0,
}) => {
  const { user, profile, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="h-16 bg-campus-card/80 backdrop-blur-md border-b border-campus-border px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Mobile Hamburger */}
      <div className="flex items-center gap-3 md:hidden">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
        <span className="font-bold text-sm tracking-tight text-white">TeamUp Campus</span>
      </div>

      {/* Search / Context info */}
      <div className="hidden md:flex items-center gap-2 text-xs text-slate-400">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Connected to Campus Network</span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <Link
          to="/notifications"
          className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="View notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadNotifs > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-campus-primary text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
              {unreadNotifs > 9 ? '9+' : unreadNotifs}
            </span>
          )}
        </Link>

        {/* User profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-800/60 transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 border border-indigo-400/30 flex items-center justify-center text-xs font-bold text-white shadow-sm overflow-hidden">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || 'Profile'}
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(profile?.full_name || user?.email || 'User')
              )}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-200 line-clamp-1 max-w-[120px]">
                {profile?.full_name || user?.email?.split('@')[0] || 'Student'}
              </p>
              <p className="text-[10px] text-slate-400 line-clamp-1">
                {profile?.title || 'Campus Member'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setDropdownOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-campus-card border border-campus-border py-1.5 shadow-xl z-30 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2 border-b border-campus-border">
                  <p className="text-xs font-bold text-white truncate">
                    {profile?.full_name || 'Student'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                </div>

                <div className="py-1">
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>My Profile</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-campus-border">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
