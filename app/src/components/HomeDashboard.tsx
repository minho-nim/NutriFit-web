/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowRight, ChevronRight, Plus, Sparkles, Utensils } from 'lucide-react';
import {
  DailyNutritionSummary,
  FoodLog,
  MealType,
  MealRecommendation,
  UserAllergyConfig,
  RecommendationFeedback,
  PetProfile,
  UserGoal,
  UserProfile,
  UserTasteProfile,
} from '../types/nutrition';
import { MEAL_TYPE_LABELS } from '../utils/nutritionEngine';
import { COOKING_METHOD_LABELS, FLAVOR_PROFILE_LABELS } from '../utils/tasteEngine';
import { generateCuratedRecommendations } from '../utils/tasteEngine';
import { HomePetCard } from './HomePetCard';

interface HomeDashboardProps {
  pet: PetProfile;
  summary: DailyNutritionSummary;
  petSummary: DailyNutritionSummary;
  profile: UserProfile;
  goal: UserGoal;
  tasteProfile: UserTasteProfile;
  recentLogs: FoodLog[];
  collectionCount: number;
  onOpenMealLogger: (mealType: MealType) => void;
  onNavigateToDiscover: (categoryFilter?: string) => void;
  onNavigateToTasteInsights: () => void;
  onNavigateToCollection: (tab?: 'FOOD' | 'GROWTH') => void;
  onUpdatePetName: (newName: string) => void;
  onUpdatePetProfile?: (updatedPet: PetProfile) => void;
  onOpenPetChatModal?: (initialDialogue?: any, tab?: 'CHAT' | 'GROWTH') => void;
  userAllergies: UserAllergyConfig[];
  feedbacks: RecommendationFeedback[];
  onQuickAddFood: (item: MealRecommendation) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  pet,
  summary,
  petSummary,
  profile,
  goal,
  tasteProfile,
  recentLogs,
  collectionCount,
  onOpenMealLogger,
  onNavigateToDiscover,
  onNavigateToTasteInsights,
  onNavigateToCollection,
  onUpdatePetName,
  onUpdatePetProfile,
  onOpenPetChatModal,
  onQuickAddFood,
  userAllergies,
  feedbacks,
}) => {
  const mealOrder: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

  // Identify next unrecorded meal
  let nextMeal: MealType = 'LUNCH';
  if (summary.byMealType.BREAKFAST.items.length === 0) {
    nextMeal = 'BREAKFAST';
  } else if (summary.byMealType.LUNCH.items.length === 0) {
    nextMeal = 'LUNCH';
  } else if (summary.byMealType.DINNER.items.length === 0) {
    nextMeal = 'DINNER';
  } else {
    nextMeal = 'SNACK';
  }

  const heroRecommendation = generateCuratedRecommendations({
    profile, goal, summary, tasteProfile, recentLogs, userAllergies, mealType: nextMeal, feedbacks,
  })[0];
  const heroDish = heroRecommendation && {
    name: heroRecommendation.menuName, calories: heroRecommendation.estimatedCalories,
    carbs: heroRecommendation.carbohydrates, protein: heroRecommendation.protein, fat: heroRecommendation.fat,
    cookingMethod: heroRecommendation.cookingMethod!, flavor: heroRecommendation.flavorProfile!,
    reason: heroRecommendation.recommendationReason,
  };

  const calorieRatio = Math.min(1, summary.consumedCalories / (summary.targetCalories || 1));

  return (
    <div className="space-y-4 pb-20">
      {/* 0. AI Pet Companion Card */}
      <HomePetCard
        pet={pet}
        summary={petSummary}
        tasteProfile={tasteProfile}
        recentLogs={recentLogs}
        collectionCount={collectionCount}
        onOpenMealLogger={onOpenMealLogger}
        onNavigateToDiscover={onNavigateToDiscover}
        onNavigateToCollection={onNavigateToCollection}
        onUpdatePetName={onUpdatePetName}
        onUpdatePetProfile={onUpdatePetProfile}
        onOpenChatModal={onOpenPetChatModal}
      />

      {/* 1. Daily Calorie & Macronutrients Card */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-2xs">
        <div className="flex items-baseline justify-between mb-2">
          <div>
            <span className="text-[11px] font-semibold text-stone-400">{summary.date} 에너지</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-3xl font-extrabold text-stone-900 tracking-tight tabular-nums">
                {summary.consumedCalories.toLocaleString()}
              </span>
              <span className="text-xs text-stone-400">
                / {summary.targetCalories.toLocaleString()} kcal
              </span>
            </div>
          </div>

          <div className="text-right">
            {summary.remainingCalories >= 0 ? (
              <div>
                <span className="text-[11px] font-semibold text-stone-400">남은 칼로리</span>
                <div className="text-base font-bold text-[#3B4E3F]">
                  {summary.remainingCalories.toLocaleString()} kcal
                </div>
              </div>
            ) : (
              <div>
                <span className="text-[11px] font-semibold text-stone-400">초과 섭취</span>
                <div className="text-base font-bold text-rose-600">
                  +{Math.abs(summary.remainingCalories).toLocaleString()} kcal
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden my-3">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              summary.remainingCalories < 0 ? 'bg-rose-500' : 'bg-[#435746]'
            }`}
            style={{ width: `${Math.min(100, calorieRatio * 100)}%` }}
          />
        </div>

        {/* Macronutrient Tri-split */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-stone-100 text-center">
          <div className="bg-stone-50/70 py-2 px-1 rounded-xl">
            <span className="text-[10px] font-medium text-stone-400 block">탄수화물</span>
            <span className="text-xs font-bold text-stone-800">
              {summary.consumedCarbohydrates}
              <span className="text-[10px] text-stone-400 font-normal"> / {summary.targetCarbohydrates}g</span>
            </span>
          </div>

          <div className="bg-stone-50/70 py-2 px-1 rounded-xl">
            <span className="text-[10px] font-medium text-stone-400 block">단백질</span>
            <span className="text-xs font-bold text-stone-800">
              {summary.consumedProtein}
              <span className="text-[10px] text-stone-400 font-normal"> / {summary.targetProtein}g</span>
            </span>
          </div>

          <div className="bg-stone-50/70 py-2 px-1 rounded-xl">
            <span className="text-[10px] font-medium text-stone-400 block">지방</span>
            <span className="text-xs font-bold text-stone-800">
              {summary.consumedFat}
              <span className="text-[10px] text-stone-400 font-normal"> / {summary.targetFat}g</span>
            </span>
          </div>
        </div>
      </div>

      {heroDish && <>
      {/* 2. Centerpiece: The Single Learned Recommendation Card */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-2xs relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#4D6250]" />
            <span className="text-xs font-bold text-stone-800">
              {MEAL_TYPE_LABELS[nextMeal].name} 추천 · 취향 맞춤 1선
            </span>
          </div>
          <button
            onClick={() => onNavigateToDiscover()}
            className="text-[11px] text-stone-500 hover:text-stone-900 font-medium flex items-center gap-0.5"
          >
            <span>발견에서 더보기</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2.5">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-[#EEF2EE] text-[#334636] font-semibold">
                {COOKING_METHOD_LABELS[heroDish.cookingMethod] || '구이'}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-stone-100 text-stone-600 font-medium">
                {FLAVOR_PROFILE_LABELS[heroDish.flavor] || '담백한 맛'}
              </span>
            </div>
            <h4 className="text-base font-bold text-stone-900 tracking-tight">
              {heroDish.name}
            </h4>
          </div>

          {/* Calorie & Protein highlight */}
          <div className="flex items-center gap-3 text-xs text-stone-600 bg-stone-50/80 py-2 px-3 rounded-xl border border-stone-100">
            <span className="font-bold text-stone-900">{heroDish.calories} kcal</span>
            <span className="text-stone-300">·</span>
            <span>단백질 <strong className="text-stone-900">{heroDish.protein}g</strong></span>
            <span className="text-stone-300">·</span>
            <span>탄 {heroDish.carbs}g · 지 {heroDish.fat}g</span>
          </div>

          {/* Grounded Reason */}
          <p className="text-xs text-stone-500 leading-relaxed">
            {heroDish.reason}
          </p>

          {/* Direct Add Action */}
          <div className="pt-2 flex items-center justify-between border-t border-stone-100">
            <span className="text-[11px] text-stone-400">
              {profile.displayName}님의 기록 기반 추천
            </span>
            <button
              onClick={() => onQuickAddFood(heroRecommendation)}
              className="px-3.5 py-1.5 bg-[#405443] hover:bg-[#344637] text-white text-xs font-semibold rounded-xl shadow-2xs transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>선택한 날짜에 기록</span>
            </button>
          </div>
        </div>
      </div>

      </>}
      {!heroDish && <p className="rounded-xl bg-white p-4 text-sm text-stone-600">현재 알레르기 설정과 선호 조건에 맞는 추천 메뉴가 없어요. 음식 검색으로 식사를 기록해 주세요.</p>}
      {/* 3. Meal Slots List */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs divide-y divide-stone-100 overflow-hidden">
        {mealOrder.map((mType) => {
          const info = MEAL_TYPE_LABELS[mType];
          const data = summary.byMealType[mType];
          const hasFood = data.items.length > 0;

          return (
            <div
              key={mType}
              className="p-4 flex items-center justify-between hover:bg-stone-50/50 transition"
            >
              <div
                className="flex-1 min-w-0 pr-3 cursor-pointer"
                onClick={() => onOpenMealLogger(mType)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-stone-900">{info.name}</span>
                  {hasFood ? (
                    <span className="text-xs font-semibold text-stone-700">
                      {data.calories} kcal
                    </span>
                  ) : (
                    <span className="text-xs text-stone-300 font-normal">미기록</span>
                  )}
                </div>

                {hasFood ? (
                  <p className="text-xs text-stone-500 truncate mt-0.5">
                    {data.items.map((i) => i.foodNameSnapshot).join(', ')}
                  </p>
                ) : (
                  <p className="text-[11px] text-stone-300 mt-0.5">{info.timeHint}</p>
                )}
              </div>

              <button
                onClick={() => onOpenMealLogger(mType)}
                aria-label={`${info.name} 기록 추가`}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-[#EEF2EE] hover:text-[#384C3B] text-stone-600 flex items-center justify-center transition shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2]" />
              </button>
            </div>
          );
        })}
      </div>

      {/* 4. Taste Learning Evolution Banner Shortcut */}
      <div
        onClick={onNavigateToTasteInsights}
        className="bg-stone-100/70 hover:bg-stone-100 p-4 rounded-2xl border border-stone-200/80 cursor-pointer transition flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-stone-600 shadow-2xs">
            <Utensils className="w-4 h-4 text-[#435746]" />
          </div>
          <div>
            <div className="text-xs font-bold text-stone-900">
              나의 취향 변화 & 식습관 인사이트
            </div>
            <div className="text-[11px] text-stone-500 mt-0.5">
              {tasteProfile.insightHighlights[0] || '기록이 쌓일수록 맞춤형 분석이 정교해집니다'}
            </div>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-stone-400" />
      </div>
    </div>
  );
};
