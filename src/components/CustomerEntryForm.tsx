import React, { useState } from 'react';
import { AlertCircle, ArrowRight, IndianRupee, Phone, Smartphone, User } from 'lucide-react';
import { BRAND_OPTIONS, findMatchingSlab, formatCurrency } from '../constants';
import { PriceSlab } from '../types';

interface CustomerEntryFormProps {
  slabs: PriceSlab[];
  onSubmitCustomer: (data: {
    name: string;
    phone: string;
    brand: string;
    price: number;
  }) => void;
}

export const CustomerEntryForm: React.FC<CustomerEntryFormProps> = ({
  slabs,
  onSubmitCustomer,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [brand, setBrand] = useState('');
  const [priceStr, setPriceStr] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const parsedPrice = Number(priceStr);
  const hasValidPreviewPrice = priceStr.trim() !== '' && !Number.isNaN(parsedPrice) && parsedPrice >= 0;
  const previewSlab = hasValidPreviewPrice ? findMatchingSlab(parsedPrice, slabs) : null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(digitsOnly);
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('Kripya Customer ka Naam likhen (Customer Name khali hai).');
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setErrorMsg('Galat Phone Number! Kripya sahi 10 digit ka mobile number dalen.');
      return;
    }

    if (!brand) {
      setErrorMsg('Kripya Phone ya Electronic Brand chunein.');
      return;
    }

    if (!priceStr.trim() || Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setErrorMsg('Kripya sahi Last Price (Final Price) dalen, jaise 12999.');
      return;
    }

    setErrorMsg(null);
    onSubmitCustomer({
      name: trimmedName,
      phone,
      brand,
      price: Math.round(parsedPrice),
    });
  };

  return (
    <section
      aria-labelledby="step1-heading"
      className="w-full max-w-2xl mx-auto bg-[#0C1D3D] border border-amber-400/25 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-2xl"
    >
      <div className="mb-6 pb-4 border-b border-slate-700/70">
        <p className="text-xs sm:text-sm font-semibold tracking-wider text-amber-400">
          KESHRI MOBILE AND ELECTRONIC
        </p>
        <h2
          id="step1-heading"
          className="text-2xl sm:text-3xl font-extrabold text-white mt-1"
        >
          STEP 1 - Customer Entry
        </h2>
        <p className="text-sm text-slate-300 mt-1">
          Detail bharein aur Price ke hisaab se Auto Spin jeetein
        </p>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-xl bg-red-950/90 border border-red-500/70 p-4 text-red-100"
        >
          <AlertCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
          <div className="text-sm sm:text-base font-semibold leading-snug">
            {errorMsg}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* 1. Customer Name */}
        <div>
          <label
            htmlFor="customer-name"
            className="block text-sm sm:text-base font-semibold text-amber-200 mb-2"
          >
            1. Customer Name
          </label>
          <div className="relative">
            <User className="w-5 h-5 text-amber-400/80 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="customer-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Customer ka naam likho"
              className="w-full h-14 pl-12 pr-4 rounded-xl bg-[#071229] border border-slate-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 text-white placeholder-slate-400 text-base sm:text-lg outline-none transition-colors"
            />
          </div>
        </div>

        {/* 2. Phone Number */}
        <div>
          <label
            htmlFor="customer-phone"
            className="block text-sm sm:text-base font-semibold text-amber-200 mb-2"
          >
            2. Phone Number (10 Digit)
          </label>
          <div className="relative">
            <Phone className="w-5 h-5 text-amber-400/80 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="customer-phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={handlePhoneChange}
              placeholder="10 digit mobile number likho"
              className="w-full h-14 pl-12 pr-20 rounded-xl bg-[#071229] border border-slate-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 text-white placeholder-slate-400 text-base sm:text-lg font-mono-num outline-none transition-colors"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono-num text-slate-400">
              {phone.length}/10
            </span>
          </div>
        </div>

        {/* 3. Phone Brand Name */}
        <div>
          <label
            htmlFor="customer-brand"
            className="block text-sm sm:text-base font-semibold text-amber-200 mb-2"
          >
            3. Phone / Electronic Brand Name
          </label>
          <div className="relative">
            <Smartphone className="w-5 h-5 text-amber-400/80 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              id="customer-brand"
              value={brand}
              onChange={(e) => {
                setBrand(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              className="w-full h-14 pl-12 pr-4 rounded-xl bg-[#071229] border border-slate-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 text-white text-base sm:text-lg outline-none transition-colors appearance-none cursor-pointer"
            >
              <option value="" className="bg-[#071229] text-slate-400">
                -- Brand Select Karein --
              </option>
              {BRAND_OPTIONS.map((b) => (
                <option key={b} value={b} className="bg-[#071229] text-white">
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. Last Price */}
        <div>
          <label
            htmlFor="customer-price"
            className="block text-sm sm:text-base font-semibold text-amber-200 mb-2"
          >
            4. Last Price (Final Price ₹)
          </label>
          <div className="relative">
            <IndianRupee className="w-5 h-5 text-amber-400/80 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="customer-price"
              type="number"
              inputMode="numeric"
              min={1}
              value={priceStr}
              onChange={(e) => {
                setPriceStr(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Jaise - 12999"
              className="w-full h-14 pl-12 pr-4 rounded-xl bg-[#071229] border border-slate-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 text-white placeholder-slate-400 text-base sm:text-lg font-mono-num outline-none transition-colors"
            />
          </div>
        </div>

        {/* Automatic Slab & Spin Count Detection Banner */}
        {previewSlab && parsedPrice > 0 && (
          <div className="rounded-xl bg-[#081530] border border-amber-400/40 px-4 py-3.5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs text-slate-300">
                Auto Slab ({formatCurrency(parsedPrice)})
              </p>
              <p className="text-sm sm:text-base font-bold text-amber-300">
                {previewSlab.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-300">Auto Spin Count</p>
              <p className="text-lg sm:text-xl font-extrabold text-emerald-400 font-mono-num">
                {previewSlab.spinCount} {previewSlab.spinCount === 1 ? 'Spin' : 'Spins'}
              </p>
            </div>
          </div>
        )}

        {/* Golden CTA Button */}
        <button
          type="submit"
          className="w-full min-h-[58px] px-6 py-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 active:scale-[0.99] text-slate-950 font-extrabold text-lg sm:text-xl tracking-wide shadow-[0_10px_28px_rgba(245,158,11,0.35)] transition-all flex items-center justify-center gap-3 cursor-pointer"
        >
          <span>SAVE &amp; GO TO SPIN</span>
          <ArrowRight className="w-6 h-6 shrink-0" />
        </button>
      </form>
    </section>
  );
};
