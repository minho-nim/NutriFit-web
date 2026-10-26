/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ActivityLevel,
  AllergenVerificationStatus,
  DailyNutritionSummary,
  FoodItem,
  FoodLog,
  GoalType,
  MealType,
  UserAllergyConfig,
  UserGoal,
  UserProfile,
} from '../types/nutrition';

/**
 * Mifflin–St Jeor BMR Formula
 * Male: BMR = 10*W + 6.25*H - 5*A + 5
 * Female: BMR = 10*W + 6.25*H - 5*A - 161
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: 'MALE' | 'FEMALE'
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = sex === 'MALE' ? base + 5 : base - 161;
  return Math.round(bmr);
}

/**
 * Activity Factors (AF)
 */
export const ACTIVITY_FACTORS: Record<ActivityLevel, { factor: number; label: string; description: string }> = {
  SEDENTARY: { factor: 1.2, label: '주로 앉아서 생활', description: '운동 거의 없음, 사무직' },
  LIGHT: { factor: 1.375, label: '가벼운 활동', description: '주 1~3회 가벼운 운동/산책' },
  MODERATE: { factor: 1.55, label: '보통 활동량', description: '주 3~5회 보통 강도 운동' },
  VERY_ACTIVE: { factor: 1.725, label: '활동적', description: '주 6~7회 강도 높은 운동' },
  EXTRA_ACTIVE: { factor: 1.9, label: '매우 활동적', description: '육체 노동 또는 운동선수 수준' },
};

/**
 * Calculate TDEE = BMR * AF
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const factor = ACTIVITY_FACTORS[activityLevel]?.factor || 1.2;
  return Math.round(bmr * factor);
}

/**
 * Calculate recommended Daily Calorie & Macronutrient Targets
 */
export function calculateNutritionGoals(profile: UserProfile): UserGoal {
  const bmr = calculateBMR(
    profile.currentWeightKg,
    profile.heightCm,
    profile.age,
    profile.sexForCalculation
  );
  const tdee = calculateTDEE(bmr, profile.activityLevel);

  let targetCalories = tdee;
  let adjustmentReason = '현재 체중 유지를 위한 균형 잡힌 에너지 섭취량';

  const minCalorieSafetyFloor = profile.sexForCalculation === 'MALE' ? 1500 : 1200;

  switch (profile.goalType) {
    case 'LOSS':
      // Moderate healthy deficit: -450 kcal/day (approx 0.4kg loss per week)
      targetCalories = Math.max(minCalorieSafetyFloor, tdee - 450);
      adjustmentReason = `건강하고 지속 가능한 감량을 위해 TDEE(${tdee} kcal)에서 450 kcal 적자 적용 (안전 하한선 ${minCalorieSafetyFloor} kcal 준수)`;
      break;
    case 'GAIN':
      // Mild surplus: +300 kcal/day for lean muscle hypertrophy
      targetCalories = tdee + 300;
      adjustmentReason = `체중 및 근육량 증가를 위해 TDEE(${tdee} kcal)에서 300 kcal 흑자 적용`;
      break;
    case 'BALANCE':
      targetCalories = tdee;
      adjustmentReason = `영양 균형 및 건강 유지를 위해 총 에너지 소비량(${tdee} kcal)에 맞춤 설정`;
      break;
    case 'MAINTAIN':
    default:
      targetCalories = tdee;
      adjustmentReason = `체중 유지를 위해 TDEE(${tdee} kcal)와 동일한 섭취 칼로리 권장`;
      break;
  }

  // Protein targets based on body weight and goal
  let proteinPerKg = 1.2;
  if (profile.goalType === 'LOSS') {
    proteinPerKg = 1.6; // Higher protein to preserve lean body mass during deficit
  } else if (profile.goalType === 'GAIN') {
    proteinPerKg = 1.8; // High protein for muscle synthesis
  } else if (profile.goalType === 'BALANCE') {
    proteinPerKg = 1.2;
  }
  const proteinGrams = Math.round(profile.currentWeightKg * proteinPerKg);
  const proteinCalories = proteinGrams * 4;

  // Fat target: ~25% of total daily energy
  const fatCalories = targetCalories * 0.25;
  const fatGrams = Math.round(fatCalories / 9);

  // Carb target: Remaining calories
  const remainingCaloriesForCarbs = Math.max(0, targetCalories - proteinCalories - (fatGrams * 9));
  const carbohydrateGrams = Math.round(remainingCaloriesForCarbs / 4);

  return {
    id: `goal-${Date.now()}`,
    userId: profile.id,
    goalType: profile.goalType,
    bmr,
    tdee,
    dailyCalorieTarget: targetCalories,
    carbohydrateTargetG: carbohydrateGrams,
    proteinTargetG: proteinGrams,
    fatTargetG: fatGrams,
    fiberTargetG: 25,
    effectiveFrom: new Date().toISOString().split('T')[0],
    calculationMethod: 'Mifflin-St Jeor BMR & ACSM Activity Multiplier',
    calorieAdjustmentReason: adjustmentReason,
  };
}

