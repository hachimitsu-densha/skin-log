
export enum IngredientCategory {
  RETINOID = 'Retinoid',
  ACID_EXFOLIANT = 'Direct Acid / Exfoliant',
  CLAY_MASK = 'Clay / Detox Mask',
  SOOTHING_BARRIER = 'Soothing / Barrier',
  CLEANSER = 'Cleanser',
  MOISTURIZER = 'Moisturizer',
  SERUM_WATER = 'Water-based Serum',
  UNKNOWN = 'Other'
}

export enum DeviceMode {
  NONE = 'None',
  AIR_SHOT = 'Air Shot Mode',
  BOOSTER = 'Booster Mode',
  MC_DERMA = 'MC (Microcurrent) / Derma Shot'
}

export enum CycleDay {
  EXFOLIATION = 'Exfoliation Night',
  RETINOID = 'Retinoid Night',
  RECOVERY = 'Recovery Night'
}

export enum SkinGoal {
  CLEAR_PORES = 'Clear Pores',
  ANTI_AGING = 'Anti-Aging',
  GLOW = 'Texture/Glow',
  BARRIER_REPAIR = 'Barrier Repair'
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: IngredientCategory;
  imageUrl?: string;
  activeIngredients?: string[]; // e.g. ["15% Glycerin", "2% BHA"]
}

export interface UsageLog {
  date: string; // ISO String
  deviceMode: DeviceMode;
  categoryUsed: IngredientCategory;
}

export interface RoutineStep {
  step: number;
  product: Product;
  deviceMode: DeviceMode;
  level: number;
  why: string;
  guruInsight?: string;
}
