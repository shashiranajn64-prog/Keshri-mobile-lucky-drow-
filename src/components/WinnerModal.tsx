import React from 'react';
import { Award, CheckCircle2, Sparkles, X } from 'lucide-react';

interface WinnerModalProps {
  customerName: string;
  spinNumber: number;
  prize: string;
  remainingSpins: number;
  onClose: () => void;
}

const CONFETTI_COLORS = [
  '#FBBF24',
  '#F97316',
  '#10B981',
  '#3B82F6',
  '#F43F5E',
  '#FDE047',
];

export const WinnerModal: React.FC<WinnerModalProps> = ({
  customerName,
  spinNumber,
  prize,
  remainingSpins,
  onClose,
}) => {
  const isBetterLuck = prize.toLowerCase().includes('better luck');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="winner-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-[#0B1C3D] border-2 border-amber-400 shadow-[0_24px_64px_rgba(0,0,0,0.8)] p-6 sm:p-8 text-center">
        {/* Confetti burst for prizes */}
        {!isBetterLuck && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden"
          >
            {Array.from({ length: 24 }).map((_, i) => (
              <span
                key={i}
                className="confetti-piece absolute top-0 w-2.5 h-4 rounded-sm"
                style={{
                  left: `${(i * 4.2) % 98}%`,
                  backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                  animationDelay: `${(i % 6) * 0.08}s`,
                }}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          aria-label="Close popup"
          className="absolute right-4 top-4 w-11 h-11 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative z-10 flex flex-col items-center">
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 shadow-lg ${
              isBetterLuck
                ? 'bg-slate-800 border border-slate-600 text-amber-300'
                : 'bg-gradient-to-br from-amber-300 to-orange-500 text-slate-950'
            }`}
          >
            {isBetterLuck ? (
              <Sparkles className="w-10 h-10" />
            ) : (
              <Award className="w-11 h-11" />
            )}
          </div>

          <p className="text-sm font-bold tracking-wide text-amber-300">
            KESHRI MOBILE AND ELECTRONIC
          </p>

          <h3
            id="winner-modal-title"
            className="mt-2 text-2xl sm:text-3xl font-extrabold text-white leading-tight text-balance"
          >
            Congratulations {customerName} - Spin {spinNumber} Me Aap Jeete{' '}
            <span className="text-amber-300">{prize}</span> - Bacha Hua Spin:{' '}
            <span className="font-mono-num text-emerald-400">
              {remainingSpins}
            </span>
          </h3>

          <div className="mt-5 w-full rounded-2xl bg-[#071229] border border-amber-400/30 px-5 py-4">
            <p className="text-xs text-slate-400">Aapka Inaam (Spin {spinNumber})</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-amber-300 mt-1">
              {prize}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full min-h-[54px] px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-extrabold text-lg shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <span>
              {remainingSpins > 0
                ? `OK - Agla Spin Karein (${remainingSpins} Bacha)`
                : 'OK - Done'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
