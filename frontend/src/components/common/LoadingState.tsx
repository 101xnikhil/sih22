import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 h-full min-h-[200px]">
      <Loader2 className="w-8 h-8 text-slate-400 animate-spin mb-4" />
      <p className="text-slate-400 text-sm font-medium">{message}</p>
    </div>
  );
};

export default LoadingState;
