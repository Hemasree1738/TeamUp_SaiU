import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner: React.FC<{ message?: string; className?: string }> = ({
  message = 'Loading...',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
      <div className="relative">
        <Loader2 className="w-9 h-9 animate-spin text-campus-primary" />
        <div className="absolute inset-0 w-9 h-9 rounded-full blur-md bg-campus-primary/30 -z-10 animate-pulse" />
      </div>
      {message && <p className="mt-4 text-xs font-medium text-slate-400">{message}</p>}
    </div>
  );
};
