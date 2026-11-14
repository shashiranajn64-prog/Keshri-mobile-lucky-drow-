export interface PrizeOffer {
  id: string;
  name: string;
  chance: number;
  enabled: boolean;
}

export interface PriceSlab {
  id: string;
  name: string;
  minPrice: number;
  maxPrice: number | null;
  spinCount: number;
  isVip: boolean;
  prizes: PrizeOffer[];
}

export interface SpinResult {
  spinNumber: number;
  prize: string;
  timestamp: string;
}

export interface CustomerEntry {
  id: string;
  name: string;
  phone: string;
  brand: string;
  price: number;
  slabId: string;
  slabName: string;
  isVip: boolean;
  totalSpins: number;
  usedSpins: number;
  prizesSnapshot: PrizeOffer[];
  results: SpinResult[];
  createdAt: string;
}

export interface AppSettings {
  slabs: PriceSlab[];
}
