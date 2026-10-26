/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { INITIAL_TEST_ALLERGIES, VERIFIED_FOODS } from '../data/mockFoods';
import {
  FoodCollectionItem,
  FoodItem,
  FoodLog,
  PetProfile,
  UserAllergyConfig,
  UserGoal,
  UserProfile,
  WeightLog,
} from '../types/nutrition';
import { calculateNutritionGoals } from '../utils/nutritionEngine';
import { DEFAULT_PET_PROFILE, syncFoodCollection } from '../utils/petEngine';
import { normalizePetEvolution } from '../utils/petEvolution';
import { validBackup } from '../utils/backupValidation';

const STORAGE_KEYS = {
  PROFILE: 'nutrifit_user_profile_v1',
  GOAL: 'nutrifit_user_goal_v1',
  FOOD_LOGS: 'nutrifit_food_logs_v1',
  CUSTOM_FOODS: 'nutrifit_custom_foods_v1',
  ALLERGIES: 'nutrifit_allergies_v1',
  WEIGHT_LOGS: 'nutrifit_weight_logs_v1',
  FEEDBACKS: 'nutrifit_feedbacks_v1',
  PET_PROFILE: 'nutrifit_pet_profile_v1',
  FOOD_COLLECTIONS: 'nutrifit_food_collections_v1',
};

// Today's date YYYY-MM-DD
export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generate date offset by days
export function getDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'user-default-01',
  displayName: '김민지',
  age: 28,
  sexForCalculation: 'FEMALE',
  heightCm: 165,
  currentWeightKg: 62.5,
  targetWeightKg: 56.0,
  activityLevel: 'MODERATE',
  goalType: 'LOSS',
  targetDurationWeeks: 12,
  preferredMealsPerDay: 3,
  dietPreference: '한식 위주, 고단백 저지방',
  defaultCookingTimeMinutes: 20,
  dailyBudgetWon: 15000,
  createdAt: '2025-01-01',
  updatedAt: new Date().toISOString(),
};

export const INITIAL_WEIGHT_LOGS: WeightLog[] = [
  { id: 'w-1', userId: 'user-default-01', weightKg: 64.2, measuredAt: getDateOffset(-14), note: '측정 시작' },
  { id: 'w-2', userId: 'user-default-01', weightKg: 63.8, measuredAt: getDateOffset(-10), note: '아침 공복' },
  { id: 'w-3', userId: 'user-default-01', weightKg: 63.4, measuredAt: getDateOffset(-7), note: '유산소 후' },
  { id: 'w-4', userId: 'user-default-01', weightKg: 63.0, measuredAt: getDateOffset(-4), note: '아침 공복' },
  { id: 'w-5', userId: 'user-default-01', weightKg: 62.7, measuredAt: getDateOffset(-2), note: '아침 공복' },
  { id: 'w-6', userId: 'user-default-01', weightKg: 62.5, measuredAt: getDateOffset(0), note: '오늘 아침 공복' },
];

