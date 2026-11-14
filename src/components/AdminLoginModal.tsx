import React, { useState } from 'react';
import { AlertCircle, Lock, LogIn, X } from 'lucide-react';
import { ADMIN_DEFAULT_PASSWORD } from '../constants';

interface AdminLoginModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  onSuccess,
  onClose,
}) => {
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === ADMIN_DEFAULT_PASSWORD) {
      setErrorMsg(null);
      onSuccess();
    } else {
      setErrorMsg('Wrong Password');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-login-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-[#0C1D3D] border border-amber-400/40 shadow-2xl p-6 sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close login modal"
          className="absolute right-4 top-4 w-11 h-11 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2
              id="admin-login-title"
              className="text-xl sm:text-2xl font-extrabold text-white"
            >
              ADMIN LOGIN
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Admin Panel kholne ke liye password dalen
            </p>
          </div>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mb-4 flex items-center gap-2.5 rounded-xl bg-red-950/90 border border-red-500/80 px-4 py-3 text-red-100 font-bold text-sm sm:text-base"
          >
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-password-input"
              className="block text-sm font-semibold text-amber-200 mb-2"
            >
              Admin Password
            </label>
            <input
              id="admin-password-input"
              type="password"
              autoFocus
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Password likho"
              className="w-full h-13 px-4 rounded-xl bg-[#071229] border border-slate-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30 text-white text-base outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full min-h-[52px] px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-extrabold text-base sm:text-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogIn className="w-5 h-5" />
            <span>Login Karein</span>
          </button>
        </form>
      </div>
    </div>
  );
};