/**
 * Scale nutrients based on exact consumed weight:
 * N_consumed = N_basis * (Weight / BasisWeight)
 */
export function scaleNutrients(
  food: Pick<FoodItem, 'calories' | 'carbohydrates' | 'protein' | 'fat' | 'fiber' | 'nutritionBasisGrams'>,
  weightG: number
) {
  const basis = food.nutritionBasisGrams || 100;
  const ratio = weightG / basis;

  return {
    calories: Math.round(food.calories * ratio),
    carbohydrates: Number((food.carbohydrates * ratio).toFixed(1)),
    protein: Number((food.protein * ratio).toFixed(1)),
    fat: Number((food.fat * ratio).toFixed(1)),
    fiber: food.fiber ? Number((food.fiber * ratio).toFixed(1)) : undefined,
  };
}

/**
 * Allergen Verification Checker
 * Enforces Part 8 rules:
 * - CONTAINS: active allergen is present in ingredients
 * - CROSS_CONTACT_RISK: active allergen is in cross contact warnings
 * - UNKNOWN: food data lacks ingredients/allergens
 * - VERIFIED_NO_MATCH: checked verified ingredients with zero match
 * - NOT_CHECKED: user has no active allergens configured
 */
export function verifyAllergens(
  food: FoodItem,
  userAllergies: UserAllergyConfig[]
): {
  status: AllergenVerificationStatus;
  matchedAllergens: string[];
  crossContactAllergens: string[];
  warningMessage: string;
} {
  const activeAllergies = userAllergies.filter((a) => a.isActive);

  if (activeAllergies.length === 0) {
    return {
      status: 'NOT_CHECKED',
      matchedAllergens: [],
      crossContactAllergens: [],
      warningMessage: '설정된 활성 알레르기가 없습니다.',
    };
  }

  // If food has no ingredient list or allergens array at all
  if (!food.ingredients || food.ingredients.length === 0) {
    return {
      status: 'UNKNOWN',
      matchedAllergens: [],
      crossContactAllergens: [],
      warningMessage: '원재료 정보가 제공되지 않아 알레르기 검증이 불가능합니다. 섭취 전 확인이 필요합니다.',
    };
  }

  const activeCodes = activeAllergies.map((a) => a.allergenCode.toUpperCase());
  const activeNames = activeAllergies.map((a) => a.allergenName);

  // 1. Direct contains check
  const matchedCodes = (food.allergens || []).filter((code) =>
    activeCodes.includes(code.toUpperCase())
  );

  // Also check ingredient text for keywords
  const textMatchedNames: string[] = [];
  activeAllergies.forEach((allergy) => {
    const keyword = allergy.allergenName;
    const foundInIngredients = food.ingredients.some((ing) => ing.includes(keyword));
    if (foundInIngredients && !matchedCodes.includes(allergy.allergenCode)) {
      matchedCodes.push(allergy.allergenCode);
    }
  });

  const matchedNames = activeAllergies
    .filter((a) => matchedCodes.includes(a.allergenCode))
    .map((a) => a.allergenName);

  if (matchedNames.length > 0) {
    return {
      status: 'CONTAINS',
      matchedAllergens: matchedNames,
      crossContactAllergens: [],
      warningMessage: `[경고] 사용자의 알레르기 유발 성분(${matchedNames.join(', ')})이 원재료에 직접 포함되어 있습니다!`,
    };
  }

  // 2. Cross contact check
  const crossMatchedCodes = (food.crossContactRisk || []).filter((code) =>
    activeCodes.includes(code.toUpperCase())
  );
  const crossMatchedNames = activeAllergies
    .filter((a) => crossMatchedCodes.includes(a.allergenCode))
    .map((a) => a.allergenName);

  if (crossMatchedNames.length > 0) {
    return {
      status: 'CROSS_CONTACT_RISK',
      matchedAllergens: [],
      crossContactAllergens: crossMatchedNames,
      warningMessage: `[주의] 동일 제조시설 또는 조리환경에서 (${crossMatchedNames.join(', ')}) 성분의 교차접촉 위험이 보고되었습니다.`,
    };
  }

  // 3. Verified No Match
  return {
    status: 'VERIFIED_NO_MATCH',
    matchedAllergens: [],
    crossContactAllergens: [],
    warningMessage: '확인된 공식 성분표에서 등록된 알레르기 성분이 검출되지 않았습니다. (단, 개인 체질에 따른 절대적 보증은 아닙니다)',
  };
}

