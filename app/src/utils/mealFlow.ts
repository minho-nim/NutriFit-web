import type { FoodLog, MealRecommendation, MealType } from '../types/nutrition';

export function mealTypeForText(text: string, now = new Date()): MealType {
  if (/아침/.test(text)) return 'BREAKFAST';
  if (/점심/.test(text)) return 'LUNCH';
  if (/저녁/.test(text)) return 'DINNER';
  if (/간식|야식/.test(text)) return 'SNACK';
  const hour = now.getHours();
  return hour < 11 ? 'BREAKFAST' : hour < 14 ? 'LUNCH' : hour < 17 ? 'SNACK' : hour < 22 ? 'DINNER' : 'SNACK';
}

export function recommendationLog(rec: MealRecommendation, userId: string, date: string, petName: string): Omit<FoodLog, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    userId, foodId: rec.id, foodNameSnapshot: rec.menuName, mealType: rec.mealType,
    ingredientsSnapshot: rec.ingredients, allergensSnapshot: rec.allergens, cookingMethodSnapshot: rec.cookingMethod,
    flavorProfileSnapshot: rec.flavorProfile,
    consumedAt: new Date().toISOString(), consumedDate: date, weightG: rec.estimatedWeightG,
    calories: rec.estimatedCalories, carbohydrates: rec.carbohydrates, protein: rec.protein, fat: rec.fat,
    inputMethod: 'SEARCH', allergenStatus: rec.allergenStatus, detectedAllergens: [],
    notes: `밥친구 ${petName}의 추천 식단: ${rec.recommendationReason}`,
  };
}
