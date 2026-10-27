import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users2,
  Layers,
  UserCheck,
  FolderGit2,
  MessageSquare,
  Bell,
  User,
  Settings,
  PlusCircle,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  unreadNotifs?: number;
  unreadMessages?: number;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  unreadNotifs = 0,
  unreadMessages = 0,
  onCloseMobile,
}) => {
  const mainNavLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/students', label: 'Find Teammates', icon: Users2 },
    { to: '/teams', label: 'Explore Projects', icon: Layers },
    { to: '/my-teams', label: 'My Teams', icon: FolderGit2 },
    { to: '/connections', label: 'My Connections', icon: UserCheck },
    { to: '/messages', label: 'Messages', icon: MessageSquare, badge: unreadMessages },
    { to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadNotifs },
  ];

  const secondaryNavLinks = [
    { to: '/profile', label: 'My Profile', icon: User },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-campus-card/95 border-r border-campus-border flex flex-col h-full shrink-0 select-none backdrop-blur-md">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-campus-border flex items-center justify-between">
        <NavLink
          to="/dashboard"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-campus-primary to-campus-secondary flex items-center justify-center text-white font-black text-lg shadow-glow-sm group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
              <span>TeamUp</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Campus
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Student Collaboration Hub</p>
          </div>
        </NavLink>
      </div>

      {/* Quick Action */}
      <div className="p-4">
        <NavLink
          to="/teams/create"
          onClick={onCloseMobile}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-campus-primary to-campus-secondary hover:opacity-95 text-white font-semibold text-xs shadow-glow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Start a Project Team</span>
        </NavLink>
      </div>

      {/* Nav Section */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Collaborate
          </p>
          <nav className="space-y-1">
            {mainNavLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-campus-primary/15 text-campus-primary border border-campus-primary/25 shadow-glow-sm font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-campus-primary text-white">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div>
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            My Space
          </p>
          <nav className="space-y-1">
            {secondaryNavLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-campus-primary/15 text-campus-primary border border-campus-primary/25 font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer info */}
      <div className="p-4 border-t border-campus-border text-center">
        <p className="text-[11px] text-slate-500">
          Built for hackathons & research
        </p>
      </div>
    </aside>
  );
};
