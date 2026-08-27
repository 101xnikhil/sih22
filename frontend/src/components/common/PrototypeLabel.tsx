import { Info } from 'lucide-react';

interface Props {
  text?: string;
  className?: string;
}

export default function PrototypeLabel({ text, className = '' }: Props) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium ${className}`}
    >
      <Info className="w-3.5 h-3.5" />
      <span>{text || '⚠️ PROTOTYPE — Synthetic Data — Not for real-world decisions'}</span>
    </div>
  );
}
