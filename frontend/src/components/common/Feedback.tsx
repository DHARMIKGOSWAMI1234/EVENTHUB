// frontend/src/components/common/Feedback.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  message?: string;
  className?: string;
}> = ({
  size = 'md',
  text,
  message,
  className = '',
}) => {
  const displayText = message || text;
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 gap-3 text-slate-400 ${className}`}>
      <Loader2 className={`${sizeMap[size]} animate-spin text-indigo-400`} />
      {displayText && <p className="text-sm font-medium animate-pulse">{displayText}</p>}
    </div>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => (
  <div className={`animate-pulse bg-slate-800/80 rounded-lg ${className}`} />
);

export const SkeletonCard: React.FC = () => (
  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 animate-pulse">
    <div className="w-full h-44 bg-slate-800 rounded-xl" />
    <div className="flex gap-2">
      <div className="w-16 h-5 bg-slate-800 rounded-full" />
      <div className="w-20 h-5 bg-slate-800 rounded-full" />
    </div>
    <div className="h-6 w-3/4 bg-slate-800 rounded" />
    <div className="h-4 w-full bg-slate-800 rounded" />
    <div className="flex justify-between items-center pt-3 border-t border-slate-800/80">
      <div className="w-20 h-5 bg-slate-800 rounded" />
      <div className="w-24 h-9 bg-slate-800 rounded-xl" />
    </div>
  </div>
);

export interface EmptyStateProps {
  icon?: React.ReactNode | React.ElementType;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: IconOrNode,
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  const renderIcon = () => {
    if (!IconOrNode) return null;
    if (React.isValidElement(IconOrNode)) return IconOrNode;
    const IconComponent = IconOrNode as React.ElementType;
    return <IconComponent className="w-8 h-8" />;
  };

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-12 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl max-w-lg mx-auto ${className}`}
    >
      {IconOrNode && (
        <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4">
          {renderIcon()}
        </div>
      )}
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      {description && <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">{description}</p>}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/25"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
