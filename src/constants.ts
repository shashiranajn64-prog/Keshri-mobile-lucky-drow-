import { PriceSlab, PrizeOffer } from './types';

export const BRAND_OPTIONS: string[] = [
  'Vivo',
  'Oppo',
  'Samsung',
  'Realme',
  'Redmi',
  'iPhone',
  'OnePlus',
  'Motorola',
  'LED TV',
  'Fridge',
  'Cooler',
  'Fan',
  'Other Electronic',
];

export const DEFAULT_SLABS: PriceSlab[] = [
  {
    id: 'slab-under-10k',
    name: 'Under 10,000 Rs',
    minPrice: 0,
    maxPrice: 9999,
    spinCount: 1,
    isVip: false,
    prizes: [
      { id: 's1-p1', name: 'Better Luck Next Time', chance: 60, enabled: true },
      { id: 's1-p2', name: 'Free Cover', chance: 25, enabled: true },
      { id: 's1-p3', name: 'Free Tempered Glass', chance: 10, enabled: true },
      { id: 's1-p4', name: '100₹ OFF', chance: 5, enabled: true },
      { id: 's1-p5', name: '500₹ Cashback', chance: 0, enabled: false },
    ],
  },
  {
    id: 'slab-10k-20k',
    name: '10,000 to 20,000 Rs',
    minPrice: 10000,
    maxPrice: 19999,
    spinCount: 2,
    isVip: false,
    prizes: [
      { id: 's2-p1', name: 'Better Luck Next Time', chance: 35, enabled: true },
      { id: 's2-p2', name: 'Free Cover', chance: 25, enabled: true },
      { id: 's2-p3', name: 'Free Earphone', chance: 15, enabled: true },
      { id: 's2-p4', name: '200₹ OFF', chance: 15, enabled: true },
      { id: 's2-p5', name: 'Free Gift', chance: 5, enabled: true },
      { id: 's2-p6', name: '10% OFF', chance: 5, enabled: true },
    ],
  },
  {
    id: 'slab-20k-30k',
    name: '20,000 to 30,000 Rs',
    minPrice: 20000,
    maxPrice: 29999,
    spinCount: 3,
    isVip: false,
    prizes: [
      { id: 's3-p1', name: 'Better Luck Next Time', chance: 25, enabled: true },
      { id: 's3-p2', name: 'Free Earphone', chance: 25, enabled: true },
      { id: 's3-p3', name: 'Free Cover', chance: 20, enabled: true },
      { id: 's3-p4', name: '500₹ Cashback', chance: 10, enabled: true },
      { id: 's3-p5', name: 'Free Gift', chance: 10, enabled: true },
      { id: 's3-p6', name: '10% OFF', chance: 10, enabled: true },
    ],
  },
  {
    id: 'slab-30k-plus',
    name: '30,000 Rs Upar - VIP Customer',
    minPrice: 30000,
    maxPrice: null,
    spinCount: 4,
    isVip: true,
    prizes: [
      { id: 's4-p1', name: 'Free Earphone', chance: 30, enabled: true },
      { id: 's4-p2', name: 'Free Gift', chance: 30, enabled: true },
      { id: 's4-p3', name: '500₹ Cashback', chance: 20, enabled: true },
      { id: 's4-p4', name: 'Better Luck Next Time', chance: 20, enabled: true },
      { id: 's4-p5', name: '1000₹ OFF', chance: 0, enabled: false },
      { id: 's4-p6', name: '10% OFF Next Time', chance: 0, enabled: false },
    ],
  },
];

export const WHEEL_SLICE_COLORS: { bg: string; text: string }[] = [
  { bg: '#F59E0B', text: '#0B1120' }, // Golden Amber
  { bg: '#1D4ED8', text: '#FFFFFF' }, // Royal Blue
  { bg: '#EA580C', text: '#FFFFFF' }, // Deep Orange
  { bg: '#059669', text: '#FFFFFF' }, // Emerald Green
  { bg: '#B45309', text: '#FFFFFF' }, // Rich Bronze
  { bg: '#0F295C', text: '#FBBF24' }, // Midnight Navy + Gold
  { bg: '#DC2626', text: '#FFFFFF' }, // Festive Red
  { bg: '#0284C7', text: '#FFFFFF' }, // Cerulean Blue
];

export const STORAGE_KEYS = {
  SLABS: 'keshri_lucky_draw_slabs_v2',
  ENTRIES: 'keshri_lucky_draw_entries_v2',
  ACTIVE_CUSTOMER_ID: 'keshri_lucky_draw_active_customer_v2',
};

export const ADMIN_DEFAULT_PASSWORD = '1234';

export function getActiveWheelOffers(prizes: PrizeOffer[]): PrizeOffer[] {
  return prizes.filter((p) => p.enabled && p.chance > 0 && p.name.trim() !== '');
}

export function getSlabTotalChance(prizes: PrizeOffer[]): number {
  return prizes.reduce(
    (sum, p) => (p.enabled ? sum + Math.max(0, Number(p.chance) || 0) : sum),
    0
  );
}

export function pickWeightedOfferIndex(offers: PrizeOffer[]): number {
  if (offers.length === 0) return 0;
  const totalWeight = offers.reduce(
    (sum, offer) => sum + Math.max(0, offer.chance),
    0
  );
  if (totalWeight <= 0) {
    return Math.floor(Math.random() * offers.length);
  }
  let roll = Math.random() * totalWeight;
  for (let i = 0; i < offers.length; i++) {
    roll -= Math.max(0, offers[i].chance);
    if (roll <= 0) return i;
  }
  return offers.length - 1;
}

export function findMatchingSlab(price: number, slabs: PriceSlab[]): PriceSlab {
  const validSlabs = slabs.filter((s) => getActiveWheelOffers(s.prizes).length > 0);
  const pool = validSlabs.length > 0 ? validSlabs : DEFAULT_SLABS;

  const exactMatches = pool.filter(
    (s) => price >= s.minPrice && (s.maxPrice === null || price <= s.maxPrice)
  );

  if (exactMatches.length > 0) {
    exactMatches.sort((a, b) => {
      if (b.minPrice !== a.minPrice) return b.minPrice - a.minPrice;
      const aMax = a.maxPrice ?? Number.MAX_SAFE_INTEGER;
      const bMax = b.maxPrice ?? Number.MAX_SAFE_INTEGER;
      return aMax - bMax;
    });
    return exactMatches[0];
  }

  const sortedByMin = [...pool].sort((a, b) => a.minPrice - b.minPrice);
  for (let i = sortedByMin.length - 1; i >= 0; i--) {
    if (price >= sortedByMin[i].minPrice) {
      return sortedByMin[i];
    }
  }
  return sortedByMin[0];
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
