import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'indigo' | 'violet' | 'emerald' | 'amber' | 'cyan' | 'slate' | 'rose';
  size?: 'sm' | 'md';
  onRemove?: () => void;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'indigo',
  size = 'md',
  onRemove,
  className = '',
}) => {
  const variantStyles = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    violet: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    slate: 'bg-slate-800 text-slate-300 border-slate-700',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-lg border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      <span>{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="hover:opacity-75 focus:outline-none ml-0.5 text-current"
          aria-label="Remove"
        >
          &times;
        </button>
      )}
    </span>
  );
};
