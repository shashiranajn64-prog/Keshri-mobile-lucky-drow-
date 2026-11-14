import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Crown,
  Gift,
  LogOut,
  Plus,
  RotateCcw,
  Save,
  Settings,
  Sliders,
  Trash2,
  Users,
} from 'lucide-react';
import {
  DEFAULT_SLABS,
  formatCurrency,
  getActiveWheelOffers,
  getSlabTotalChance,
} from '../constants';
import { CustomerEntry, PriceSlab, PrizeOffer } from '../types';

interface AdminPanelProps {
  slabs: PriceSlab[];
  entries: CustomerEntry[];
  onSaveSlabs: (updatedSlabs: PriceSlab[]) => void;
  onDeleteEntry: (entryId: string) => void;
  onClearEntries: () => void;
  onBackToWebsite: () => void;
  onLogout: () => void;
}

function cloneSlabs(slabs: PriceSlab[]): PriceSlab[] {
  return slabs.map((s) => ({
    ...s,
    prizes: s.prizes.map((p) => ({ ...p })),
  }));
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  slabs,
  entries,
  onSaveSlabs,
  onDeleteEntry,
  onClearEntries,
  onBackToWebsite,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'slabs' | 'entries'>('slabs');
  const [draftSlabs, setDraftSlabs] = useState<PriceSlab[]>(() =>
    cloneSlabs(slabs)
  );
  const [newPrizeInputs, setNewPrizeInputs] = useState<Record<string, string>>({});
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const totalCustomers = entries.length;
  const totalSale = entries.reduce((sum, e) => sum + e.price, 0);
  const totalSpinsUsed = entries.reduce((sum, e) => sum + e.usedSpins, 0);

  const updateSlabField = <K extends keyof PriceSlab>(
    slabId: string,
    field: K,
    value: PriceSlab[K]
  ) => {
    setDraftSlabs((prev) =>
      prev.map((s) => (s.id === slabId ? { ...s, [field]: value } : s))
    );
    setSaveNotice(null);
    setErrorNotice(null);
  };

  const updateOffer = (
    slabId: string,
    offerId: string,
    updater: (offer: PrizeOffer) => PrizeOffer
  ) => {
    setDraftSlabs((prev) =>
      prev.map((s) => {
        if (s.id !== slabId) return s;
        return {
          ...s,
          prizes: s.prizes.map((p) => (p.id === offerId ? updater(p) : p)),
        };
      })
    );
    setSaveNotice(null);
    setErrorNotice(null);
  };

  const handleDeletePrize = (slabId: string, offerId: string) => {
    setDraftSlabs((prev) =>
      prev.map((s) => {
        if (s.id !== slabId) return s;
        if (s.prizes.length <= 1) {
          setErrorNotice('Har Slab me kam se kam 1 gift hona zaroori hai.');
          return s;
        }
        return {
          ...s,
          prizes: s.prizes.filter((p) => p.id !== offerId),
        };
      })
    );
    setSaveNotice(null);
  };

  const handleAddPrize = (slabId: string) => {
    const text = (newPrizeInputs[slabId] || '').trim();
    if (!text) {
      setErrorNotice('Naya gift naam likh kar Add karein.');
      return;
    }
    const newOffer: PrizeOffer = {
      id: `offer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: text,
      chance: 0,
      enabled: true,
    };
    setDraftSlabs((prev) =>
      prev.map((s) =>
        s.id === slabId ? { ...s, prizes: [...s.prizes, newOffer] } : s
      )
    );
    setNewPrizeInputs((prev) => ({ ...prev, [slabId]: '' }));
    setErrorNotice(null);
    setSaveNotice(null);
  };

  const handleAutoBalance100 = (slabId: string) => {
    setDraftSlabs((prev) =>
      prev.map((s) => {
        if (s.id !== slabId) return s;
        const enabledIndices = s.prizes
          .map((p, i) => (p.enabled ? i : -1))
          .filter((i) => i !== -1);

        if (enabledIndices.length === 0) {
          setErrorNotice(
            `"${s.name}" me kam se kam ek Gift ON karein tabhi 100% balance hoga.`
          );
          return s;
        }

        const currentSum = enabledIndices.reduce(
          (sum, idx) => sum + Math.max(0, s.prizes[idx].chance),
          0
        );

        const nextPrizes = s.prizes.map((p) => ({ ...p }));

        if (currentSum === 0) {
          const base = Math.floor(100 / enabledIndices.length);
          let rem = 100 - base * enabledIndices.length;
          enabledIndices.forEach((idx) => {
            nextPrizes[idx].chance = base + (rem > 0 ? 1 : 0);
            if (rem > 0) rem--;
          });
        } else {
          // Largest-remainder scaling to hit exact 100
          const exact = enabledIndices.map((idx) => ({
            idx,
            val: (Math.max(0, nextPrizes[idx].chance) * 100) / currentSum,
          }));
          let floorSum = 0;
          const remainders = exact.map((item) => {
            const fl = Math.floor(item.val);
            floorSum += fl;
            nextPrizes[item.idx].chance = fl;
            return { idx: item.idx, rem: item.val - fl };
          });
          remainders.sort((a, b) => b.rem - a.rem);
          let needed = 100 - floorSum;
          for (let i = 0; i < remainders.length && needed > 0; i++) {
            nextPrizes[remainders[i].idx].chance += 1;
            needed--;
          }
        }

        return { ...s, prizes: nextPrizes };
      })
    );
    setSaveNotice(null);
    setErrorNotice(null);
  };

  const handleAddNewSlab = () => {
    const newId = `slab-custom-${Date.now()}`;
    const newSlab: PriceSlab = {
      id: newId,
      name: 'Naya Offer Slab (50,000 Under)',
      minPrice: 30000,
      maxPrice: 49999,
      spinCount: 5,
      isVip: true,
      prizes: [
        { id: `${newId}-1`, name: 'Free Earphone', chance: 30, enabled: true },
        { id: `${newId}-2`, name: '500₹ Cashback', chance: 20, enabled: true },
        { id: `${newId}-3`, name: '1000₹ OFF', chance: 10, enabled: true },
        { id: `${newId}-4`, name: 'Free Gift', chance: 20, enabled: true },
        { id: `${newId}-5`, name: 'Better Luck Next Time', chance: 20, enabled: true },
      ],
    };
    setDraftSlabs((prev) => [...prev, newSlab]);
    setSaveNotice(null);
    setErrorNotice(null);
  };

  const handleDeleteSlab = (slabId: string) => {
    if (draftSlabs.length <= 1) {
      setErrorNotice('Kam se kam 1 Price Slab hona zaroori hai.');
      return;
    }
    setDraftSlabs((prev) => prev.filter((s) => s.id !== slabId));
    setSaveNotice(null);
  };

  const handleResetDefaults = () => {
    setDraftSlabs(cloneSlabs(DEFAULT_SLABS));
    setSaveNotice(
      'Default Smart Slabs & Probability load ho gaye! Lagu karne ke liye Save Settings dabaiye.'
    );
    setErrorNotice(null);
  };

  const handleSaveAll = () => {
    const sanitized: PriceSlab[] = draftSlabs.map((slab) => ({
      ...slab,
      name: slab.name.trim() || 'Offer Slab',
      minPrice: Math.max(0, Number(slab.minPrice) || 0),
      maxPrice:
        slab.maxPrice === null ? null : Math.max(0, Number(slab.maxPrice) || 0),
      spinCount: Math.max(1, Number(slab.spinCount) || 1),
      prizes: slab.prizes
        .map((p) => ({
          ...p,
          name: p.name.trim(),
          chance: Math.min(100, Math.max(0, Math.round(Number(p.chance) || 0))),
        }))
        .filter((p) => p.name !== ''),
    }));

    for (const s of sanitized) {
      if (s.maxPrice !== null && s.maxPrice < s.minPrice) {
        setErrorNotice(
          `"${s.name}" me Max Price, Min Price se kam nahi ho sakta.`
        );
        return;
      }

      const activeOffers = getActiveWheelOffers(s.prizes);
      if (activeOffers.length === 0) {
        setErrorNotice(
          `"${s.name}" me kam se kam 1 Gift ON hona chahiye jiska Chance > 0% ho.`
        );
        return;
      }

      const totalChance = getSlabTotalChance(s.prizes);
      if (totalChance !== 100) {
        setErrorNotice(
          `"${s.name}" ka Total Chance ${totalChance}% hai. Rule ke hisaab se har Slab ka Total Chance 100% hona chahiye!`
        );
        return;
      }
    }

    onSaveSlabs(sanitized);
    setDraftSlabs(cloneSlabs(sanitized));
    setErrorNotice(null);
    setSaveNotice(
      'Settings Saved! Smart Gift Probability aur Slabs Main Website par turant lagu ho gaye.'
    );
  };

  return (
    <section
      aria-labelledby="admin-panel-heading"
      className="w-full max-w-6xl mx-auto space-y-6"
    >
      {/* Top Admin Header & Controls */}
      <div className="bg-[#0C1D3D] border border-amber-400/35 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-wider text-amber-400">
              KESHRI MOBILE AND ELECTRONIC
            </p>
            <h2
              id="admin-panel-heading"
              className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5"
            >
              ADMIN PANEL — Smart Offer &amp; Probability Control
            </h2>
          </div>

          {/* Required Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleSaveAll}
              className="min-h-[46px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold text-sm flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>

            <button
              type="button"
              onClick={onBackToWebsite}
              className="min-h-[46px] px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back To Website</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="min-h-[46px] px-4 py-2.5 rounded-xl bg-red-600/90 hover:bg-red-500 text-white font-bold text-sm flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-5 flex flex-wrap gap-2 pt-4 border-t border-slate-700/70">
          <button
            type="button"
            onClick={() => setActiveTab('slabs')}
            className={`min-h-[46px] px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'slabs'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-[#071229] text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>1 &amp; 2. Price Slab, Spin Count &amp; Gift Chance %</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('entries')}
            className={`min-h-[46px] px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'entries'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-[#071229] text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>3. Entry List &amp; Spin History ({entries.length})</span>
          </button>
        </div>
      </div>

      {/* Feedback Alerts */}
      {saveNotice && (
        <div
          role="status"
          className="rounded-xl bg-emerald-950/90 border border-emerald-500/70 px-4 py-3.5 text-emerald-100 font-semibold flex items-center gap-2.5"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{saveNotice}</span>
        </div>
      )}

      {errorNotice && (
        <div
          role="alert"
          className="rounded-xl bg-red-950/90 border border-red-500/70 px-4 py-3.5 text-red-100 font-semibold flex items-center gap-2.5"
        >
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* TAB 1: SLABS, SPIN COUNT & PROBABILITY CHANCE % */}
      {activeTab === 'slabs' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                <span>Smart Setting: Price Slab &amp; Gift Chance %</span>
              </h3>
              <p className="text-sm text-slate-300 mt-0.5">
                Har Slab ka Total Chance <strong className="text-emerald-400">100%</strong> hona chahiye. Jiska Chance <strong className="text-amber-300">0%</strong> ya <strong className="text-amber-300">OFF</strong> hoga, wo gift us Slab ke Wheel me nahi aayega.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Default Slabs</span>
              </button>

              <button
                type="button"
                onClick={handleAddNewSlab}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-extrabold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Naya Slab Add Karein</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {draftSlabs.map((slab, slabIndex) => {
              const totalChance = getSlabTotalChance(slab.prizes);
              const isTotalValid = totalChance === 100;
              const activeCount = getActiveWheelOffers(slab.prizes).length;

              return (
                <div
                  key={slab.id}
                  className="bg-[#0C1D3D] border border-slate-700/80 rounded-2xl p-5 space-y-4 shadow-lg"
                >
                  {/* Slab Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-700/70">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-amber-400 font-mono-num">
                        Slab #{slabIndex + 1}
                      </span>
                      {slab.isVip && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300">
                          <Crown className="w-4 h-4" /> VIP
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSlab(slab.id)}
                      className="min-h-[38px] px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Slab</span>
                    </button>
                  </div>

                  {/* Slab Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Slab Name
                    </label>
                    <input
                      type="text"
                      value={slab.name}
                      onChange={(e) =>
                        updateSlabField(slab.id, 'name', e.target.value)
                      }
                      className="w-full h-11 px-3.5 rounded-lg bg-[#071229] border border-slate-600 focus:border-amber-400 text-white text-sm font-semibold outline-none"
                    />
                  </div>

                  {/* Min Price, Max Price, Spin Count */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Min Price (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={slab.minPrice}
                        onChange={(e) =>
                          updateSlabField(
                            slab.id,
                            'minPrice',
                            Math.max(0, Number(e.target.value))
                          )
                        }
                        className="w-full h-11 px-3 rounded-lg bg-[#071229] border border-slate-600 focus:border-amber-400 text-white text-sm font-mono-num outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Max Price (₹)
                      </label>
                      <input
                        type="number"
                        min={0}
                        disabled={slab.maxPrice === null}
                        value={slab.maxPrice === null ? '' : slab.maxPrice}
                        placeholder="Unlimited"
                        onChange={(e) =>
                          updateSlabField(
                            slab.id,
                            'maxPrice',
                            e.target.value === ''
                              ? null
                              : Math.max(0, Number(e.target.value))
                          )
                        }
                        className="w-full h-11 px-3 rounded-lg bg-[#071229] border border-slate-600 focus:border-amber-400 disabled:opacity-50 text-white text-sm font-mono-num outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Spin Count
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={slab.spinCount}
                        onChange={(e) =>
                          updateSlabField(
                            slab.id,
                            'spinCount',
                            Math.max(1, Number(e.target.value) || 1)
                          )
                        }
                        className="w-full h-11 px-3 rounded-lg bg-[#071229] border border-slate-600 focus:border-amber-400 text-emerald-400 font-bold text-sm font-mono-num outline-none"
                      />
                    </div>
                  </div>

                  {/* Checkboxes */}
                  <div className="flex flex-wrap items-center gap-5 text-xs text-slate-200">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={slab.maxPrice === null}
                        onChange={(e) =>
                          updateSlabField(
                            slab.id,
                            'maxPrice',
                            e.target.checked ? null : slab.minPrice + 9999
                          )
                        }
                        className="w-4 h-4 accent-amber-400"
                      />
                      <span>No Max Limit (Upar / Unlimited)</span>
                    </label>

                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={slab.isVip}
                        onChange={(e) =>
                          updateSlabField(slab.id, 'isVip', e.target.checked)
                        }
                        className="w-4 h-4 accent-amber-400"
                      />
                      <span>VIP Customer Badge</span>
                    </label>
                  </div>

                  {/* Total Chance % Status Bar */}
                  <div
                    className={`rounded-xl px-4 py-3 border flex flex-wrap items-center justify-between gap-2 ${
                      isTotalValid && activeCount > 0
                        ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                        : 'bg-red-950/70 border-red-500/60 text-red-100'
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-bold">
                      Total Chance:{' '}
                      <span className="font-mono-num text-base">
                        {totalChance}%
                      </span>{' '}
                      {isTotalValid ? (
                        <span className="text-emerald-300 font-semibold">
                          · Perfect (100%) · Wheel Items: {activeCount}
                        </span>
                      ) : (
                        <span className="text-red-200 font-semibold">
                          · 100% hona zaroori hai (
                          {totalChance < 100
                            ? `${100 - totalChance}% aur badhayein`
                            : `${totalChance - 100}% kam karein`}
                          )
                        </span>
                      )}
                    </div>

                    {!isTotalValid && (
                      <button
                        type="button"
                        onClick={() => handleAutoBalance100(slab.id)}
                        className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold cursor-pointer whitespace-nowrap"
                      >
                        Auto-Balance 100%
                      </button>
                    )}
                  </div>

                  {/* Gift Probability Rows: Gift Name | Chance % Slider (0% to 100%) | ON/OFF Button */}
                  <div className="pt-2 space-y-2.5">
                    <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-2 text-[11px] font-bold text-amber-300 tracking-wide">
                      <div className="col-span-5 flex items-center gap-1">
                        <Gift className="w-3.5 h-3.5" />
                        <span>Gift Name</span>
                      </div>
                      <div className="col-span-4">Chance % Slider (0% - 100%)</div>
                      <div className="col-span-3 text-right">ON/OFF &amp; Del</div>
                    </div>

                    <div className="space-y-2.5">
                      {slab.prizes.map((offer) => {
                        const isActiveOnWheel = offer.enabled && offer.chance > 0;
                        return (
                          <div
                            key={offer.id}
                            className={`rounded-xl border p-3 transition-colors space-y-2.5 sm:space-y-0 sm:grid sm:grid-cols-12 sm:items-center sm:gap-2.5 ${
                              offer.enabled
                                ? 'bg-[#071229] border-slate-700'
                                : 'bg-[#050C1B] border-slate-800/80 opacity-70'
                            }`}
                          >
                            {/* Gift Name */}
                            <div className="sm:col-span-5">
                              <input
                                type="text"
                                value={offer.name}
                                onChange={(e) =>
                                  updateOffer(slab.id, offer.id, (p) => ({
                                    ...p,
                                    name: e.target.value,
                                  }))
                                }
                                className="w-full h-10 px-3 rounded-lg bg-[#0C1D3D] border border-slate-600 focus:border-amber-400 text-white text-sm font-semibold outline-none"
                              />
                              <p className="text-[11px] mt-1 text-slate-400">
                                {isActiveOnWheel
                                  ? 'Wheel me dikhega'
                                  : '0% / OFF — Wheel me nahi aayega'}
                              </p>
                            </div>

                            {/* Chance % Slider + Number */}
                            <div className="sm:col-span-4 flex items-center gap-2">
                              <input
                                type="range"
                                min={0}
                                max={100}
                                step={1}
                                value={offer.enabled ? offer.chance : 0}
                                onChange={(e) => {
                                  const val = Math.min(
                                    100,
                                    Math.max(0, Number(e.target.value))
                                  );
                                  updateOffer(slab.id, offer.id, (p) => ({
                                    ...p,
                                    chance: val,
                                    enabled: val > 0 ? true : p.enabled,
                                  }));
                                }}
                                aria-label={`${offer.name} chance percentage slider`}
                                className="flex-1 accent-amber-400 cursor-pointer h-2"
                              />
                              <div className="flex items-center bg-[#0C1D3D] border border-slate-600 rounded-lg px-2 h-9 shrink-0">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={offer.enabled ? offer.chance : 0}
                                  onChange={(e) => {
                                    const val = Math.min(
                                      100,
                                      Math.max(0, Number(e.target.value) || 0)
                                    );
                                    updateOffer(slab.id, offer.id, (p) => ({
                                      ...p,
                                      chance: val,
                                      enabled: val > 0 ? true : p.enabled,
                                    }));
                                  }}
                                  aria-label={`${offer.name} chance percentage`}
                                  className="w-10 bg-transparent text-amber-300 font-bold text-xs font-mono-num text-right outline-none"
                                />
                                <span className="text-xs text-slate-400 ml-0.5">%</span>
                              </div>
                            </div>

                            {/* ON/OFF Button & Delete */}
                            <div className="sm:col-span-3 flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  updateOffer(slab.id, offer.id, (p) => ({
                                    ...p,
                                    enabled: !p.enabled,
                                  }))
                                }
                                className={`min-h-[38px] px-3.5 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                                  offer.enabled
                                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                }`}
                              >
                                {offer.enabled ? 'ON' : 'OFF'}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeletePrize(slab.id, offer.id)
                                }
                                aria-label={`Delete offer ${offer.name}`}
                                className="min-h-[38px] min-w-[38px] rounded-lg bg-slate-800 hover:bg-red-900/80 text-slate-300 hover:text-red-200 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add New Offer */}
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="text"
                        value={newPrizeInputs[slab.id] || ''}
                        onChange={(e) =>
                          setNewPrizeInputs((prev) => ({
                            ...prev,
                            [slab.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddPrize(slab.id);
                          }
                        }}
                        placeholder="Naya gift likho (jaise: Free Neckband)"
                        className="flex-1 h-11 px-3 rounded-lg bg-[#071229] border border-dashed border-amber-400/50 focus:border-amber-400 text-white placeholder-slate-400 text-sm outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddPrize(slab.id)}
                        className="min-h-[44px] px-4 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Gift</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ENTRY LIST & SPIN HISTORY */}
      {activeTab === 'entries' && (
        <div className="space-y-5">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#0C1D3D] border border-slate-700/80 rounded-2xl p-5">
              <p className="text-xs font-semibold text-slate-300">
                Total Customer
              </p>
              <p className="text-3xl font-extrabold text-white font-mono-num mt-1">
                {totalCustomers}
              </p>
            </div>

            <div className="bg-[#0C1D3D] border border-slate-700/80 rounded-2xl p-5">
              <p className="text-xs font-semibold text-slate-300">
                Total Sale
              </p>
              <p className="text-3xl font-extrabold text-amber-300 font-mono-num mt-1">
                {formatCurrency(totalSale)}
              </p>
            </div>

            <div className="bg-[#0C1D3D] border border-slate-700/80 rounded-2xl p-5">
              <p className="text-xs font-semibold text-slate-300">
                Total Spins Used
              </p>
              <p className="text-3xl font-extrabold text-emerald-400 font-mono-num mt-1">
                {totalSpinsUsed}
              </p>
            </div>
          </div>

          {/* Entry History Table + Clear All */}
          <div className="bg-[#0C1D3D] border border-slate-700/80 rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-700/70">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Customer Entry &amp; Spin History
              </h3>

              {entries.length > 0 && (
                <div className="flex items-center gap-2">
                  {!confirmClear ? (
                    <button
                      type="button"
                      onClick={() => setConfirmClear(true)}
                      className="min-h-[42px] px-4 py-2 rounded-xl bg-red-600/90 hover:bg-red-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Clear List</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-red-950/90 border border-red-500/70 rounded-xl px-3 py-1.5">
                      <span className="text-xs font-bold text-red-100">
                        Saari list delete karein?
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          onClearEntries();
                          setConfirmClear(false);
                        }}
                        className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
                      >
                        Haan, Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClear(false)}
                        className="px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {entries.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">
                Koi entry record nahi hai.
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-700 text-xs font-semibold text-amber-300">
                      <th className="py-3 pr-3">Name</th>
                      <th className="py-3 px-3">Number</th>
                      <th className="py-3 px-3">Brand</th>
                      <th className="py-3 px-3">Price</th>
                      <th className="py-3 px-3">Total Spin Mila</th>
                      <th className="py-3 px-3">Kitna Use Hua</th>
                      <th className="py-3 px-3">Kya-Kya Jeeta</th>
                      <th className="py-3 pl-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-[#071229]/60">
                        <td className="py-3.5 pr-3 font-semibold text-white">
                          {entry.name}
                        </td>
                        <td className="py-3.5 px-3 text-slate-300 font-mono-num">
                          {entry.phone}
                        </td>
                        <td className="py-3.5 px-3 text-slate-200">
                          {entry.brand}
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-amber-300 font-mono-num">
                          {formatCurrency(entry.price)}
                        </td>
                        <td className="py-3.5 px-3 font-bold text-white font-mono-num">
                          {entry.totalSpins}
                        </td>
                        <td className="py-3.5 px-3 font-mono-num">
                          <span className="text-emerald-400 font-bold">
                            {entry.usedSpins}
                          </span>
                          <span className="text-slate-400">
                            /{entry.totalSpins}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-amber-200">
                          {entry.results.length > 0
                            ? entry.results
                                .map((r) => `Spin ${r.spinNumber}: ${r.prize}`)
                                .join(' | ')
                            : 'None'}
                        </td>
                        <td className="py-3.5 pl-3 text-right">
                          <button
                            type="button"
                            onClick={() => onDeleteEntry(entry.id)}
                            aria-label={`Delete entry ${entry.name}`}
                            className="min-h-[38px] px-3 py-1.5 rounded-lg bg-red-950/70 hover:bg-red-800 border border-red-700/50 text-red-200 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
