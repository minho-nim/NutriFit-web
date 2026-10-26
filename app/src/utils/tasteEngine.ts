/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VERIFIED_FOODS } from '../data/mockFoods';
import {
  CookingMethod,
  DailyNutritionSummary,
  FlavorProfile,
  FoodItem,
  FoodLog,
  MealRecommendation,
  MealType,
  QuickMealCombo,
  RecommendationFeedback,
  UserAllergyConfig,
  UserGoal,
  UserProfile,
  UserTasteProfile,
} from '../types/nutrition';
import { scaleNutrients, verifyAllergens } from './nutritionEngine';

export const COOKING_METHOD_LABELS: Record<CookingMethod, string> = {
  GRILL: '구이',
  STEAM: '찜/데침',
  STIR_FRY: '볶음',
  RAW: '생식/샐러드',
  SOUP: '탕/찌개',
  BOIL: '삶기',
  BAKE: '오븐/베이킹',
  ROAST: '로스팅/구이',
};

export const FLAVOR_PROFILE_LABELS: Record<FlavorProfile, string> = {
  CLEAN: '담백한 맛',
  SAVORY: '감칠맛·고소한 맛',
  SPICY: '칼칼·매콤한 맛',
  SWEET: '달콤한 맛',
  NUTTY: '고소·너티한 맛',
  REFRESHING: '상큼·신선한 맛',
};

/**
 * 1. Analyze user's food logs and feedback to synthesize a UserTasteProfile
 */
