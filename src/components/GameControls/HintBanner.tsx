import React from 'react';
import { AlertTriangle, Ban, Lightbulb, Eye, X } from 'lucide-react';
import { ProgressiveHint, HintLevel } from '../../types/game';

interface HintBannerProps {
  hint: ProgressiveHint;
  onClose: () => void;
}

const styleByLevel: Record<
  HintLevel,
  { wrap: string; icon: React.ReactNode; iconWrap: string }
> = {
  error: {
    wrap: 'bg-red-50 border-red-200 text-red-800',
    iconWrap: 'text-red-500',
    icon: <AlertTriangle className="w-5 h-5" aria-hidden="true" />,
  },
  elimination: {
    wrap: 'bg-amber-50 border-amber-200 text-amber-900',
    iconWrap: 'text-amber-500',
    icon: <Ban className="w-5 h-5" aria-hidden="true" />,
  },
  deduction: {
    wrap: 'bg-indigo-50 border-indigo-200 text-indigo-900',
    iconWrap: 'text-indigo-500',
    icon: <Lightbulb className="w-5 h-5" aria-hidden="true" />,
  },
  reveal: {
    wrap: 'bg-blue-50 border-blue-200 text-blue-900',
    iconWrap: 'text-blue-500',
    icon: <Eye className="w-5 h-5" aria-hidden="true" />,
  },
};

export const HintBanner: React.FC<HintBannerProps> = ({ hint, onClose }) => {
  const s = styleByLevel[hint.level];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto w-[min(92vw,28rem)] rounded-xl border shadow-lg backdrop-blur-sm px-3 py-2.5 flex items-start gap-2.5 ${s.wrap} bg-opacity-95 animate-fade-in`}
    >
      <div className={`mt-0.5 shrink-0 ${s.iconWrap}`}>{s.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">{hint.title}</p>
        <p className="text-xs sm:text-sm leading-snug mt-0.5 opacity-90">
          {hint.explanation}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer l'indice"
        className="shrink-0 -mr-1 -mt-0.5 w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
      >
        <X className="w-4 h-4 opacity-60" aria-hidden="true" />
      </button>
    </div>
  );
};
