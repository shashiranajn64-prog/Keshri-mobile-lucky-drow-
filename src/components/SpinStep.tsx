import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  Crown,
  PlusCircle,
  RotateCw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  formatCurrency,
  getActiveWheelOffers,
  pickWeightedOfferIndex,
} from '../constants';
import { CustomerEntry } from '../types';
import { playWinFanfare } from '../utils/sound';
import { SpinWheel } from './SpinWheel';
import { WinnerModal } from './WinnerModal';

interface SpinStepProps {
  customer: CustomerEntry;
  onRecordSpin: (customerId: string, prize: string) => {
    spinNumber: number;
    remainingSpins: number;
  };
  onAddNewCustomer: () => void;
}

export const SpinStep: React.FC<SpinStepProps> = ({
  customer,
  onRecordSpin,
  onAddNewCustomer,
}) => {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [muted, setMuted] = useState(false);
  const [winnerPopup, setWinnerPopup] = useState<{
    spinNumber: number;
    prize: string;
    remainingSpins: number;
  } | null>(null);

  const timeoutRef = useRef<number | null>(null);
  const remainingSpins = Math.max(0, customer.totalSpins - customer.usedSpins);
  const displayedRemainingSpins = isSpinning
    ? Math.min(customer.totalSpins, remainingSpins + 1)
    : remainingSpins;
  const visibleResults = isSpinning
    ? customer.results.slice(0, -1)
    : customer.results;
  const activeOffers = getActiveWheelOffers(customer.prizesSnapshot || []);
  const wheelOffers =
    activeOffers.length > 0
      ? activeOffers
      : [{ id: 'fallback', name: 'Free Gift', chance: 100, enabled: true }];
  const prizes = wheelOffers.map((o) => o.name);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSpinClick = () => {
    if (isSpinning || remainingSpins <= 0) return;

    const count = wheelOffers.length;
    const targetIndex = pickWeightedOfferIndex(wheelOffers);
    const selectedPrize = wheelOffers[targetIndex].name;

    const sliceAngle = 360 / count;
    // Slight jitter inside the slice so it never stops ambiguously on a divider
    const jitter = (Math.random() - 0.5) * sliceAngle * 0.55;
    const targetMod =
      ((360 - (targetIndex + 0.5) * sliceAngle + jitter) % 360 + 360) % 360;
    const currentMod = ((rotation % 360) + 360) % 360;
    const deltaMod = ((targetMod - currentMod) % 360 + 360) % 360;
    const extraSpins = 6 * 360; // 6 full spins in 4.5 seconds
    const nextRotation = rotation + extraSpins + deltaMod;

    // Persist spin immediately on trigger so page refresh cannot grant extra spins
    const { spinNumber, remainingSpins: updatedRemaining } = onRecordSpin(
      customer.id,
      selectedPrize
    );

    setIsSpinning(true);
    setRotation(nextRotation);

    timeoutRef.current = window.setTimeout(() => {
      setIsSpinning(false);
      const isBetterLuck = selectedPrize.toLowerCase().includes('better luck');
      playWinFanfare(isBetterLuck, muted);
      setWinnerPopup({
        spinNumber,
        prize: selectedPrize,
        remainingSpins: updatedRemaining,
      });
    }, 4550);
  };

  const canSpin = !isSpinning && remainingSpins > 0;

  return (
    <section
      aria-labelledby="step2-heading"
      className="w-full max-w-5xl mx-auto space-y-6"
    >
      {/* Top Customer Summary Card */}
      <div className="bg-[#0C1D3D] border border-amber-400/30 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-700/70">
          <div>
            <p className="text-xs sm:text-sm font-semibold text-amber-400">
              {customer.slabName}
            </p>
            <h2
              id="step2-heading"
              className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5"
            >
              STEP 2 - Lucky Draw Spin
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {customer.isVip && (
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-300">
                <Crown className="w-5 h-5 text-amber-400" />
                VIP Customer
              </span>
            )}
            <button
              type="button"
              onClick={() => setMuted((prev) => !prev)}
              aria-label={muted ? 'Unmute spin sound' : 'Mute spin sound'}
              className="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-[#071229] border border-slate-600 hover:border-amber-400 text-slate-200 flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer"
            >
              {muted ? (
                <VolumeX className="w-4 h-4 text-slate-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-amber-400" />
              )}
              <span className="hidden sm:inline">
                {muted ? 'Sound Off' : 'Sound On'}
              </span>
            </button>
          </div>
        </div>

        {/* Customer Details Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-b border-slate-700/70">
          <div>
            <p className="text-xs text-slate-400">Customer Name</p>
            <p className="text-lg sm:text-xl font-bold text-white truncate">
              {customer.name}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Brand / Item</p>
            <p className="text-lg sm:text-xl font-bold text-amber-300 truncate">
              {customer.brand}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Last Price</p>
            <p className="text-lg sm:text-xl font-bold text-white font-mono-num">
              {formatCurrency(customer.price)}
            </p>
          </div>
        </div>

        {/* Big Prominent Spin Count Banner */}
        <div className="mt-4 rounded-xl bg-[#071229] border border-amber-400/40 px-4 py-4 text-center">
          <p className="text-lg sm:text-2xl font-extrabold text-white leading-snug text-balance">
            Aapko{' '}
            <span className="text-amber-300 font-mono-num">
              {customer.totalSpins}
            </span>{' '}
            Spin Mile Hai - Bacha Hua Spin:{' '}
            <span
              className={`font-mono-num ${
                displayedRemainingSpins > 0
                  ? 'text-emerald-400'
                  : 'text-orange-400'
              }`}
            >
              {displayedRemainingSpins}
            </span>
          </p>
        </div>
      </div>

      {/* Main Wheel + Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Center Wheel Column */}
        <div className="lg:col-span-7 bg-[#0C1D3D] border border-slate-700/70 rounded-2xl sm:rounded-3xl p-5 sm:p-8 flex flex-col items-center">
          <SpinWheel
            prizes={prizes}
            rotation={rotation}
            isSpinning={isSpinning}
            muted={muted}
          />

          {/* Big Green SPIN KARO Button */}
          <div className="w-full max-w-md mt-7 space-y-3">
            <button
              type="button"
              onClick={handleSpinClick}
              disabled={!canSpin}
              className={`w-full min-h-[60px] px-6 py-4 rounded-2xl font-extrabold text-xl sm:text-2xl tracking-wide transition-all flex items-center justify-center gap-3 ${
                remainingSpins <= 0 && !isSpinning
                  ? 'bg-slate-700 text-slate-300 border border-slate-600 cursor-not-allowed'
                  : isSpinning
                  ? 'bg-emerald-700 text-emerald-100 cursor-wait opacity-90'
                  : 'bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-400 hover:to-green-500 active:scale-[0.98] text-white shadow-[0_12px_30px_rgba(16,185,129,0.4)] cursor-pointer'
              }`}
            >
              <RotateCw
                className={`w-6 h-6 shrink-0 ${isSpinning ? 'animate-spin' : ''}`}
              />
              <span>
                {isSpinning
                  ? 'Wheel Ghoom Raha Hai...'
                  : remainingSpins <= 0
                  ? 'Aapke Saare Spin Khatam Ho Gaye'
                  : 'SPIN KARO'}
              </span>
            </button>
          </div>
        </div>

        {/* Right Side: Individual Spin Results + New Customer Action */}
        <div className="lg:col-span-5 bg-[#0C1D3D] border border-slate-700/70 rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-amber-300 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Aapke Spin Results</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Har spin ka inaam yahan save hota hai
            </p>

            <div className="mt-4 space-y-2.5">
              {visibleResults.length === 0 && !isSpinning ? (
                <div className="rounded-xl bg-[#071229] border border-slate-700/80 p-4 text-sm text-slate-400 text-center">
                  Abhi koi spin nahi hua hai. Upar green{' '}
                  <strong className="text-emerald-400">SPIN KARO</strong> button
                  dabaiye!
                </div>
              ) : (
                <>
                  {visibleResults.map((res) => (
                    <div
                      key={res.spinNumber}
                      className="rounded-xl bg-[#071229] border border-amber-400/25 px-4 py-3 flex items-center justify-between gap-3"
                    >
                      <span className="text-sm font-bold text-slate-300 font-mono-num">
                        Spin {res.spinNumber}
                      </span>
                      <span className="text-base font-extrabold text-amber-300 text-right">
                        {res.prize}
                      </span>
                    </div>
                  ))}
                  {isSpinning && (
                    <div className="rounded-xl bg-[#071229] border border-emerald-500/40 px-4 py-3 text-sm font-semibold text-emerald-300 text-center">
                      Wheel ghoom raha hai... Spin {visibleResults.length + 1} ka result abhi aane wala hai!
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Slab Prizes Preview */}
          <div className="pt-4 border-t border-slate-700/70">
            <p className="text-xs font-semibold text-slate-400 mb-2">
              Is Slab Ke Offers ({prizes.length} Items):
            </p>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {prizes.join(' · ')}
            </p>
          </div>

          {/* + Naya Customer Add Karo Button */}
          <button
            type="button"
            onClick={onAddNewCustomer}
            disabled={isSpinning}
            className="w-full min-h-[54px] px-5 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-extrabold text-base sm:text-lg shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-5 h-5 shrink-0" />
            <span>+ Naya Customer Add Karo</span>
          </button>
        </div>
      </div>

      {/* Winner Popup Modal */}
      {winnerPopup && (
        <WinnerModal
          customerName={customer.name}
          spinNumber={winnerPopup.spinNumber}
          prize={winnerPopup.prize}
          remainingSpins={winnerPopup.remainingSpins}
          onClose={() => setWinnerPopup(null)}
        />
      )}
    </section>
  );
};
