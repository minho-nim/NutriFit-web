/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GoalType = 'LOSS' | 'MAINTAIN' | 'GAIN' | 'BALANCE';
export type ActivityLevel = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'VERY_ACTIVE' | 'EXTRA_ACTIVE';
export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
export type AllergenVerificationStatus = 'CONTAINS' | 'CROSS_CONTACT_RISK' | 'UNKNOWN' | 'VERIFIED_NO_MATCH' | 'NOT_CHECKED';
export type SourceType = 'OFFICIAL_DB' | 'VERIFIED_EXTERNAL' | 'USER_CUSTOM' | 'AI_ESTIMATED';

export type CookingMethod = 'GRILL' | 'STEAM' | 'STIR_FRY' | 'RAW' | 'SOUP' | 'BOIL' | 'BAKE' | 'ROAST';
export type FlavorProfile = 'CLEAN' | 'SAVORY' | 'SPICY' | 'SWEET' | 'NUTTY' | 'REFRESHING';

export interface UserProfile {
  id: string;
  displayName: string;
  age: number;
  sexForCalculation: 'MALE' | 'FEMALE';
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  goalType: GoalType;
  targetDurationWeeks: number;
  preferredMealsPerDay: number;
  dietPreference?: string;
  defaultCookingTimeMinutes?: number;
  dailyBudgetWon?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserGoal {
  id: string;
  userId: string;
  goalType: GoalType;
  bmr: number;
  tdee: number;
  dailyCalorieTarget: number;
  carbohydrateTargetG: number;
  proteinTargetG: number;
  fatTargetG: number;
  fiberTargetG?: number;
  effectiveFrom: string;
  calculationMethod: string;
  calorieAdjustmentReason: string;
  isCustomManual?: boolean;
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  foodType: string;
  servingSize: number;
  servingUnit: string;
  nutritionBasisGrams: number; // usually 100g
  calories: number; // per nutritionBasisGrams
  carbohydrates: number;
  protein: number;
  fat: number;
  fiber?: number;
  ingredients: string[];
  allergens: string[]; // e.g. ['PEANUT', 'SHRIMP', 'MILK', 'SOY', 'WHEAT', 'EGG']
  crossContactRisk?: string[];
  cookingMethod?: CookingMethod;
  flavorProfile?: FlavorProfile;
  mainCategory?: string;
  sourceType: SourceType;
  sourceReference: string;
  verifiedAt: string;
  isCustom?: boolean;
}

export interface FoodLog {
  id: string;
  userId: string;
  foodId: string;
  foodNameSnapshot: string;
  ingredientsSnapshot?: string[];
  allergensSnapshot?: string[];
  cookingMethodSnapshot?: CookingMethod;
  flavorProfileSnapshot?: FlavorProfile;
  mealType: MealType;
  consumedAt: string; // ISO date-time string
  consumedDate: string; // YYYY-MM-DD
  weightG: number;
  calories: number;
  carbohydrates: number;
  protein: number;
  fat: number;
  fiber?: number;
  inputMethod: 'SEARCH' | 'PHOTO_AI' | 'CUSTOM_INPUT';
  allergenStatus: AllergenVerificationStatus;
  detectedAllergens: string[];
  satisfactionRating?: number; // 1 to 5 stars
  notes?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserAllergyConfig {
  allergenCode: string;
  allergenName: string;
  isActive: boolean;
  handlingMode: 'WARN' | 'STRICT_EXCLUDE';
  notes?: string;
}

export interface FoodSafetyCheck {
  foodId: string;
  foodName: string;
  status: AllergenVerificationStatus;
  matchedAllergens: string[];
  crossContactAllergens: string[];
  warningMessage: string;
  checkedAt: string;
}

export type FeedbackReaction = 'INTERESTED' | 'DISLIKED' | 'EATEN' | 'SKIPPED';

export interface RecommendationFeedback {
  id: string;
  recommendationId: string;
  menuName: string;
  reaction: FeedbackReaction;
  dislikeReason?: string;
  createdAt: string;
}

export interface MealRecommendation {
  id: string;
  menuName: string;
  category: string;
  mealType: MealType;
  estimatedCalories: number;
  carbohydrates: number;
  protein: number;
  fat: number;
  estimatedWeightG: number;
  estimatedCookingTimeMin: number;
  estimatedCostWon: number;
  isHomeCooked: boolean;
  ingredients: string[];
  allergens?: string[];
  cookingMethod?: CookingMethod;
  flavorProfile?: FlavorProfile;
  recommendationReason: string;
  learnedTasteReason?: string; // e.g. "자주 드시는 닭가슴살 취향 반영"
  matchedGoalReasons: string[];
  allergenStatus: AllergenVerificationStatus;
  allergenWarnings: string[];
  alternativeMenu?: MealRecommendation & { reason: string; calories: number };
  isBookmarked?: boolean;
  feedback?: FeedbackReaction;
}

export interface WeightLog {
  id: string;
  userId: string;
  weightKg: number;
  measuredAt: string;
  note?: string;
}

export interface DailyNutritionSummary {
  date: string;
  consumedCalories: number;
  consumedCarbohydrates: number;
  consumedProtein: number;
  consumedFat: number;
  targetCalories: number;
  targetCarbohydrates: number;
  targetProtein: number;
  targetFat: number;
  remainingCalories: number;
  remainingCarbohydrates: number;
  remainingProtein: number;
  remainingFat: number;
  mealLogsCount: number;
  byMealType: {
    [key in MealType]: {
      calories: number;
      carbs: number;
      protein: number;
      fat: number;
      items: FoodLog[];
    };
  };
}

export interface UserTasteProfile {
  favoriteIngredients: { name: string; score: number }[];
  favoriteCookingMethods: { method: CookingMethod; label: string; score: number; percentage: number }[];
  favoriteFlavors: { flavor: FlavorProfile; label: string; score: number }[];
  dislikedIngredients: string[];
  bookmarkedMenuNames: string[];
  totalLogsAnalyzed: number;
  tasteConfidence: 'LEARNING' | 'ESTABLISHED' | 'MATURE';
  insightHighlights: string[];
  lastUpdated: string;
}

export interface QuickMealCombo {
  id: string;
  title: string;
  mealType: MealType;
  foods: {
    foodId: string;
    foodName: string;
    weightG: number;
    calories: number;
    carbohydrates: number;
    protein: number;
    fat: number;
  }[];
  totalCalories: number;
  totalProtein: number;
  timesLogged: number;
}

// ==========================================
// AI Pet System & Food Collection Types
// ==========================================

export type PetStage = 1 | 2 | 3 | 4;
export type PetMood =
  | 'HAPPY'
  | 'CURIOUS'
  | 'PROUD'
  | 'HUNGRY'
  | 'SLEEPY'
  | 'THINKING'
  | 'EXCITED'
  | 'SAVORING'
  | 'CHEERING';

export type PetPersonality =
  | 'WARM_FRIEND' // 다정한 밥친구
  | 'CURIOUS_EXPLORER' // 호기심 탐험가
  | 'GOURMET_CHEF' // 섬세한 미식가
  | 'CHEERFUL_VITAMIN'; // 활기찬 비타민

export interface PetDialogueAction {
  id: string;
  label: string;
  actionType: 'RECOMMEND' | 'LOG_MEAL' | 'EXPLORE' | 'CHAT_REPLY' | 'INTERACT';
  categoryFilter?: string;
  mealType?: MealType;
  collectionTab?: 'FOOD' | 'GROWTH';
  replyText?: string;
}

export type PetEvolutionPath = 'GARDEN' | 'PROTEIN' | 'GRAIN' | 'BALANCED' | 'PIG';
export type PetDietGroup = Exclude<PetEvolutionPath, 'BALANCED' | 'PIG'>;
export interface PetDietEntry {
  date: string;
  mealType: MealType;
  groups: PetDietGroup[];
}

export interface PetProfile {
  petId: string;
  userId: string;
  petName: string;
  growthStage: PetStage;
  stageName: string;
  experience: number;
  maxExperienceForStage: number;
  affection: number; // 친밀도 (식사 기록 및 상호작용)
  explorationProgress: number; // 탐험도 (새로운 음식 발견)
  tasteUnderstanding: number; // 취향 이해도 (추천 피드백 축적)
  personality?: PetPersonality; // 펫 성격
  interactionCount?: number; // 펫과의 대화 및 쓰다듬기 상호작용 횟수
  favoriteFood?: string;
  totalMealsShared: number;
  rewardedMealLogIds: string[]; // 중복 경험치 지급 방지용 ID 목록
  rewardedFeedbackIds: string[]; // 중복 피드백 경험치 방지용 ID 목록
  rewardedFeedbackKeys?: string[];
  lastFedAt?: string;
  lastInteractedAt?: string;
  dailyExpDate?: string;
  dailyExpGained?: number;
  dailyPetDate?: string;
  dailyPetCount?: number;
  evolutionPath?: PetEvolutionPath;
  unlockedForms?: string[];
  dietEntries?: PetDietEntry[];
  generation?: number;
  generationStartedAt?: string;
  satiety?: number;
  satietyUpdatedAt?: string;
  feedingEvents?: { date: string; mealType: MealType; fedAt: string; fullnessAfter: number; generation: number }[];
  createdAt: string;
  updatedAt: string;
}

export interface FoodCollectionItem {
  id: string; // 음식 식별 키 (정규화된 이름 또는 foodId)
  foodId: string;
  normalizedName: string;
  foodName: string;
  firstRecordedAt: string;
  lastRecordedAt: string;
  recordCount: number;
  personalRating?: number; // 1~5점
  isFavorite: boolean;
  calories: number; // 기준 섭취량 또는 100g 칼로리
  carbohydrates: number;
  protein: number;
  fat: number;
  mainCategory?: string;
  servingWeightG?: number;
  cookingMethod?: CookingMethod;
  flavorProfile?: FlavorProfile;
  allergens?: string[];
  isDiscovered: boolean; // 사용자가 실제 기록한 적이 있는지 여부
}

export interface PetDialogue {
  id: string;
  message: string;
  subMessage?: string;
  mood: PetMood;
  context:
    | 'WELCOME'
    | 'MEAL_ADDED'
    | 'NEW_DISCOVERY'
    | 'RECOMMEND'
    | 'FEEDBACK'
    | 'TIME_GREETING'
    | 'HABIT_INSIGHT'
    | 'PROACTIVE_CHAT'
    | 'CARE_COMFORT';
  actions?: PetDialogueAction[];
  timestamp: string;
}

