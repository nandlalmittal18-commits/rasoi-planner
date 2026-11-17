// Public entry point of the menu engine. The web app imports from here,
// and the WhatsApp bot (next phase) will import the same functions.
export * from './types';
export { DISHES, getDish, hasDish, isStaple, REGION_GROUP, WORLD_CUISINES, isWorldCuisine, isWorldDish, cuisineOf } from './dishes';
export { generateWeek, regenerateDay, swapItem, setMainDish, rateDish, mainChoices, mealDishes, isPlanUsable, MEAL_TYPES, mealsFor, type DishChoice } from './menu';
export {
  getNutrition,
  proteinLevel,
  richness,
  mealNutrition,
  dayNutrition,
  HIGH_PROTEIN,
  GOOD_PROTEIN,
  NUTRITION_NOTE,
  PROTEIN_GUIDE,
  weekProtein,
  type DayProtein,
  type Nutrition,
  type NutritionTotals,
} from './nutrition';
export { getRecipe, recipeMessage, type Recipe } from './recipes';
export { prepForDay, prepTiming, type PrepReminder } from './prep';
export { groceryList, GROCERY_GROUPS, type GroceryItem, type GroceryGroup } from './grocery';
export { MEAL_NAME, dayNote, dayMessage, cookMessage, weekMessage, weekTable, groceryMessage, whatsappLink, formatDate, type WeekTable, type WeekCell } from './share';
export { randomSeed, toISODate, parseISODate, WEEKDAYS, WEEKDAYS_SHORT, WEEKDAYS_HI } from './util';
export { FESTIVALS, RULE_LABEL, getFestival, upcomingFestivals, festivalOn, planFestival, type Festival } from './festivals';
