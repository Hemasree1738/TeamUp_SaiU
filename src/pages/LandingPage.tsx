import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Users2,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Code2,
  Terminal,
  Trophy,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { MissingConfigBanner } from '../components/common/MissingConfigBanner';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { user, isConfigured } = useAuth();

  return (
    <div className="min-h-screen bg-campus-dark text-slate-100 flex flex-col selection:bg-campus-primary selection:text-white">
      {!isConfigured && <MissingConfigBanner />}

      {/* Top Navigation */}
      <header className="h-16 border-b border-campus-border/80 bg-campus-card/60 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-campus-primary to-campus-secondary flex items-center justify-center text-white font-black text-lg shadow-glow-sm group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">
            TeamUp <span className="text-transparent bg-clip-text bg-gradient-to-r from-campus-primary to-campus-secondary">Campus</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/dashboard">
              <Button size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Glow backdrop circles */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold shadow-glow-sm">
            <Sparkles className="w-3.5 h-3.5 text-campus-primary" />
            <span>Made for students, by students 🎓</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Find people who get it. <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-400">
              Build something great together.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Whether you're hunting for a dev partner, a designer with vision, or someone who just vibes with your idea — your people are here. No awkward cold DMs, no spam.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto" rightIcon={<ArrowRight className="w-4 h-4" />}>
                I'm in — let's go!
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Already have an account
              </Button>
            </Link>
          </div>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Real students, verified</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>No spam, just good vibes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Your privacy is safe here</span>
            </div>
          </div>
        </div>
      </section>

      {/* Two Pillars Section: Form Teams & Join Teams */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-campus-border/60 bg-slate-950/30">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              How it works
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Two simple ways to find your crew
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Pillar 1: Form Teams */}
            <div className="p-8 rounded-3xl bg-campus-card border border-campus-border shadow-xl space-y-5 hover:border-campus-primary/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Users2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">👋 Meet people you actually want to work with</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Browse real student profiles — see what they've built, what they love, and how much time they have. Send a connection invite, have a chat, and decide if you click.
              </p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-campus-primary" />
                  See their GitHub, portfolio & coding profiles upfront
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-campus-primary" />
                  Send a friendly invite — no awkwardness, it's mutual
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-campus-primary" />
                  Get smart role suggestions based on your skills
                </li>
              </ul>
            </div>

            {/* Pillar 2: Join Teams */}
            <div className="p-8 rounded-3xl bg-campus-card border border-campus-border shadow-xl space-y-5 hover:border-campus-secondary/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">🚀 Jump into a project that excites you</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Scroll through open teams — hackathons, research, startups — and apply to ones that match your vibe. Show what you bring to the table, and the team decides if it's a good fit.
              </p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-campus-secondary" />
                  See how many spots are open before you apply
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-campus-secondary" />
                  Transparent, respectful review by the project lead
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-campus-secondary" />
                  Get direct invites from teams that already know you
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Reliability Highlights */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-campus-border">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Built with care
            </span>
            <h2 className="text-2xl font-bold text-white">
              A space you can actually trust
            </h2>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">
              We keep it safe, simple, and distraction-free — so you can focus on the people and the work.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="p-5 rounded-2xl bg-campus-card border border-campus-border space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Your stuff stays yours</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your messages, links, and applications are only seen by the people you choose. We don't sell your data or clutter your inbox.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-campus-card border border-campus-border space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">No chaos, no confusion</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Team spots are capped and tracked so you always know where things stand. No duplicate applications, no ghost teams.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-campus-card border border-campus-border space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Built for crunch time 🏆</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Real-time messaging, works great on your phone, and stays fast even when you're on hour 40 of a 48-hour hackathon.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-campus-border text-center text-xs text-slate-500">
        <p>TeamUp Campus &bull; Made with ❤️ for students who build things together</p>
      </footer>
    </div>
  );
};