export const INITIAL_FOOD_LOGS: FoodLog[] = [
  // Today's logs
  {
    id: 'log-today-1',
    userId: 'user-default-01',
    foodId: 'food-001',
    foodNameSnapshot: '현미밥',
    mealType: 'BREAKFAST',
    consumedAt: `${getTodayString()}T08:30:00`,
    consumedDate: getTodayString(),
    weightG: 150,
    calories: 230,
    carbohydrates: 49.5,
    protein: 4.7,
    fat: 1.4,
    fiber: 2.7,
    inputMethod: 'SEARCH',
    allergenStatus: 'VERIFIED_NO_MATCH',
    detectedAllergens: [],
    notes: '아침 식사 든든하게 섭취',
    createdAt: `${getTodayString()}T08:30:00`,
    updatedAt: `${getTodayString()}T08:30:00`,
  },
  {
    id: 'log-today-2',
    userId: 'user-default-01',
    foodId: 'food-006',
    foodNameSnapshot: '삶은 달걀',
    mealType: 'BREAKFAST',
    consumedAt: `${getTodayString()}T08:35:00`,
    consumedDate: getTodayString(),
    weightG: 110,
    calories: 171,
    carbohydrates: 1.2,
    protein: 13.9,
    fat: 11.7,
    inputMethod: 'SEARCH',
    allergenStatus: 'VERIFIED_NO_MATCH',
    detectedAllergens: [],
    notes: '삶은 달걀 2개',
    createdAt: `${getTodayString()}T08:35:00`,
    updatedAt: `${getTodayString()}T08:35:00`,
  },
  {
    id: 'log-today-3',
    userId: 'user-default-01',
    foodId: 'food-013',
    foodNameSnapshot: '닭가슴살 아보카도 샐러드',
    mealType: 'LUNCH',
    consumedAt: `${getTodayString()}T12:40:00`,
    consumedDate: getTodayString(),
    weightG: 250,
    calories: 275,
    carbohydrates: 11.3,
    protein: 28.8,
    fat: 13.0,
    inputMethod: 'PHOTO_AI',
    allergenStatus: 'VERIFIED_NO_MATCH',
    detectedAllergens: [],
    notes: '점심 샐러드 볼 (AI 사진 인식 기록)',
    createdAt: `${getTodayString()}T12:40:00`,
    updatedAt: `${getTodayString()}T12:40:00`,
  },

  // Past 6 days sample logs for Weekly Report trends
  {
    id: 'log-past-1',
    userId: 'user-default-01',
    foodId: 'food-003',
    foodNameSnapshot: '닭가슴살 구이 (오븐조리)',
    mealType: 'LUNCH',
    consumedAt: `${getDateOffset(-1)}T12:30:00`,
    consumedDate: getDateOffset(-1),
    weightG: 150,
    calories: 248,
    carbohydrates: 0,
    protein: 46.5,
    fat: 5.4,
    inputMethod: 'SEARCH',
    allergenStatus: 'VERIFIED_NO_MATCH',
    detectedAllergens: [],
    createdAt: `${getDateOffset(-1)}T12:30:00`,
    updatedAt: `${getDateOffset(-1)}T12:30:00`,
  },
  {
    id: 'log-past-2',
    userId: 'user-default-01',
    foodId: 'food-001',
    foodNameSnapshot: '현미밥',
    mealType: 'LUNCH',
    consumedAt: `${getDateOffset(-1)}T12:30:00`,
    consumedDate: getDateOffset(-1),
    weightG: 210,
    calories: 321,
    carbohydrates: 69.3,
    protein: 6.5,
    fat: 1.9,
    inputMethod: 'SEARCH',
    allergenStatus: 'VERIFIED_NO_MATCH',
    detectedAllergens: [],
    createdAt: `${getDateOffset(-1)}T12:30:00`,
    updatedAt: `${getDateOffset(-1)}T12:30:00`,
  },
  {
    id: 'log-past-3',
    userId: 'user-default-01',
    foodId: 'food-005',
    foodNameSnapshot: '연어 구이',
    mealType: 'DINNER',
    consumedAt: `${getDateOffset(-1)}T19:00:00`,
    consumedDate: getDateOffset(-1),
    weightG: 150,
    calories: 309,
    carbohydrates: 0,
    protein: 33.2,
    fat: 18.5,
    inputMethod: 'SEARCH',
    allergenStatus: 'VERIFIED_NO_MATCH',
    detectedAllergens: [],
    createdAt: `${getDateOffset(-1)}T19:00:00`,
    updatedAt: `${getDateOffset(-1)}T19:00:00`,
  },
  // Day -2
  {
    id: 'log-past-4',
    userId: 'user-default-01',
    foodId: 'food-018',
    foodNameSnapshot: '소고기 야채 비빔밥',
    mealType: 'LUNCH',
    consumedAt: `${getDateOffset(-2)}T13:00:00`,
    consumedDate: getDateOffset(-2),
    weightG: 450,
    calories: 639,
    carbohydrates: 100.8,
    protein: 25.2,
    fat: 14.4,
    inputMethod: 'SEARCH',
    allergenStatus: 'VERIFIED_NO_MATCH',
    detectedAllergens: [],
    createdAt: `${getDateOffset(-2)}T13:00:00`,
    updatedAt: `${getDateOffset(-2)}T13:00:00`,
  },
  {
    id: 'log-past-5',
    userId: 'user-default-01',
    foodId: 'food-007',
    foodNameSnapshot: '두부 부침',
    mealType: 'DINNER',
    consumedAt: `${getDateOffset(-2)}T18:40:00`,
    consumedDate: getDateOffset(-2),
    weightG: 150,
    calories: 147,
    carbohydrates: 3.3,
    protein: 14.0,
    fat: 8.7,
    inputMethod: 'SEARCH',
    allergenStatus: 'VERIFIED_NO_MATCH',
    detectedAllergens: [],
    createdAt: `${getDateOffset(-2)}T18:40:00`,
    updatedAt: `${getDateOffset(-2)}T18:40:00`,
  },
];

