/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Flame,
  Plus,
  RotateCcw,
  Sparkles,
  Star,
  Trash2,
  Utensils,
} from 'lucide-react';
import {
  DailyNutritionSummary,
  FoodItem,
  FoodLog,
  MealType,
  QuickMealCombo,
  UserGoal,
  UserProfile,
  UserTasteProfile,
} from '../types/nutrition';
import { MEAL_TYPE_LABELS } from '../utils/nutritionEngine';
import { extractQuickCombos } from '../utils/tasteEngine';

interface DiaryViewProps {
  activeTab: 'LOGS' | 'COMBOS' | 'TASTE';
  onSelectTab: (tab: 'LOGS' | 'COMBOS' | 'TASTE') => void;
  summary: DailyNutritionSummary;
  selectedDate: string;
  foodLogs: FoodLog[];
  goal: UserGoal;
  profile: UserProfile;
  tasteProfile: UserTasteProfile;
  onOpenMealLogger: (mealType: MealType) => void;
  onDeleteFoodLog: (logId: string) => void;
  onUpdateFoodLogRating: (logId: string, rating: number) => void;
  onQuickLogCombo: (combo: QuickMealCombo) => void;
  onResetTasteProfile: () => void;
}

export const DiaryView: React.FC<DiaryViewProps> = ({
  activeTab,
  onSelectTab,
  summary,
  selectedDate,
  foodLogs,
  goal,
  profile,
  tasteProfile,
  onOpenMealLogger,
  onDeleteFoodLog,
  onUpdateFoodLogRating,
  onQuickLogCombo,
  onResetTasteProfile,
}) => {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const mealOrder: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
  const quickCombos = extractQuickCombos(foodLogs);

  return (
    <div className="space-y-4 pb-20">
      {/* Sub-navigation Segmented Control */}
      <div className="bg-stone-200/60 p-1 rounded-xl flex text-xs font-semibold">
        <button
          onClick={() => onSelectTab('LOGS')}
          className={`flex-1 py-1.5 rounded-lg transition ${
            activeTab === 'LOGS'
              ? 'bg-white text-stone-900 shadow-2xs font-bold'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          식사 기록
        </button>
        <button
          onClick={() => onSelectTab('COMBOS')}
          className={`flex-1 py-1.5 rounded-lg transition ${
            activeTab === 'COMBOS'
              ? 'bg-white text-stone-900 shadow-2xs font-bold'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          자주 먹은 조합
        </button>
        <button
          onClick={() => onSelectTab('TASTE')}
          className={`flex-1 py-1.5 rounded-lg transition ${
            activeTab === 'TASTE'
              ? 'bg-white text-stone-900 shadow-2xs font-bold'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          나의 변화
        </button>
      </div>

      {/* Tab 1: Daily Food Logs with Rating */}
      {activeTab === 'LOGS' && (
        <div className="space-y-3">
          {mealOrder.map((mType) => {
            const info = MEAL_TYPE_LABELS[mType];
            const data = summary.byMealType[mType];
            const hasItems = data.items.length > 0;

            return (
              <div
                key={mType}
                className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs"
              >
                {/* Meal header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-stone-900">{info.name}</span>
                    <span className="text-xs text-stone-400 font-medium">
                      {hasItems ? `${data.calories} kcal` : '0 kcal'}
                    </span>
                  </div>

                  <button
                    onClick={() => onOpenMealLogger(mType)}
                    className="text-xs font-semibold text-[#3D5140] hover:text-[#2E3E30] flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>추가</span>
                  </button>
                </div>

                {/* Items List */}
                {hasItems ? (
                  <div className="divide-y divide-stone-100">
                    {data.items.map((item) => {
                      const isExpanded = expandedLogId === item.id;
                      return (
                        <div key={item.id} className="py-2.5">
                          <div
                            onClick={() => setExpandedLogId(isExpanded ? null : item.id)}
                            className="flex items-center justify-between cursor-pointer"
                          >
                            <div>
                              <div className="text-xs font-semibold text-stone-900">
                                {item.foodNameSnapshot}
                              </div>
                              <div className="text-[11px] text-stone-400 mt-0.5">
                                {item.weightG}g · {item.calories} kcal
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Satisfaction star preview */}
                              {item.satisfactionRating ? (
                                <span className="flex items-center text-amber-500 text-[11px] font-bold gap-0.5">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  <span>{item.satisfactionRating}</span>
                                </span>
                              ) : null}

                              {item.allergenStatus === 'CONTAINS' && (
                                <span className="text-[10px] bg-rose-50 text-rose-600 font-bold px-1.5 py-0.2 rounded-sm border border-rose-200">
                                  알레르기
                                </span>
                              )}

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteFoodLog(item.id);
                                }}
                                className="text-stone-300 hover:text-rose-600 p-1 transition"
                                title="삭제"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-stone-300" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-stone-300" />
                              )}
                            </div>
                          </div>

                          {/* Expanded Nutrition & Satisfaction rating */}
                          {isExpanded && (
                            <div className="mt-2.5 p-3 bg-stone-50 rounded-xl text-xs text-stone-600 space-y-2.5">
                              <div className="flex justify-between border-b border-stone-200/60 pb-1.5">
                                <span>탄수화물: {item.carbohydrates}g</span>
                                <span>단백질: {item.protein}g</span>
                                <span>지방: {item.fat}g</span>
                              </div>

                              {/* Satisfaction Rating input (1~5 stars) */}
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] text-stone-500 font-medium">
                                  식사 만족도 평가 (취향 학습에 반영):
                                </span>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      onClick={() => onUpdateFoodLogRating(item.id, star)}
                                      className="p-0.5"
                                      aria-label={`${star}점`}
                                    >
                                      <Star
                                        className={`w-4 h-4 ${
                                          (item.satisfactionRating || 0) >= star
                                            ? 'fill-amber-400 text-amber-400'
                                            : 'text-stone-300'
                                        }`}
                                      />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-stone-300 py-3 text-center">
                    기록된 식사가 없습니다.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Quick Combos (자주 먹은 조합 빠른 재등록) */}
      {activeTab === 'COMBOS' && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs">
            <h4 className="font-bold text-xs text-stone-900 mb-1">
              반복해서 드신 식사 조합 (원클릭 재등록)
            </h4>
            <p className="text-[11px] text-stone-500">
              평소 자주 드시는 식단 세트를 한 번에 오늘 기록에 담을 수 있습니다.
            </p>
          </div>

          {quickCombos.length > 0 ? (
            quickCombos.map((combo) => (
              <div
                key={combo.id}
                className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded-sm">
                    {MEAL_TYPE_LABELS[combo.mealType].name} 조합
                  </span>
                  <h5 className="font-bold text-xs text-stone-900 mt-1">{combo.title}</h5>
                  <div className="text-[11px] text-stone-400 mt-0.5">
                    총 {combo.totalCalories} kcal · 단백질 {combo.totalProtein}g
                  </div>
                </div>

                <button
                  onClick={() => onQuickLogCombo(combo)}
                  className="px-3 py-1.5 bg-[#405443] hover:bg-[#344637] text-white text-xs font-semibold rounded-xl transition flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>오늘 담기</span>
                </button>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-stone-200/80 text-center text-xs text-stone-400">
              식사를 2회 이상 기록하시면 자주 먹은 조합이 자동으로 생성됩니다.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Taste Evolution Insights (나의 변화) */}
      {activeTab === 'TASTE' && (
        <div className="space-y-4">
          {/* Header Summary */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-stone-400">식습관 학습 프로필</span>
                <h4 className="font-bold text-base text-stone-900 mt-0.5">
                  {profile.displayName}님의 음식 취향 분석
                </h4>
              </div>
              <span className="text-xs bg-[#EEF2EE] text-[#334636] font-semibold px-2 py-0.5 rounded-full">
                {tasteProfile.tasteConfidence === 'MATURE'
                  ? '정밀 학습 완료'
                  : tasteProfile.tasteConfidence === 'ESTABLISHED'
                  ? '취향 분석 중'
                  : '기록 수집 단계'}
              </span>
            </div>

            {/* Grounded Insights Banner */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-xs text-stone-700 space-y-1.5 leading-relaxed">
              {tasteProfile.insightHighlights.map((insight, idx) => (
                <p key={idx} className="flex items-start gap-1.5">
                  <span className="text-[#4D6250] font-bold">·</span>
                  <span>{insight}</span>
                </p>
              ))}
            </div>
          </div>

          {/* Top Cooking Methods */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-2xs space-y-3">
            <h5 className="font-bold text-xs text-stone-900">선호 조리 방식 (실제 섭취 통계)</h5>
            {tasteProfile.favoriteCookingMethods.length > 0 ? (
              <div className="space-y-2">
                {tasteProfile.favoriteCookingMethods.map((m) => (
                  <div key={m.method} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-stone-800">{m.label}</span>
                      <span className="text-stone-400">{m.percentage}%</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#4D6250] h-full rounded-full transition-all duration-300"
                        style={{ width: `${m.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-300">충분한 기록 후 조리 선호도가 집계됩니다.</p>
            )}
          </div>

          {/* Top Ingredients */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-2xs space-y-3">
            <h5 className="font-bold text-xs text-stone-900">자주 찾는 식재료 TOP 5</h5>
            {tasteProfile.favoriteIngredients.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tasteProfile.favoriteIngredients.map((item, idx) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800"
                  >
                    <span className="text-[10px] text-stone-400 font-bold">#{idx + 1}</span>
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-300">기록이 누적되면 자주 섭취하는 식재료가 표시됩니다.</p>
            )}
          </div>

          {/* Reset taste history button */}
          <div className="pt-2 text-right">
            <button
              onClick={() => {
                if (window.confirm('학습된 취향 데이터를 초기화하시겠습니까?')) {
                  onResetTasteProfile();
                }
              }}
              className="text-xs text-stone-400 hover:text-stone-700 flex items-center gap-1 ml-auto transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>취향 학습 데이터 초기화</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
