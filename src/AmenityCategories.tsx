export const AMENITY_CATEGORIES = {
  TOILET: 'Toilet',
  WATER: 'Drinking water',
  ATM: 'ATM',
  DEFIBRILLATOR: 'Defibrillator',
  BENCH:"Bench",
  BIN:"Trash can",
  RECYCLING:"Recycling",
  SHELTER:"Shelter",
  POSTBOX:"Post box"
} as const;

export type AmenityCategory = keyof typeof AMENITY_CATEGORIES;

export const amenityOptions:AmenityCategory[] = Object.keys(AMENITY_CATEGORIES) as AmenityCategory[];

export const FILTERS: Record<keyof typeof AMENITY_CATEGORIES, string[]> = {
  TOILET: ['[amenity=toilets]'],
  WATER: ['[amenity=drinking_water]'],
  ATM: ['[amenity=atm]'],
  DEFIBRILLATOR: ['[emergency=defibrillator]'],
  BENCH:["[amenity=bench]"],
  BIN:["[amenity=waste_basket]"],
  RECYCLING:["[amenity=recycling]"],
  SHELTER:["[amenity=shelter]","[shelter=yes]"],
  POSTBOX:["[amenity=post_box]"]
};