import React from 'react';
import { Sparkles, Users, Award, ShieldCheck } from 'lucide-react';
import { MissingConfigBanner } from '../common/MissingConfigBanner';
import { useAuth } from '../../context/AuthContext';

export const AuthLayout: React.FC<{ children: React.ReactNode; title: string; subtitle: string }> = ({
  children,
  title,
  subtitle,
}) => {
  const { isConfigured } = useAuth();

  return (
    <div className="min-h-screen bg-campus-dark text-slate-100 flex flex-col justify-between">
      {!isConfigured && <MissingConfigBanner />}

      <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Glow backdrop decorations */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 px-4">
          <div className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-campus-primary to-campus-secondary flex items-center justify-center text-white font-black text-xl shadow-glow">
              <Sparkles className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">
              TeamUp <span className="text-transparent bg-clip-text bg-gradient-to-r from-campus-primary to-campus-secondary">Campus</span>
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">{title}</h2>
          <p className="mt-1.5 text-xs text-slate-400">{subtitle}</p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
          <div className="bg-campus-card/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-campus-border">
            {children}
          </div>

          {/* Value badges below card */}
          <div className="mt-8 grid grid-cols-3 gap-2 text-center">
            <div className="flex flex-col items-center p-2 rounded-xl bg-slate-900/40 border border-slate-800">
              <Users className="w-4 h-4 text-indigo-400 mb-1" />
              <span className="text-[10px] text-slate-400 font-medium">Verified Students</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-xl bg-slate-900/40 border border-slate-800">
              <Award className="w-4 h-4 text-purple-400 mb-1" />
              <span className="text-[10px] text-slate-400 font-medium">Hackathons & Research</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-xl bg-slate-900/40 border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1" />
              <span className="text-[10px] text-slate-400 font-medium">Zero Spam</span>
            </div>
          </div>
        </div>
      </div>

      <footer className="py-4 text-center text-xs text-slate-500 border-t border-campus-border">
        TeamUp Campus &copy; {new Date().getFullYear()} &bull; Connecting Campus Innovators
      </footer>
    </div>
  );
};