export class StorageService {
  static getProfile(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to parse stored profile:', e);
    }
    return DEFAULT_USER_PROFILE;
  }

  static saveProfile(profile: UserProfile): void {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }

  static getGoal(): UserGoal {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GOAL);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to parse stored goal:', e);
    }
    const profile = StorageService.getProfile();
    const computedGoal = calculateNutritionGoals(profile);
    StorageService.saveGoal(computedGoal);
    return computedGoal;
  }

  static saveGoal(goal: UserGoal): void {
    localStorage.setItem(STORAGE_KEYS.GOAL, JSON.stringify(goal));
  }

  static getFoodLogs(): FoodLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FOOD_LOGS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to parse food logs:', e);
    }
    return INITIAL_FOOD_LOGS;
  }

  static saveFoodLogs(logs: FoodLog[]): void {
    localStorage.setItem(STORAGE_KEYS.FOOD_LOGS, JSON.stringify(logs));
  }

  static getCustomFoods(): FoodItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_FOODS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to parse custom foods:', e);
    }
    return [];
  }

  static saveCustomFoods(foods: FoodItem[]): void {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_FOODS, JSON.stringify(foods));
  }

  static getAllergies(): UserAllergyConfig[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ALLERGIES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to parse allergies:', e);
    }
    return INITIAL_TEST_ALLERGIES;
  }

  static saveAllergies(allergies: UserAllergyConfig[]): void {
    localStorage.setItem(STORAGE_KEYS.ALLERGIES, JSON.stringify(allergies));
  }

  static getWeightLogs(): WeightLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WEIGHT_LOGS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to parse weight logs:', e);
    }
    return INITIAL_WEIGHT_LOGS;
  }

  static saveWeightLogs(logs: WeightLog[]): void {
    localStorage.setItem(STORAGE_KEYS.WEIGHT_LOGS, JSON.stringify(logs));
  }

  static getFeedbacks(): any[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FEEDBACKS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to parse feedbacks:', e);
    }
    return [];
  }

  static saveFeedbacks(feedbacks: any[]): void {
    localStorage.setItem(STORAGE_KEYS.FEEDBACKS, JSON.stringify(feedbacks));
  }

  static getPetProfile(): PetProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PET_PROFILE);
      if (data) return normalizePetEvolution({ ...DEFAULT_PET_PROFILE, ...JSON.parse(data) });
    } catch (e) {
      console.warn('Failed to parse pet profile:', e);
    }
    return normalizePetEvolution(DEFAULT_PET_PROFILE);
  }

  static savePetProfile(pet: PetProfile): void {
    localStorage.setItem(STORAGE_KEYS.PET_PROFILE, JSON.stringify(pet));
  }

  static getFoodCollections(): FoodCollectionItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FOOD_COLLECTIONS);
      if (data) return syncFoodCollection(StorageService.getFoodLogs(), JSON.parse(data));
    } catch (e) {
      console.warn('Failed to parse food collections:', e);
    }
    // Generate initial collection based on current food logs
    const logs = StorageService.getFoodLogs();
    const initialCollection = syncFoodCollection(logs);
    StorageService.saveFoodCollections(initialCollection);
    return initialCollection;
  }

  static saveFoodCollections(collections: FoodCollectionItem[]): void {
    localStorage.setItem(STORAGE_KEYS.FOOD_COLLECTIONS, JSON.stringify(collections));
  }

  static exportAllData(): string {
    const data = {
      profile: StorageService.getProfile(),
      goal: StorageService.getGoal(),
      foodLogs: StorageService.getFoodLogs(),
      customFoods: StorageService.getCustomFoods(),
      allergies: StorageService.getAllergies(),
      weightLogs: StorageService.getWeightLogs(),
      feedbacks: StorageService.getFeedbacks(),
      petProfile: StorageService.getPetProfile(),
      foodCollections: StorageService.getFoodCollections(),
      exportedAt: new Date().toISOString(),
      version: '1.2.0',
    };
    return JSON.stringify(data, null, 2);
  }

  static importAllData(jsonString: string): boolean {
    let previous: [string, string | null][] | undefined;
    try {
      const data = JSON.parse(jsonString);
      if (!validBackup(data)) return false;
      previous = Object.values(STORAGE_KEYS).map((key) => [key, localStorage.getItem(key)]);
      if (data.profile) StorageService.saveProfile(data.profile);
      if (data.goal) StorageService.saveGoal(data.goal);
      if (data.foodLogs) StorageService.saveFoodLogs(data.foodLogs);
      if (data.customFoods) StorageService.saveCustomFoods(data.customFoods);
      if (data.allergies) StorageService.saveAllergies(data.allergies);
      if (data.weightLogs) StorageService.saveWeightLogs(data.weightLogs);
      if (data.feedbacks) StorageService.saveFeedbacks(data.feedbacks);
      StorageService.savePetProfile(normalizePetEvolution(data.petProfile || DEFAULT_PET_PROFILE));
      StorageService.saveFoodCollections(syncFoodCollection(data.foodLogs, data.foodCollections || []));
      return true;
    } catch (e) {
      if (previous) for (const [key, value] of previous) {
        if (localStorage.getItem(key) === value) continue;
        try {
          if (value === null) localStorage.removeItem(key);
          else localStorage.setItem(key, value);
        } catch { /* Retain the import error if the browser storage is unavailable. */ }
      }
      console.error('Import failed:', e);
      return false;
    }
  }

  static resetToDefault(): void {
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.GOAL);
    localStorage.removeItem(STORAGE_KEYS.FOOD_LOGS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_FOODS);
    localStorage.removeItem(STORAGE_KEYS.ALLERGIES);
    localStorage.removeItem(STORAGE_KEYS.WEIGHT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.FEEDBACKS);
    localStorage.removeItem(STORAGE_KEYS.PET_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.FOOD_COLLECTIONS);
  }
}
