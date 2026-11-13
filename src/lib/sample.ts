import type { CuisineGroup, FamilyProfile } from '../engine';

/** Shown on first visit so the app opens with a real menu, clearly marked as a sample. */
export const SAMPLE_PROFILE: FamilyProfile = {
  familyName: 'Sharma',
  diet: 'Non-Veg',
  nonVegDays: [2, 5, 6], // Wed, Sat, Sun
  jain: false,
  noOnionGarlic: false,
  fastDays: [1], // Tuesday vrat
  cuisines: ['North', 'West'],
  hasKids: true,
  packsTiffin: true,
  weekdayMaxCookTime: 45,
  dislikes: [],
  cookName: 'Sunita',
};

/** Starting point of the "set up your family" form. */
export const BLANK_PROFILE: FamilyProfile = {
  familyName: '',
  diet: 'Veg',
  nonVegDays: [2, 4, 5, 6],
  jain: false,
  noOnionGarlic: false,
  fastDays: [],
  cuisines: [],
  hasKids: false,
  packsTiffin: false,
  weekdayMaxCookTime: 45,
  dislikes: [],
  cookName: '',
};

export const CUISINES: { key: CuisineGroup; label: string; hint: string }[] = [
  { key: 'North', label: 'North Indian', hint: 'Punjabi, UP, Rajasthani, Kashmiri' },
  { key: 'West', label: 'West Indian', hint: 'Gujarati, Maharashtrian, Goan' },
  { key: 'South', label: 'South Indian', hint: 'Tamil, Kannada, Kerala, Andhra' },
  { key: 'East', label: 'East Indian', hint: 'Bengali, Odia, Bihari, North-East' },
];

export const DIET_LABEL: Record<FamilyProfile['diet'], string> = {
  Veg: 'Vegetarian',
  Egg: 'Veg + eggs',
  'Non-Veg': 'Non-veg',
};