/**
 * Summarize daily food logs against user goals
 */
export function calculateDailySummary(
  date: string,
  logs: FoodLog[],
  goal: UserGoal
): DailyNutritionSummary {
  const dayLogs = logs.filter((log) => log.consumedDate === date);

  let totalCal = 0;
  let totalCarb = 0;
  let totalProt = 0;
  let totalFat = 0;

  const byMeal: DailyNutritionSummary['byMealType'] = {
    BREAKFAST: { calories: 0, carbs: 0, protein: 0, fat: 0, items: [] },
    LUNCH: { calories: 0, carbs: 0, protein: 0, fat: 0, items: [] },
    DINNER: { calories: 0, carbs: 0, protein: 0, fat: 0, items: [] },
    SNACK: { calories: 0, carbs: 0, protein: 0, fat: 0, items: [] },
  };

  dayLogs.forEach((log) => {
    totalCal += log.calories;
    totalCarb += log.carbohydrates;
    totalProt += log.protein;
    totalFat += log.fat;

    if (byMeal[log.mealType]) {
      byMeal[log.mealType].calories += log.calories;
      byMeal[log.mealType].carbs += log.carbohydrates;
      byMeal[log.mealType].protein += log.protein;
      byMeal[log.mealType].fat += log.fat;
      byMeal[log.mealType].items.push(log);
    }
  });

  return {
    date,
    consumedCalories: Math.round(totalCal),
    consumedCarbohydrates: Number(totalCarb.toFixed(1)),
    consumedProtein: Number(totalProt.toFixed(1)),
    consumedFat: Number(totalFat.toFixed(1)),
    targetCalories: goal.dailyCalorieTarget,
    targetCarbohydrates: goal.carbohydrateTargetG,
    targetProtein: goal.proteinTargetG,
    targetFat: goal.fatTargetG,
    remainingCalories: Math.round(goal.dailyCalorieTarget - totalCal),
    remainingCarbohydrates: Number((goal.carbohydrateTargetG - totalCarb).toFixed(1)),
    remainingProtein: Number((goal.proteinTargetG - totalProt).toFixed(1)),
    remainingFat: Number((goal.fatTargetG - totalFat).toFixed(1)),
    mealLogsCount: dayLogs.length,
    byMealType: byMeal,
  };
}

/**
 * Korean formatting labels
 */
export const MEAL_TYPE_LABELS: Record<MealType, { name: string; emoji: string; timeHint: string; targetRatio: number }> = {
  BREAKFAST: { name: '아침', emoji: '🌅', timeHint: '07:00 ~ 09:00', targetRatio: 0.25 },
  LUNCH: { name: '점심', emoji: '☀️', timeHint: '12:00 ~ 13:30', targetRatio: 0.35 },
  DINNER: { name: '저녁', emoji: '🌙', timeHint: '18:00 ~ 20:00', targetRatio: 0.30 },
  SNACK: { name: '간식', emoji: '🍎', timeHint: '오후/운동 전후', targetRatio: 0.10 },
};

export const GOAL_TYPE_LABELS: Record<GoalType, { name: string; badge: string; color: string; desc: string }> = {
  LOSS: { name: '체중 감량', badge: '체지방 감량', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', desc: '칼로리 적자(-450kcal)와 고단백으로 근육 보존' },
  MAINTAIN: { name: '체중 유지', badge: '현재 체중 유지', color: 'bg-blue-100 text-blue-800 border-blue-300', desc: '소비 칼로리에 맞춘 안정적 영양 공급' },
  GAIN: { name: '근육량 증가', badge: '린매스업', color: 'bg-indigo-100 text-indigo-800 border-indigo-300', desc: '칼로리 흑자(+300kcal)와 단백질 1.8g/kg' },
  BALANCE: { name: '영양 균형', badge: '건강 식습관', color: 'bg-teal-100 text-teal-800 border-teal-300', desc: '탄단지 황금비율 및 필수 미량영양소 충족' },
};
