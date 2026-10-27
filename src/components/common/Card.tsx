import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverEffect = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`rounded-2xl bg-campus-card border border-campus-border p-6 shadow-sm ${
        hoverEffect
          ? 'transition-all duration-300 hover:border-campus-primary/40 hover:bg-campus-cardHover hover:shadow-glow-sm'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
