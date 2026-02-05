
import { IngredientCategory } from './types';

export const COLORS = {
  SAGE: '#A3B18A',
  DARK_SAGE: '#588157',
  CREAM: '#F5EBE0',
  LATTE: '#D4A373',
  COFFEE: '#A98467',
};

export const CATEGORY_DESCRIPTIONS: Record<IngredientCategory, string> = {
  [IngredientCategory.RETINOID]: 'PM only. High absorption risk. Great for anti-aging.',
  [IngredientCategory.ACID_EXFOLIANT]: 'Direct Acids. Limit 2x/week. Conflict with Retinol.',
  [IngredientCategory.CLAY_MASK]: 'Deep cleaning. Best for high humidity (>70%).',
  [IngredientCategory.SOOTHING_BARRIER]: 'Calming actives like Cica or Ceramides.',
  [IngredientCategory.CLEANSER]: 'First step to clear impurities.',
  [IngredientCategory.MOISTURIZER]: 'Locks in hydration and actives.',
  [IngredientCategory.SERUM_WATER]: 'Hydrating or active-rich lightweight formulas.',
  [IngredientCategory.UNKNOWN]: 'General skincare product.'
};

export const INGREDIENT_HINTS: Record<IngredientCategory, string[]> = {
  [IngredientCategory.RETINOID]: ['Retinol', 'Retinal', 'Tretinoin', 'Adapalene', 'Granactive Retinoid'],
  [IngredientCategory.ACID_EXFOLIANT]: ['Glycolic Acid (AHA)', 'Salicylic Acid (BHA)', 'Lactic Acid', 'Mandelic Acid', 'PHA'],
  [IngredientCategory.CLAY_MASK]: ['Kaolin', 'Bentonite', 'Charcoal', 'Amazonian White Clay'],
  [IngredientCategory.SOOTHING_BARRIER]: ['Centella Asiatica (Cica)', 'Ceramides', 'Panthenol (B5)', 'Madecassoside', 'Niacinamide'],
  [IngredientCategory.CLEANSER]: ['Gel Cleanser', 'Oil Cleanser', 'Micellar Water', 'Foaming Wash'],
  [IngredientCategory.MOISTURIZER]: ['Hyaluronic Acid', 'Squalane', 'Glycerin', 'Shea Butter'],
  [IngredientCategory.SERUM_WATER]: ['Vitamin C', 'Peptides', 'Snail Mucin', 'Amino Acids'],
  [IngredientCategory.UNKNOWN]: ['Fragrance', 'Extracts', 'Vitamins']
};
