// Public entry point of the menu engine. The web app imports from here,
// and the WhatsApp bot (next phase) will import the same functions.
export * from './types';
export { DISHES, getDish, hasDish, isStaple, REGION_GROUP, WORLD_CUISINES, isWorldCuisine, isWorldDish, cuisineOf } from './dishes';
export { generateWeek, regenerateDay, swapItem, setMainDish, rateDish, partyMenu, swapPartyCourse, kidsTiffinWeek, swapTiffinDay, TIFFIN_FRUITS, fruitHindi, type PartyMenu, type PartyCourse, type PartyStyle, type PartyMeal, mainChoices, mealDishes, isPlanUsable, MEAL_TYPES, mealsFor, type DishChoice } from './menu';
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
export { groceryList, groceryForDishes, servingsFor, formatAmount, GROCERY_GROUPS, type GroceryItem, type GroceryGroup } from './grocery';
export { MEAL_NAME, dayNote, dayMessage, partyMessage, partyCookMessage, tiffinMessage, tiffinCookMessage, partyShopping, PARTY_PORTION, cookMessage, weekMessage, weekTable, groceryMessage, whatsappLink, formatDate, type WeekTable, type WeekCell } from './share';
export { randomSeed, toISODate, parseISODate, WEEKDAYS, WEEKDAYS_SHORT, WEEKDAYS_HI } from './util';
export { FESTIVALS, RULE_LABEL, getFestival, upcomingFestivals, festivalOn, planFestival, type Festival } from './festivals';
export { FRIDGE_ITEMS, cookFromFridge, placesFor, type FridgeItem, type FridgeMatch } from './fridge';
export { cookTemplateParams, cookSpeech } from './cook';
export { DRINKS, DRINK_TAGS, DRINK_GROUPS, MOCKTAIL_STYLES, MOCKTAIL_NOTE, isMocktail, DRINK_NOTE, getDrink, drinkFits, drinkOfTheDay, drinkCookMessage, type Drink, type DrinkTag, type DrinkGroup, type MocktailStyle } from './drinks';
