import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm transition-all duration-200 ${onClick ? 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({
  children,
  title,
  subtitle,
  action,
  className = ''
}) => {
  if (children) {
    return (
      <div className={`p-5 pb-3 border-b border-slate-100 dark:border-slate-800/60 ${className}`}>
        {children}
      </div>
    );
  }
  return (
    <div className={`p-5 pb-3 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between ${className}`}>
      <div>
        {title && <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>}
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => {
  return <div className={`p-5 ${className}`}>{children}</div>;
};
