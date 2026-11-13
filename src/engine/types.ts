// Shared types for the Rasoi Planner menu engine.
// The engine is plain TypeScript with no React or browser code, so the web app
// and the future WhatsApp bot can both use it.

/** 'Snack' is the evening (chai-time) snack, planned when the family wants one. */
export type MealType = 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner';
export type Diet = 'Veg' | 'Egg' | 'Non-Veg';
export type Season = 'All' | 'Winter' | 'Summer' | 'Monsoon';
export type Heaviness = 'Light' | 'Medium' | 'Heavy';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type IndianCuisine = 'North' | 'West' | 'South' | 'East';
export type WorldCuisine = 'Chinese' | 'Italian' | 'Continental' | 'Mexican' | 'Thai' | 'Middle Eastern';
export type CuisineGroup = IndianCuisine | WorldCuisine;

/** One row of the dish database (src/data/dishes.json). */
export interface Dish {
  id: string;
  name: string;
  hindi: string;
  /** When it is usually eaten: Breakfast, Lunch, Dinner, Snack, Dessert, Side */
  slots: string[];
  /** Role on the plate: Dal / Legume, Sabzi (Dry), Bread, Rice, … */
  category: string;
  diet: Diet;
  region: string;
  /** Active cooking minutes (soaking etc. is in prepAhead) */
  cookTime: number;
  difficulty: Difficulty;
  ingredients: string[];
  jain: boolean;
  noOnionGarlic: boolean;
  vrat: boolean;
  tiffin: boolean;
  kidFavourite: boolean;
  season: Season;
  heaviness: Heaviness;
  prepAhead: string | null;
  pairsWith: string[];
}

/** Everything the planner needs to know about one household. */
export interface FamilyProfile {
  familyName: string;
  /** 'Egg' means vegetarian plus eggs */
  diet: Diet;
  /** Days eggs / non-veg may be cooked. 0 = Monday … 6 = Sunday */
  nonVegDays: number[];
  jain: boolean;
  noOnionGarlic: boolean;
  /** Weekly fasting (vrat) days. 0 = Monday … 6 = Sunday */
  fastDays: number[];
  /** Preferred cuisines, Indian and world. Empty = no preference */
  cuisines: CuisineGroup[];
  /** World-food dinners each week (Chinese, Italian…). 0 = Indian food only */
  worldMealsPerWeek: number;
  hasKids: boolean;
  /** Plan an evening (chai-time) snack every day */
  eveningSnack: boolean;
  /** Prefer protein-rich dishes (dals, paneer, eggs, sprouts…) */
  proteinFocus: boolean;
  /** Weekday lunch is packed in a tiffin */
  packsTiffin: boolean;
  /** Longest a single dish may take on Monday–Friday, in minutes */
  weekdayMaxCookTime: number;
  /** Dish ids never to suggest */
  dislikes: string[];
  /** Optional: used to greet the cook in the Hindi message */
  cookName: string;
}

/** The job a dish does inside a meal. Swaps keep the same role. */
export type RoleKey =
  | 'breakfast'
  | 'dal'
  | 'sabzi'
  | 'paneer'
  | 'nonveg'
  | 'riceDish'
  | 'combo'
  | 'lightDinner'
  | 'snack'
  | 'side'
  | 'base'
  | 'vratBreakfast'
  | 'vratMain'
  | 'vratSide'
  | 'vratExtra'
  | 'vratSnack'
  | 'worldMain'
  | 'worldSide'
  | 'any';

export interface MealItem {
  dishId: string;
  role: RoleKey;
}

export interface Meal {
  type: MealType;
  /** Human label of the meal pattern, e.g. "Dal, sabzi & roti" */
  label: string;
  /** This meal is packed in a tiffin */
  tiffin: boolean;
  items: MealItem[];
}

export interface DayPlan {
  /** Local date, YYYY-MM-DD */
  date: string;
  /** 0 = Monday … 6 = Sunday */
  weekday: number;
  isFast: boolean;
  nonVegAllowed: boolean;
  /** Dinner this day is a world-food night */
  worldDinner?: boolean;
  meals: Meal[];
}

export interface WeekPlan {
  startDate: string;
  createdAt: string;
  days: DayPlan[];
}
