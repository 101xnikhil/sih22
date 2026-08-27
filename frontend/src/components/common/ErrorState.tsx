import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ title = 'Error', message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center h-full min-h-[200px] bg-slate-800/20 rounded-xl border border-red-500/20">
      <AlertTriangle className="w-10 h-10 text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-slate-200 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors border border-slate-700"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;
