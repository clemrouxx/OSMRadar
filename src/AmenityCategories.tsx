export const AMENITY_CATEGORIES = {
  TOILET: 'Toilet',
  WATER: 'Drinking water',
  ATM: 'ATM',
} as const;

export type AmenityCategory = typeof AMENITY_CATEGORIES[keyof typeof AMENITY_CATEGORIES];

export const amenityOptions = Object.values(AMENITY_CATEGORIES);