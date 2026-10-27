import React, { useState } from 'react';
import { AlertTriangle, KeyRound, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

export const MissingConfigBanner: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const envSnippet = `# Create a .env.local file in the project root:
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-or-publishable-key`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(envSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-200 px-4 py-3 text-sm">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="font-semibold text-amber-300">Supabase Connection Required:</span>{' '}
            Please configure your credentials in <code className="bg-amber-950/60 px-1.5 py-0.5 rounded text-amber-200">.env.local</code> to activate live authentication, teams, and data queries.
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 underline underline-offset-4 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            {isExpanded ? 'Hide Instructions' : 'View Instructions'}
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="max-w-7xl mx-auto mt-4 p-4 rounded-xl bg-slate-900/90 border border-amber-500/20 text-xs text-slate-300 space-y-3 animate-in fade-in duration-200">
          <p className="font-medium text-slate-200">
            Follow these 3 simple steps to connect your project:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
            <li>Open your Supabase project dashboard at <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-campus-primary hover:underline font-medium">supabase.com/dashboard</a>.</li>
            <li>Run the SQL migration located in <code className="text-slate-200 font-mono">supabase/migrations/20241027000001_initial_schema.sql</code> via the Supabase <strong>SQL Editor</strong>.</li>
            <li>Go to <strong>Project Settings &gt; API</strong>, copy your <strong>Project URL</strong> and <strong>anon public API key</strong>, and place them into a <code className="text-slate-200 font-mono">.env.local</code> file in this project:</li>
          </ol>
          <div className="relative">
            <pre className="p-3 bg-slate-950 rounded-lg text-amber-400 font-mono text-[11px] overflow-x-auto border border-slate-800">
              {envSnippet}
            </pre>
            <button
              onClick={copyToClipboard}
              className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
              title="Copy snippet"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            * Note: Vite requires restarting the development server (<code className="text-slate-400 font-mono">npm run dev</code>) after creating or editing the <code className="text-slate-400 font-mono">.env.local</code> file.
          </p>
        </div>
      )}
    </div>
  );
};
