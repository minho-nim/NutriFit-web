/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MealRecommendation, MealType, UserAllergyConfig, UserProfile } from '../types/nutrition';

export interface ImageAnalysisResult {
  success: boolean;
  source: 'GEMINI_AI' | 'LOCAL_RULE_ENGINE';
  overallAssessment: string;
  recognizedFoods: Array<{
    id: string;
    foodName: string;
    estimatedWeightG: number;
    ingredients: string[];
    confidence: string;
    nutritionPer100g: {
      calories: number;
      carbohydrates: number;
      protein: number;
      fat: number;
    };
    detectionReason: string;
    matchedFood: any | null;
    sourceType: string;
    needsConfirmation: boolean;
  }>;
}

export async function analyzeFoodImage(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<ImageAnalysisResult> {
  const response = await fetch('/api/v1/foods/analyze-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `서버 오류 (${response.status})`);
  }

  return response.json();
}

export async function getMealRecommendations(params: {
  userProfile: UserProfile;
  summary: any;
  userAllergies: UserAllergyConfig[];
  mealType: MealType;
  preferences: {
    cookingTimeMinutes?: number;
    budgetWon?: number;
    isHomeCooked?: boolean;
    likes?: string[];
    dislikes?: string[];
  };
}): Promise<{ success: boolean; recommendations: MealRecommendation[] }> {
  const response = await fetch('/api/v1/recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `서버 오류 (${response.status})`);
  }

  return response.json();
}

export async function getHabitCoaching(params: {
  profile: UserProfile;
  weeklyLogs: any[];
  weightLogs: any[];
}): Promise<{ success: boolean; coachingText: string }> {
  const response = await fetch('/api/v1/ai/habit-coaching', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `서버 오류 (${response.status})`);
  }

  return response.json();
}