export function analyzeUserTaste(
  logs: FoodLog[],
  feedbacks: RecommendationFeedback[],
  customFoods: FoodItem[] = []
): UserTasteProfile {
  const allFoods = [...VERIFIED_FOODS, ...customFoods];
  const foodMap = new Map<string, FoodItem>();
  allFoods.forEach((f) => {
    foodMap.set(f.id, f);
    foodMap.set(f.name.toLowerCase(), f);
  });

  const ingredientScores: Record<string, number> = {};
  const methodScores: Record<CookingMethod, number> = {
    GRILL: 0,
    STEAM: 0,
    STIR_FRY: 0,
    RAW: 0,
    SOUP: 0,
    BOIL: 0,
    BAKE: 0,
    ROAST: 0,
  };
  const flavorScores: Record<FlavorProfile, number> = {
    CLEAN: 0,
    SAVORY: 0,
    SPICY: 0,
    SWEET: 0,
    NUTTY: 0,
    REFRESHING: 0,
  };

  // 1. Process actual food intake logs (Strongest signal: 3 points per intake)
  logs.forEach((log) => {
    const signal = log.satisfactionRating && log.satisfactionRating >= 4 ? 5 : log.satisfactionRating && log.satisfactionRating <= 2 ? 1 : 3;
    const matched = log.ingredientsSnapshot ? {
      cookingMethod: log.cookingMethodSnapshot, flavorProfile: log.flavorProfileSnapshot, ingredients: log.ingredientsSnapshot,
    } :
      foodMap.get(log.foodId) ||
      allFoods.find((f) => log.foodNameSnapshot.includes(f.name.split(' ')[0]));

    if (matched) {
      if (matched.cookingMethod && methodScores[matched.cookingMethod] !== undefined) {
        methodScores[matched.cookingMethod] += signal;
      }
      if (matched.flavorProfile && flavorScores[matched.flavorProfile] !== undefined) {
        flavorScores[matched.flavorProfile] += signal;
      }
      matched.ingredients.forEach((ing) => {
        const cleanIng = ing.split('(')[0].trim();
        ingredientScores[cleanIng] = (ingredientScores[cleanIng] || 0) + signal;
      });
    } else {
      // Heuristic from food name
      ingredientScores[log.foodNameSnapshot] = (ingredientScores[log.foodNameSnapshot] || 0) + signal;
    }
  });

  // 2. Process recommendation feedback
  const dislikedIngredientsSet = new Set<string>();
  const bookmarkedNames: string[] = [];

  feedbacks.forEach((fb) => {
    if (fb.reaction === 'INTERESTED') {
      bookmarkedNames.push(fb.menuName);
      // Boost related food terms
      ingredientScores[fb.menuName] = (ingredientScores[fb.menuName] || 0) + 2;
    } else if (fb.reaction === 'EATEN') {
      ingredientScores[fb.menuName] = (ingredientScores[fb.menuName] || 0) + 4;
    } else if (fb.reaction === 'DISLIKED') {
      ingredientScores[fb.menuName] = (ingredientScores[fb.menuName] || 0) - 5;
      if (fb.dislikeReason === 'DISLIKE_INGREDIENT') {
        dislikedIngredientsSet.add(fb.menuName);
      }
    }
  });

  // Calculate top ingredients
  const favoriteIngredients = Object.entries(ingredientScores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, score]) => ({ name, score }));

  // Calculate top cooking methods
  const totalMethodScore = Object.values(methodScores).reduce((a, b) => a + b, 0) || 1;
  const favoriteCookingMethods = (Object.keys(methodScores) as CookingMethod[])
    .map((method) => ({
      method,
      label: COOKING_METHOD_LABELS[method],
      score: methodScores[method],
      percentage: Math.round((methodScores[method] / totalMethodScore) * 100),
    }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);

  // Calculate top flavors
  const favoriteFlavors = (Object.keys(flavorScores) as FlavorProfile[])
    .map((flavor) => ({
      flavor,
      label: FLAVOR_PROFILE_LABELS[flavor],
      score: flavorScores[flavor],
    }))
    .filter((f) => f.score > 0)
    .sort((a, b) => b.score - a.score);

  // Confidence determination
  const totalLogs = logs.length;
  let tasteConfidence: UserTasteProfile['tasteConfidence'] = 'LEARNING';
  if (totalLogs >= 10) {
    tasteConfidence = 'MATURE';
  } else if (totalLogs >= 4) {
    tasteConfidence = 'ESTABLISHED';
  }

  // Generate grounded insights
  const insightHighlights: string[] = [];
  if (totalLogs < 3) {
    insightHighlights.push('식사 기록이 아직 3회 미만입니다. 식사를 기록할수록 개인의 맛과 조리 취향을 정밀하게 학습합니다.');
  } else {
    if (favoriteCookingMethods.length > 0) {
      insightHighlights.push(`주로 [${favoriteCookingMethods[0].label}] 조리 방식을 가장 자주 선택하셨습니다 (전체의 ${favoriteCookingMethods[0].percentage}%).`);
    }
    if (favoriteIngredients.length > 0) {
      insightHighlights.push(`식단에서 [${favoriteIngredients[0].name}]을(를) 선호하는 식습관이 뚜렷하게 관찰됩니다.`);
    }
    if (favoriteFlavors.length > 0) {
      insightHighlights.push(`[${favoriteFlavors[0].label}] 위주의 메뉴를 선택할 때 만족도와 지속성이 높았습니다.`);
    }
  }

  return {
    favoriteIngredients,
    favoriteCookingMethods,
    favoriteFlavors,
    dislikedIngredients: Array.from(dislikedIngredientsSet),
    bookmarkedMenuNames: Array.from(new Set(bookmarkedNames)),
    totalLogsAnalyzed: totalLogs,
    tasteConfidence,
    insightHighlights,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * 2. Taste-Aware Curated Meal Recommender
 * Evaluates candidate dishes against:
 * - TasteMatch (0~40)
 * - NutritionalFit (0~35)
 * - DiversityScore (0~15)
 * - ExplorationBonus (0~10)
 * - Strict Allergen Filtering
 */
export function generateCuratedRecommendations(params: {
  profile: UserProfile;
  goal: UserGoal;
  summary: DailyNutritionSummary;
  tasteProfile: UserTasteProfile;
  recentLogs: FoodLog[];
  userAllergies: UserAllergyConfig[];
  mealType: MealType;
  feedbacks: RecommendationFeedback[];
  exploreNovelty?: boolean;
  categoryFilter?: string;
}): MealRecommendation[] {
  const {
    goal,
    summary,
    tasteProfile,
    recentLogs,
    userAllergies,
    mealType,
    feedbacks,
    exploreNovelty = false,
    categoryFilter,
  } = params;

  const remainingCal = Math.max(100, summary.remainingCalories);
  const remainingProt = Math.max(10, summary.remainingProtein);

  // Pre-filter candidate dishes from verified database
  const candidatePool: Array<{
    name: string;
    category: string;
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
    weightG: number;
    cookingTimeMin: number;
    costWon: number;
    ingredients: string[];
    cookingMethod: CookingMethod;
    flavorProfile: FlavorProfile;
    allergens: string[];
    crossContactRisk?: string[];
    alternative?: { name: string; reason: string; calories: number; protein: number };
  }> = [
    {
      name: '닭가슴살 퀴노아 웜볼과 구운 채소',
      category: '클린 볼',
      calories: 460,
      carbs: 52,
      protein: 38,
      fat: 9,
      weightG: 340,
      cookingTimeMin: 15,
      costWon: 8500,
      ingredients: ['닭가슴살', '퀴노아', '방울토마토', '아스파라거스', '올리브유'],
      cookingMethod: 'GRILL',
      flavorProfile: 'SAVORY',
      allergens: ['CHICKEN'],
      alternative: { name: '단호박 두부 스테이크', reason: '육류 대신 식물성 고단백 대체', calories: 420, protein: 28 },
    },
    {
      name: '연어 구이와 현미밥 반상',
      category: '한식 정식',
      calories: 520,
      carbs: 58,
      protein: 36,
      fat: 16,
      weightG: 380,
      cookingTimeMin: 20,
      costWon: 11000,
      ingredients: ['노르웨이 연어', '현미밥', '시금치나물', '된장국'],
      cookingMethod: 'GRILL',
      flavorProfile: 'SAVORY',
      allergens: ['FISH', 'SOY'],
      alternative: { name: '고등어 조림과 현미밥', reason: '유사 오메가3 어류 식단', calories: 490, protein: 32 },
    },
    {
      name: '소고기 우둔살 야채 볶음과 보리밥',
      category: '한식 일품',
      calories: 540,
      carbs: 64,
      protein: 35,
      fat: 14,
      weightG: 390,
      cookingTimeMin: 18,
      costWon: 9800,
      ingredients: ['소고기 우둔살', '보리밥', '양배추', '파프리카', '간장소스'],
      cookingMethod: 'STIR_FRY',
      flavorProfile: 'SAVORY',
      allergens: ['BEEF', 'SOY'],
      alternative: { name: '버섯 두부 덮밥', reason: '저지방 담백 대체식', calories: 450, protein: 24 },
    },
    {
      name: '통밀 파스타와 수비드 닭안심 토마토',
      category: '지중해식',
      calories: 480,
      carbs: 62,
      protein: 36,
      fat: 8,
      weightG: 350,
      cookingTimeMin: 15,
      costWon: 8200,
      ingredients: ['통밀 펜네', '닭안심', '홀토마토', '바질', '올리브오일'],
      cookingMethod: 'BOIL',
      flavorProfile: 'CLEAN',
      allergens: ['CHICKEN', 'WHEAT'],
      alternative: { name: '닭가슴살 토마토 리조또', reason: '글루텐 대체 쌀 식단', calories: 470, protein: 34 },
    },
    {
      name: '그릭 요거트와 견과류 과일 보울',
      category: '간편 건강식',
      calories: 340,
      carbs: 36,
      protein: 22,
      fat: 11,
      weightG: 240,
      cookingTimeMin: 5,
      costWon: 6500,
      ingredients: ['무가당 그릭 요거트', '아몬드', '바나나', '블루베리', '치아씨드'],
      cookingMethod: 'RAW',
      flavorProfile: 'REFRESHING',
      allergens: ['MILK'],
      alternative: { name: '오트밀 두유 보울', reason: '유당 불내증 대비 락토프리 대체', calories: 330, protein: 18 },
    },
    {
      name: '두부 버섯 맑은 전골과 현미밥',
      category: '탕/찌개',
      calories: 410,
      carbs: 56,
      protein: 24,
      fat: 9,
      weightG: 420,
      cookingTimeMin: 20,
      costWon: 7500,
      ingredients: ['국산 촌두부', '표고버섯', '느타리버섯', '알배추', '현미밥'],
      cookingMethod: 'SOUP',
      flavorProfile: 'CLEAN',
      allergens: ['SOY'],
      alternative: { name: '순두부 계란 맑은국', reason: '가벼운 소화기 배려 식단', calories: 370, protein: 22 },
    },
  ];

  if (mealType === 'SNACK' || mealType === 'BREAKFAST') {
    VERIFIED_FOODS.filter((food) => /바나나|사과|삶은 달걀|그릭 요거트|고구마/.test(food.name)).forEach((food) => {
      const portion = scaleNutrients(food, food.servingSize);
      candidatePool.push({
        name: food.name, category: mealType === 'SNACK' ? '간식' : '간편 아침',
        calories: portion.calories, carbs: portion.carbohydrates, protein: portion.protein, fat: portion.fat,
        weightG: food.servingSize, cookingTimeMin: 5, costWon: 3000, ingredients: food.ingredients,
        cookingMethod: food.cookingMethod || 'RAW', flavorProfile: food.flavorProfile || 'CLEAN',
        allergens: food.allergens, crossContactRisk: food.crossContactRisk,
      });
    });
  }

  // Names eaten in the last 2 days
  const recentCutoff = new Date(`${summary.date}T00:00:00`);
  recentCutoff.setDate(recentCutoff.getDate() - 2);
  const recentlyEatenNames = recentLogs
    .filter((log) => log.consumedDate <= summary.date && new Date(`${log.consumedDate}T00:00:00`) >= recentCutoff)
    .map((l) => l.foodNameSnapshot.toLowerCase());

  // Disliked names from feedback
  const dislikedNames = feedbacks
    .filter((f) => f.reaction === 'DISLIKED')
    .map((f) => f.menuName.toLowerCase());

  const scoredCandidates = candidatePool
    .filter((cand) => {
      if (mealType === 'SNACK' && cand.calories > 250) return false;
      if (mealType === 'BREAKFAST' && cand.calories > 450) return false;
      if (categoryFilter === '국물' && cand.cookingMethod !== 'SOUP') return false;
      if (categoryFilter === '고단백' && cand.protein < 30) return false;
      if (categoryFilter === '샐러드' && !/볼|보울|샐러드/.test(cand.name)) return false;
      if (categoryFilter === '가벼운식단' && cand.calories > 450) return false;
      // 1. Strict Allergen Safety check (PART 8)
      const fakeFoodItem: FoodItem = {
        id: `cand-${cand.name}`,
        name: cand.name,
        foodType: cand.category,
        servingSize: cand.weightG,
        servingUnit: `${cand.weightG}g`,
        nutritionBasisGrams: 100,
        calories: cand.calories,
        carbohydrates: cand.carbs,
        protein: cand.protein,
        fat: cand.fat,
        ingredients: cand.ingredients,
        allergens: cand.allergens,
        crossContactRisk: cand.crossContactRisk,
        sourceType: 'VERIFIED_EXTERNAL',
        sourceReference: '검증 공공 조리 데이터',
        verifiedAt: '2025-01-01',
      };

      const check = verifyAllergens(fakeFoodItem, userAllergies);
      // Exclude if direct CONTAINS
      if (check.status === 'CONTAINS' || check.status === 'CROSS_CONTACT_RISK') return false;

      // Exclude if explicitly disliked
      if (dislikedNames.some((d) => cand.name.toLowerCase().includes(d))) return false;

      return true;
    })
    .map((cand) => {
      // 1. Taste Match Score (0 ~ 40)
      let tasteScore = 15; // baseline
      if (tasteProfile.favoriteCookingMethods.some((m) => m.method === cand.cookingMethod)) {
        tasteScore += 12;
      }
      if (tasteProfile.favoriteFlavors.some((f) => f.flavor === cand.flavorProfile)) {
        tasteScore += 8;
      }
      tasteProfile.favoriteIngredients.forEach((fav) => {
        if (cand.ingredients.some((ing) => ing.includes(fav.name))) {
          tasteScore += 5;
        }
      });
      tasteScore = Math.min(40, tasteScore);

      // 2. Nutritional Fit Score (0 ~ 35)
      // Checks proximity to remaining calories & remaining protein
      const calDelta = Math.abs(cand.calories - remainingCal);
      const calFit = Math.max(0, 20 - Math.round(calDelta / 40));
      const protFit = cand.protein >= Math.min(remainingProt, 30) ? 15 : 8;
      const nutFitScore = Math.min(35, calFit + protFit);

      // 3. Diversity Score (0 ~ 15)
      const hasEatenRecently = recentlyEatenNames.some((n) => cand.name.toLowerCase().includes(n));
      const diversityScore = hasEatenRecently ? 3 : 15;

      // 4. Exploration Bonus (0 ~ 10)
      const explorationBonus = exploreNovelty && !hasEatenRecently ? 10 : 3;

      const totalScore = tasteScore + nutFitScore + diversityScore + explorationBonus;

      // Build grounded reason
      let learnedReason = '현재 영양 목표와 식사 시간에 적절한 추천입니다.';
      if (tasteProfile.tasteConfidence !== 'LEARNING') {
        if (tasteProfile.favoriteCookingMethods.length > 0 && cand.cookingMethod === tasteProfile.favoriteCookingMethods[0].method) {
          learnedReason = `자주 선택하신 [${COOKING_METHOD_LABELS[cand.cookingMethod]}] 방식과 담백한 입맛을 반영했어요.`;
        } else if (cand.protein >= 30) {
          learnedReason = `오늘 남은 단백질(${remainingProt}g)을 든든하게 채워주는 맞춤 고단백 구성이에요.`;
        } else if (!hasEatenRecently) {
          learnedReason = `최근 며칠간 드시지 않았던 새로운 풍미와 재료를 조합했어요.`;
        }
      }

      return {
        id: `rec-${mealType}-${cand.name}`,
        menuName: cand.name,
        category: cand.category,
        mealType,
        estimatedCalories: cand.calories,
        carbohydrates: cand.carbs,
        protein: cand.protein,
        fat: cand.fat,
        estimatedWeightG: cand.weightG,
        estimatedCookingTimeMin: cand.cookingTimeMin,
        estimatedCostWon: cand.costWon,
        isHomeCooked: true,
        ingredients: cand.ingredients,
        cookingMethod: cand.cookingMethod,
        allergens: cand.allergens,
        flavorProfile: cand.flavorProfile,
        recommendationReason: learnedReason,
        matchedGoalReasons: [`단백질 ${cand.protein}g 공급`, `열량 ${cand.calories} kcal`],
        allergenStatus: (userAllergies.some((allergy) => allergy.isActive) ? 'VERIFIED_NO_MATCH' : 'NOT_CHECKED') as MealRecommendation['allergenStatus'],
        allergenWarnings: [],
        score: totalScore,
      };
    });

  // Sort descending by calculated score
  scoredCandidates.sort((a, b) => b.score - a.score);

  return scoredCandidates.slice(0, 3).map((rec, index) => {
    const alternative = scoredCandidates[(index + 3) % scoredCandidates.length];
    return { ...rec, alternativeMenu: alternative && alternative.id !== rec.id ? {
      ...alternative, reason: alternative.recommendationReason, calories: alternative.estimatedCalories,
    } : undefined };
  });
}

/**
 * 3. Extract frequent meal combinations for quick re-logging
 */
export function extractQuickCombos(logs: FoodLog[]): QuickMealCombo[] {
  if (logs.length < 2) return [];

  // Group by consumedDate + mealType
  const mealGroups: Record<string, FoodLog[]> = {};
  logs.forEach((log) => {
    const key = `${log.consumedDate}_${log.mealType}`;
    if (!mealGroups[key]) mealGroups[key] = [];
    mealGroups[key].push(log);
  });

  const combos: QuickMealCombo[] = [];
  const signatures = new Map<string, { items: FoodLog[]; count: number }>();
  for (const items of Object.values(mealGroups)) {
    const signature = `${items[0].mealType}:` + items.map((item) => `${item.foodId}:${item.weightG}`).sort().join('|');
    const saved = signatures.get(signature);
    if (saved) saved.count++;
    else signatures.set(signature, { items, count: 1 });
  }
  const signatureCombos = [...signatures.values()].sort((a, b) => b.count - a.count);

  signatureCombos.slice(0, 3).forEach(({ items, count }, idx) => {
    const meal = items[0].mealType;
    const title = items.map((i) => i.foodNameSnapshot).join(' + ');
    const totalCal = items.reduce((s, i) => s + i.calories, 0);
    const totalProt = items.reduce((s, i) => s + i.protein, 0);

    combos.push({
      id: `combo-${idx}`,
      title,
      mealType: meal,
      foods: items.map((i) => ({
        foodId: i.foodId,
        foodName: i.foodNameSnapshot,
        weightG: i.weightG,
        calories: i.calories,
        carbohydrates: i.carbohydrates,
        protein: i.protein,
        fat: i.fat,
      })),
      totalCalories: totalCal,
      totalProtein: Number(totalProt.toFixed(1)),
      timesLogged: count,
    });
  });

  return combos;
}
