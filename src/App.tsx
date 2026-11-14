import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminPanel } from './components/AdminPanel';
import { CustomerEntryForm } from './components/CustomerEntryForm';
import { SpinStep } from './components/SpinStep';
import {
  DEFAULT_SLABS,
  STORAGE_KEYS,
  findMatchingSlab,
} from './constants';
import { CustomerEntry, PriceSlab } from './types';

function loadSlabs(): PriceSlab[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SLABS);
    if (!raw) return DEFAULT_SLABS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Fallback to default slabs
  }
  return DEFAULT_SLABS;
}

function loadEntries(): CustomerEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ENTRIES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Fallback to empty list
  }
  return [];
}

function loadSessionCustomerId(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEYS.ACTIVE_CUSTOMER_ID) || null;
  } catch {
    return null;
  }
}

export default function App() {
  const [slabs, setSlabs] = useState<PriceSlab[]>(loadSlabs);
  const [entries, setEntries] = useState<CustomerEntry[]>(loadEntries);
  // Session-scoped customer ID so concurrent customers/tabs never mix
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(
    loadSessionCustomerId
  );

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Sync changes across concurrent tabs/windows without mixing sessions
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.SLABS) {
        setSlabs(loadSlabs());
      } else if (e.key === STORAGE_KEYS.ENTRIES) {
        setEntries(loadEntries());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Persist active customer ID strictly in sessionStorage (per-tab isolation + refresh protection)
  useEffect(() => {
    try {
      if (activeCustomerId) {
        sessionStorage.setItem(STORAGE_KEYS.ACTIVE_CUSTOMER_ID, activeCustomerId);
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.ACTIVE_CUSTOMER_ID);
      }
    } catch {
      // Ignore storage quota issues
    }
  }, [activeCustomerId]);

  const activeCustomer = useMemo(
    () => entries.find((e) => e.id === activeCustomerId) || null,
    [entries, activeCustomerId]
  );

  const handleSaveSlabs = (updatedSlabs: PriceSlab[]) => {
    setSlabs(updatedSlabs);
    try {
      localStorage.setItem(STORAGE_KEYS.SLABS, JSON.stringify(updatedSlabs));
    } catch {
      // Ignore storage quota issues
    }
  };

  const handleCreateCustomer = (data: {
    name: string;
    phone: string;
    brand: string;
    price: number;
  }) => {
    const latestSlabs = loadSlabs();
    setSlabs(latestSlabs);

    const matchedSlab = findMatchingSlab(data.price, latestSlabs);
    const uniqueId = `cust-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const newEntry: CustomerEntry = {
      id: uniqueId,
      name: data.name,
      phone: data.phone,
      brand: data.brand,
      price: data.price,
      slabId: matchedSlab.id,
      slabName: matchedSlab.name,
      isVip: matchedSlab.isVip,
      totalSpins: matchedSlab.spinCount,
      usedSpins: 0,
      prizesSnapshot: matchedSlab.prizes.map((p) => ({ ...p })),
      results: [],
      createdAt: new Date().toISOString(),
    };

    // Merge with latest localStorage entries so concurrent visitors never overwrite each other
    const latestEntries = loadEntries();
    const nextEntries = [newEntry, ...latestEntries];
    setEntries(nextEntries);
    setActiveCustomerId(newEntry.id);

    try {
      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(nextEntries));
      sessionStorage.setItem(STORAGE_KEYS.ACTIVE_CUSTOMER_ID, newEntry.id);
    } catch {
      // Ignore
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRecordSpin = (customerId: string, prize: string) => {
    // Read latest entries before updating to avoid clobbering concurrent tabs
    const latestEntries = loadEntries();
    const sourceEntries = latestEntries.length > 0 ? latestEntries : entries;
    const target = sourceEntries.find((e) => e.id === customerId);

    if (!target || target.usedSpins >= target.totalSpins) {
      return {
        spinNumber: target ? target.usedSpins : 0,
        remainingSpins: 0,
      };
    }

    const nextUsed = target.usedSpins + 1;
    const nextRemaining = Math.max(0, target.totalSpins - nextUsed);

    const updatedEntries = sourceEntries.map((entry) => {
      if (entry.id !== customerId) return entry;
      return {
        ...entry,
        usedSpins: nextUsed,
        results: [
          ...entry.results,
          {
            spinNumber: nextUsed,
            prize,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    });

    setEntries(updatedEntries);
    try {
      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(updatedEntries));
    } catch {
      // Ignore
    }

    return {
      spinNumber: nextUsed,
      remainingSpins: nextRemaining,
    };
  };

  const handleAddNewCustomer = () => {
    setActiveCustomerId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAdmin = () => {
    if (isAdminAuthenticated) {
      setEntries(loadEntries());
      setShowAdminPanel(true);
    } else {
      setShowAdminLoginModal(true);
    }
  };

  const handleAdminLoginSuccess = () => {
    setEntries(loadEntries());
    setIsAdminAuthenticated(true);
    setShowAdminLoginModal(false);
    setShowAdminPanel(true);
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setShowAdminPanel(false);
  };

  const handleDeleteEntry = (entryId: string) => {
    const latest = loadEntries();
    const next = latest.filter((e) => e.id !== entryId);
    setEntries(next);
    try {
      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(next));
    } catch {
      // Ignore
    }
    if (activeCustomerId === entryId) {
      setActiveCustomerId(null);
    }
  };

  const handleClearEntries = () => {
    setEntries([]);
    setActiveCustomerId(null);
    try {
      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify([]));
    } catch {
      // Ignore
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#050C1D] via-[#081633] to-[#050C1D] text-slate-100">
      {/* Shop Header */}
      <header className="relative border-b border-amber-400/25 bg-[#061027]/95">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-3 pb-5 sm:py-6">
          {/* Top Right Admin Button */}
          <div className="flex justify-end mb-2 sm:mb-0 sm:absolute sm:right-6 sm:top-5">
            <button
              type="button"
              onClick={handleOpenAdmin}
              className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[#0C1D3D] hover:bg-amber-400 hover:text-slate-950 border border-amber-400/45 text-amber-300 text-xs font-extrabold tracking-wide flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                {isAdminAuthenticated ? 'ADMIN PANEL' : 'ADMIN LOGIN'}
              </span>
            </button>
          </div>

          {/* Centered Shop Branding */}
          <div className="text-center max-w-3xl mx-auto sm:px-24">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-orange-400 bg-clip-text text-transparent text-balance">
              KESHRI MOBILE AND ELECTRONIC
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm font-semibold text-orange-300 tracking-wide">
              Mobile • Electronic • Best Price • Best Service
            </p>
            <p className="mt-2 text-sm sm:text-lg font-bold text-white">
              Lucky Draw Offer - Har Customer Jeet Sakta Hai
            </p>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {showAdminPanel && isAdminAuthenticated ? (
          <AdminPanel
            slabs={slabs}
            entries={entries}
            onSaveSlabs={handleSaveSlabs}
            onDeleteEntry={handleDeleteEntry}
            onClearEntries={handleClearEntries}
            onBackToWebsite={() => setShowAdminPanel(false)}
            onLogout={handleAdminLogout}
          />
        ) : activeCustomer ? (
          <SpinStep
            key={activeCustomer.id}
            customer={activeCustomer}
            onRecordSpin={handleRecordSpin}
            onAddNewCustomer={handleAddNewCustomer}
          />
        ) : (
          <CustomerEntryForm
            slabs={slabs}
            onSubmitCustomer={handleCreateCustomer}
          />
        )}
      </main>

      {/* Shop Footer */}
      <footer className="border-t border-amber-400/20 bg-[#050C1D] py-5 px-4 text-center">
        <p className="text-sm sm:text-base font-bold text-amber-300">
          KESHRI MOBILE AND ELECTRONIC - Thank You For Visiting
        </p>
      </footer>

      {/* Admin Login Password Modal */}
      {showAdminLoginModal && (
        <AdminLoginModal
          onSuccess={handleAdminLoginSuccess}
          onClose={() => setShowAdminLoginModal(false)}
        />
      )}
    </div>
  );
}
