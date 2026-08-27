import React from 'react';
import clsx from 'clsx';

interface StatusBadgeProps {
  status: 'online' | 'degraded' | 'offline';
  size?: 'sm' | 'md';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const config = {
    online: {
      color: 'emerald',
      bg: 'bg-emerald-500',
      ping: 'bg-emerald-400',
      text: 'text-emerald-400',
      label: 'Online'
    },
    degraded: {
      color: 'amber',
      bg: 'bg-amber-500',
      ping: 'bg-amber-400',
      text: 'text-amber-400',
      label: 'Degraded'
    },
    offline: {
      color: 'red',
      bg: 'bg-red-500',
      ping: 'bg-red-400',
      text: 'text-red-400',
      label: 'Offline'
    }
  };

  const { bg, ping, text, label } = config[status];
  
  const dotSize = size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <div className="flex items-center space-x-2">
      <span className={clsx("relative flex", dotSize)}>
        {status !== 'offline' && (
          <span className={clsx("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", ping)}></span>
        )}
        <span className={clsx("relative inline-flex rounded-full h-full w-full", bg)}></span>
      </span>
      <span className={clsx("font-medium uppercase tracking-wider", textSize, text)}>
        {label}
      </span>
    </div>
  );
};

export default StatusBadge;
