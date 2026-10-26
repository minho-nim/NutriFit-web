// Validate the complete backup before changing any saved data.
export function validBackup(data: any): boolean {
  const object = (value: any) => value && typeof value === 'object' && !Array.isArray(value);
  const strings = (value: any) => Array.isArray(value) && value.every((item: any) => typeof item === 'string');
  const numbers = (value: any, keys: string[]) => object(value) && keys.every((key) => Number.isFinite(value[key]) && value[key] >= 0);
  const text = (value: any, keys: string[]) => object(value) && keys.every((key) => typeof value[key] === 'string');
  const list = (value: any, check: (item: any) => boolean) => Array.isArray(value) && value.every(check);
  const meal = (value: any) => ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'].includes(value);
  const date = (value: any) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value));
  if (!object(data) || !text(data.profile, ['id', 'displayName']) ||
      !numbers(data.profile, ['age', 'heightCm', 'currentWeightKg', 'targetWeightKg', 'targetDurationWeeks', 'preferredMealsPerDay']) ||
      !['MALE', 'FEMALE'].includes(data.profile.sexForCalculation) ||
      !['LOSS', 'MAINTAIN', 'GAIN', 'BALANCE'].includes(data.profile.goalType) ||
      !['SEDENTARY', 'LIGHT', 'MODERATE', 'VERY_ACTIVE', 'EXTRA_ACTIVE'].includes(data.profile.activityLevel) ||
      !numbers(data.goal, ['bmr', 'tdee', 'dailyCalorieTarget', 'carbohydrateTargetG', 'proteinTargetG', 'fatTargetG'])) return false;
  if (!list(data.foodLogs, (log) => text(log, ['id', 'foodId', 'foodNameSnapshot', 'consumedAt', 'createdAt']) &&
      date(log.consumedDate) && meal(log.mealType) && strings(log.detectedAllergens) &&
      numbers(log, ['weightG', 'calories', 'carbohydrates', 'protein', 'fat']) &&
      (log.ingredientsSnapshot === undefined || strings(log.ingredientsSnapshot)) &&
      (log.allergensSnapshot === undefined || strings(log.allergensSnapshot)))) return false;
  if (!list(data.customFoods, (food) => text(food, ['id', 'name', 'foodType']) &&
      numbers(food, ['servingSize', 'nutritionBasisGrams', 'calories', 'carbohydrates', 'protein', 'fat']) &&
      strings(food.ingredients) && strings(food.allergens))) return false;
  if (!list(data.allergies, (allergy) => text(allergy, ['allergenCode', 'allergenName']) && typeof allergy.isActive === 'boolean') ||
      !list(data.weightLogs, (log) => text(log, ['id']) && date(log.measuredAt) && numbers(log, ['weightKg'])) ||
      !list(data.feedbacks, (feedback) => text(feedback, ['id', 'menuName', 'createdAt']) &&
        ['INTERESTED', 'DISLIKED', 'EATEN', 'SKIPPED'].includes(feedback.reaction))) return false;
  if (data.petProfile !== undefined && (!text(data.petProfile, ['petName']) ||
      !numbers(data.petProfile, ['experience', 'affection', 'explorationProgress', 'tasteUnderstanding', 'totalMealsShared']) ||
      ![1, 2, 3, 4].includes(data.petProfile.growthStage) ||
      (data.petProfile.personality !== undefined && !['WARM_FRIEND', 'CURIOUS_EXPLORER', 'GOURMET_CHEF', 'CHEERFUL_VITAMIN'].includes(data.petProfile.personality)) ||
      (data.petProfile.rewardedFeedbackKeys !== undefined && !strings(data.petProfile.rewardedFeedbackKeys)) ||
      !strings(data.petProfile.rewardedMealLogIds) || !strings(data.petProfile.rewardedFeedbackIds))) return false;
  return data.foodCollections === undefined || list(data.foodCollections, (item) => text(item, ['id', 'normalizedName', 'foodName']));
}
