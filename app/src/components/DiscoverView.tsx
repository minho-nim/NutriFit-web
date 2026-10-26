/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  Check,
  ChevronDown,
  Clock,
  Compass,
  Heart,
  MessageCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  Utensils,
  X,
} from 'lucide-react';
import {
  DailyNutritionSummary,
  FeedbackReaction,
  FoodLog,
  MealRecommendation,
  MealType,
  PetProfile,
  RecommendationFeedback,
  UserAllergyConfig,
  UserGoal,
  UserProfile,
  UserTasteProfile,
} from '../types/nutrition';
import { MEAL_TYPE_LABELS } from '../utils/nutritionEngine';
import { recommendationLog } from '../utils/mealFlow';
import { normalizeFoodName } from '../utils/petEngine';
import { usePetSatiety } from '../hooks/usePetSatiety';
import { generateCuratedRecommendations } from '../utils/tasteEngine';
import { PetAvatar } from './PetAvatar';

interface DiscoverViewProps {
  pet: PetProfile;
  profile: UserProfile;
  goal: UserGoal;
  summary: DailyNutritionSummary;
  tasteProfile: UserTasteProfile;
  foodLogs: FoodLog[];
  userAllergies: UserAllergyConfig[];
  selectedDate: string;
  feedbacks: RecommendationFeedback[];
  categoryFilter?: string;
  onClearCategoryFilter: () => void;
  onAddRecommendationToLog: (log: Omit<FoodLog, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onRecordFeedback: (feedback: RecommendationFeedback) => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  pet,
  profile,
  goal,
  summary,
  tasteProfile,
  foodLogs,
  userAllergies,
  selectedDate,
  feedbacks,
  categoryFilter,
  onClearCategoryFilter,
  onAddRecommendationToLog,
  onRecordFeedback,
}) => {
  const [selectedMealType, setSelectedMealType] = useState<MealType>('LUNCH');
  const [exploreNovelty, setExploreNovelty] = useState<boolean>(false);
  const [dislikingRecId, setDislikingRecId] = useState<string | null>(null);
  const [alternativeReplacements, setAlternativeReplacements] = useState<Record<string, MealRecommendation>>({});
  const satiety = usePetSatiety(pet);

  // Generate taste-aware recommendations (2~3 dishes)
  const baseRecommendations = generateCuratedRecommendations({
    profile,
    goal,
    summary,
    tasteProfile,
    recentLogs: foodLogs,
    userAllergies,
    mealType: selectedMealType,
    feedbacks,
    exploreNovelty,
    categoryFilter,
  });

  // Handle dynamic Pet Recommendation Dialogues
  const getPetRecommendationSpeech = (): string => {
    const personality = pet.personality || 'WARM_FRIEND';

    if (categoryFilter === '국물') {
      return `따뜻한 국밥이나 맑은 국물 요리로 몸도 녹이고 속도 편안하게 채워보자!`;
    }
    if (categoryFilter === '고단백') {
      return `단백질을 꽉 채워줄 고단백 맞춤 식단을 엄선했어! 근육과 에너지를 챙겨보자!`;
    }
    if (categoryFilter === '샐러드' || categoryFilter === '가벼운식단') {
      return `속이 편안하고 산뜻한 신선 샐러드와 가벼운 건강 식단이야!`;
    }

    if (personality === 'WARM_FRIEND') {
      return `오늘도 수고 많았어! 너의 몸이 편안하고 기분 좋게 챙겨 먹을 수 있는 최적의 식단이야.`;
    }
    if (personality === 'CURIOUS_EXPLORER') {
      return `새로운 미식의 즐거움을 느껴봐! 너의 취향과 영양을 채워줄 매력적인 메뉴들을 골라봤어.`;
    }
    if (personality === 'GOURMET_CHEF') {
      return `조리법과 식재료의 조화, 단백질과 칼로리 밸런스를 고려한 정교한 미식 레시피야.`;
    }
    if (personality === 'CHEERFUL_VITAMIN') {
      return `에너지 팍팍! 활력 넘치는 하루를 만들어줄 꿀맛 메뉴들을 픽해봤어!`;
    }

    if (tasteProfile.totalLogsAnalyzed < 3) {
      return `아직 너의 취향을 알아가는 중이야! 영양 목표와 남은 에너지를 고려해서 균형 잡힌 메뉴를 골라봤어.`;
    }

    if (exploreNovelty) {
      return `평소 자주 먹던 식재료와는 조금 다른 새로운 맛과 영양을 채울 수 있는 특별 메뉴를 준비했어!`;
    }

    if (summary.remainingProtein > 20) {
      return `오늘 단백질 목표를 채우기 딱 좋은 든든한 고단백 메뉴를 골라봤어. 마음에 드는 걸 골라봐!`;
    }

    const topMethod = tasteProfile.favoriteCookingMethods[0];
    if (topMethod) {
      return `네가 좋아하는 [${topMethod.label}] 조리법과 단골 식재료를 바탕으로 딱 맞는 든든한 한 끼를 추천할게.`;
    }

    return `오늘 하루 목표에 딱 맞는 최적의 균형 메뉴를 골라봤어. 나와 함께 맛있게 먹어볼까?`;
  };

  // 1. Action: 마음에 들어 (INTERESTED)
  const handleInterested = (rec: MealRecommendation) => {
    onRecordFeedback({
      id: `fb-${Date.now()}`,
      recommendationId: rec.id,
      menuName: rec.menuName,
      reaction: 'INTERESTED',
      createdAt: new Date().toISOString(),
    });
  };

  // 2. Action: 다른 메뉴 추천 (Alternative switch)
  const handleRequestAlternative = (rec: MealRecommendation) => {
    setAlternativeReplacements((prev) => {
      const next = { ...prev };
      if (next[rec.id]) delete next[rec.id];
      else if (rec.alternativeMenu) next[rec.id] = rec.alternativeMenu;
      return next;
    });
  };

  // 3. Action: 먹어볼게 (EATEN / Direct Log)
  const handleEaten = (rec: MealRecommendation) => {
    const name = rec.menuName;
    onAddRecommendationToLog(recommendationLog(rec, profile.id, selectedDate, pet.petName));

    onRecordFeedback({
      id: `fb-${Date.now()}`,
      recommendationId: rec.id,
      menuName: name,
      reaction: 'EATEN',
      createdAt: new Date().toISOString(),
    });
  };

  // 4. Action: 별로야 (DISLIKED) with reason
  const handleDislikeConfirm = (rec: MealRecommendation, reason: string) => {
    onRecordFeedback({
      id: `fb-${Date.now()}`,
      recommendationId: rec.id,
      menuName: rec.menuName,
      reaction: 'DISLIKED',
      dislikeReason: reason,
      createdAt: new Date().toISOString(),
    });
    setDislikingRecId(null);
    setAlternativeReplacements((prev) => Object.fromEntries(Object.entries(prev).filter(([, item]) => item.menuName !== rec.menuName)));
  };

  const isBookmarked = (menuName: string) =>
    feedbacks.some((f) => f.menuName === menuName && f.reaction === 'INTERESTED');

  const isEatenToday = (menuName: string) =>
    foodLogs.some(
      (l) => l.consumedDate === selectedDate && normalizeFoodName(l.foodNameSnapshot) === normalizeFoodName(menuName) && l.mealType === selectedMealType
    );

  const dislikeOptions = [
    '재료나 맛이 취향이 아니에요',
    '기름지거나 부담스러워요',
    '최근에 너무 자주 먹었어요',
    '조리하기 번거롭거나 비용이 부담돼요',
    '기타 사유',
  ];

  return (
    <div className="space-y-4 pb-20">
      {/* 1. Pet-Driven Recommendation Header Banner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-2xs space-y-3">
        <div className="flex items-center gap-3">
          <PetAvatar stage={pet.growthStage} evolutionPath={pet.evolutionPath} satiety={satiety} mood={satiety >= 95 ? 'SLEEPY' : 'HAPPY'} size="sm" />
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#435746] bg-[#EEF2EE] px-2 py-0.5 rounded-full">
                밥친구 {pet.petName}의 식단 추천
              </span>
              <span className="text-[11px] text-stone-400">
                취향 이해도 {pet.tasteUnderstanding}%
              </span>
            </div>
            <p className="text-xs text-stone-700 font-medium mt-1 leading-relaxed">
              "{getPetRecommendationSpeech()}"
            </p>
          </div>
        </div>

        {/* Meal Type Switcher & Novelty Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as MealType[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setSelectedMealType(m);
                  setAlternativeReplacements({});
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition shrink-0 ${
                  selectedMealType === m
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                {MEAL_TYPE_LABELS[m].name}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setExploreNovelty(!exploreNovelty);
              setAlternativeReplacements({});
            }}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1 transition shrink-0 ${
              exploreNovelty
                ? 'bg-[#EEF2EE] text-[#334636] border-[#334636]/30 font-bold'
                : 'text-stone-500 border-stone-200 hover:bg-stone-50'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>새로운 메뉴 탐험</span>
          </button>
        </div>
      </div>

      {/* 2. Curated Recommendations Cards (2~3 dishes) */}
      {categoryFilter && <button type="button" onClick={onClearCategoryFilter} className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-600">{categoryFilter} 분류 해제 <X className="h-3 w-3" /></button>}
      <div className="space-y-3">
        {baseRecommendations.length === 0 && <p className="rounded-xl bg-white p-4 text-sm text-stone-600">현재 분류와 알레르기·선호 조건에 맞는 메뉴가 없어요. 다른 분류나 끼니를 선택해 주세요.</p>}
        {baseRecommendations.map((baseRec) => {
          const rec = alternativeReplacements[baseRec.id] || baseRec;
          const isAlternativeActive = Boolean(alternativeReplacements[baseRec.id]);
          const currentMenuName = rec.menuName;
          const currentCalories = rec.estimatedCalories;
          const currentProtein = rec.protein;

          const bookmarked = isBookmarked(currentMenuName);
          const eaten = isEatenToday(currentMenuName);

          return (
            <div
              key={baseRec.id}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-2xs space-y-3.5 transition-all"
            >
              {/* Card Header: Tags, Menu Name, Calories */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-stone-600 bg-stone-100 px-1.5 py-0.2 rounded-sm">
                      {rec.category}
                    </span>

                    {/* Allergen verification status */}
                    <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded-sm font-semibold flex items-center gap-0.5 border border-emerald-200/60">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      {rec.allergenStatus === 'NOT_CHECKED' ? '활성 알레르기 설정 없음' : '등록 알레르기 성분 불일치'}
                    </span>

                    {isAlternativeActive && (
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded-sm border border-blue-200">
                        대체 추천 메뉴
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-base text-stone-900 mt-1">
                    {currentMenuName}
                  </h4>
                </div>

                <div className="text-right">
                  <span className="font-bold text-base text-stone-900 tabular-nums">
                    {currentCalories} kcal
                  </span>
                  <div className="text-[11px] text-stone-400">
                    단백질 <strong className="text-stone-700">{currentProtein}g</strong> · 탄 {rec.carbohydrates}g · 지 {rec.fat}g
                  </div>
                </div>
              </div>

              {/* Grounded Recommendation Reason */}
              <div className="p-3 bg-stone-50/80 rounded-xl border border-stone-100 space-y-1">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-[#435746]">
                  <Sparkles className="w-3 h-3" />
                  <span>추천 이유</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {rec.recommendationReason}
                </p>
                {rec.learnedTasteReason && (
                  <div className="text-[11px] text-stone-400">
                    💡 {rec.learnedTasteReason}
                  </div>
                )}
              </div>

              {/* 4 Feedback & Interaction Actions (Prompt Requirement) */}
              <div className="pt-1 border-t border-stone-100 flex flex-wrap items-center justify-between gap-1.5">
                {/* 1. 마음에 들어 */}
                <button
                  onClick={() => handleInterested(rec)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
                    bookmarked
                      ? 'bg-rose-50 text-rose-600 border border-rose-200 font-bold'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200'
                  }`}
                  title="관심 메뉴로 저장"
                >
                  <Heart className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
                  <span>{bookmarked ? '마음에 들어요' : '마음에 들어'}</span>
                </button>

                {/* 2. 다른 메뉴 추천 (Alternative Request) */}
                {baseRec.alternativeMenu && (
                  <button
                    onClick={() => handleRequestAlternative(baseRec)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200 transition flex items-center gap-1"
                    title="대체 메뉴로 바꾸기"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
                    <span>{isAlternativeActive ? '원래 메뉴 보기' : '다른 메뉴 추천'}</span>
                  </button>
                )}

                {/* 3. 별로야 (Dislike with optional reason) */}
                <button
                  onClick={() => setDislikingRecId(rec.id)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-50 hover:bg-stone-100 text-stone-500 hover:text-stone-800 border border-stone-200 transition flex items-center gap-1"
                  title="비선호 피드백"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>별로야</span>
                </button>

                {/* 4. 먹어볼게 (Log directly) */}
                <button
                  disabled={eaten}
                  onClick={() => handleEaten(rec)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95 shadow-2xs ${
                    eaten
                      ? 'bg-emerald-700 text-white opacity-70 cursor-default'
                      : 'bg-[#435746] hover:bg-[#344637] text-white'
                  }`}
                >
                  {eaten ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{eaten ? '기록 완료' : '먹었어요 · 기록'}</span>
                </button>
              </div>

              {/* Optional Dislike Reason Popover */}
              {dislikingRecId === rec.id && (
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                    <span>어떤 점이 별로였나요? ({pet.petName}의 다음 추천에 반영돼요)</span>
                    <button
                      onClick={() => setDislikingRecId(null)}
                      className="text-stone-400 hover:text-stone-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {dislikeOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleDislikeConfirm(rec, opt)}
                        className="text-left text-xs p-2 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 transition"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
