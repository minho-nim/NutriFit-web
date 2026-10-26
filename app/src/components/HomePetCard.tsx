/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Compass,
  Edit2,
  Heart,
  MessageCircle,
  Plus,
  RotateCcw,
  Sparkles,
  Utensils,
  X,
  Zap,
} from 'lucide-react';
import {
  DailyNutritionSummary,
  FoodLog,
  MealType,
  PetDialogue,
  PetDialogueAction,
  PetProfile,
  UserTasteProfile,
} from '../types/nutrition';
import { PetAvatar } from './PetAvatar';
import { PetSatietyMeter } from './PetSatietyMeter';
import { usePetSatiety } from '../hooks/usePetSatiety';
import { EVOLUTION_CONFIG, getDietOutlook, getPetFormTitle, petDateKey } from '../utils/petEvolution';
import {
  DAILY_EXP_LIMIT,
  getContextualPetDialogue,
  interactWithPet,
  PERSONALITY_CONFIG,
  STAGE_CONFIG,
} from '../utils/petEngine';

interface HomePetCardProps {
  pet: PetProfile;
  summary: DailyNutritionSummary;
  tasteProfile: UserTasteProfile;
  recentLogs: FoodLog[];
  collectionCount: number;
  onOpenMealLogger: (mealType: MealType) => void;
  onNavigateToDiscover: (categoryFilter?: string) => void;
  onNavigateToCollection: (tab?: 'FOOD' | 'GROWTH') => void;
  onUpdatePetName: (newName: string) => void;
  onUpdatePetProfile?: (updatedPet: PetProfile) => void;
  onOpenChatModal?: (initialDialogue?: PetDialogue, tab?: 'CHAT' | 'GROWTH') => void;
}

export const HomePetCard: React.FC<HomePetCardProps> = ({
  pet,
  summary,
  tasteProfile,
  recentLogs,
  collectionCount,
  onOpenMealLogger,
  onNavigateToDiscover,
  onNavigateToCollection,
  onUpdatePetName,
  onUpdatePetProfile,
  onOpenChatModal,
}) => {
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>(pet.petName);
  const [, refreshDialogue] = useState(0);
  const [pettingNotice, setPettingNotice] = useState<string | null>(null);
  const satiety = usePetSatiety(pet);

  // Compute live contextual dialogue (proactive greetings, dinner/lunch prompts, warm invitations)
  const activeDialogue =
    getContextualPetDialogue({
      pet,
      summary,
      tasteProfile,
      recentLogs,
      collectionCount,
    });

  const personalityInfo = PERSONALITY_CONFIG[pet.personality || 'WARM_FRIEND'];
  const stageInfo = STAGE_CONFIG[pet.growthStage] || STAGE_CONFIG[2];
  const expProgress = Math.min(
    100,
    Math.round(((pet.experience - stageInfo.minExp) / (stageInfo.maxExp - stageInfo.minExp)) * 100)
  );
  const todayKey = petDateKey();
  const todayExp = pet.dailyExpDate === todayKey ? (pet.dailyExpGained || 0) : 0;
  const dietOutlook = getDietOutlook(pet);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onUpdatePetName(nameInput.trim());
      setIsEditingName(false);
    }
  };

  const cycleDialogue = () => {
    refreshDialogue((value) => value + 1);
  };

  const handlePetAction = () => {
    const result = interactWithPet(pet, 'PET');
    if (onUpdatePetProfile) {
      onUpdatePetProfile(result.updatedPet);
    }
    setPettingNotice(result.message);
    setTimeout(() => setPettingNotice(null), 3000);
  };

  const handleActionClick = (action: PetDialogueAction) => {
    if (action.actionType === 'RECOMMEND') {
      onNavigateToDiscover(action.categoryFilter);
    } else if (action.actionType === 'LOG_MEAL') {
      onOpenMealLogger(action.mealType || 'LUNCH');
    } else if (action.actionType === 'EXPLORE') {
      onNavigateToCollection(action.collectionTab);
    } else if (action.actionType === 'INTERACT' || action.actionType === 'CHAT_REPLY') {
      if (onOpenChatModal) {
        onOpenChatModal(activeDialogue);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-2xs relative overflow-hidden transition-all">
      {/* Decorative subtle background accents */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#EEF2EE]/40 rounded-full blur-2xl -z-10 pointer-events-none" />

      {/* Top Bar: Pet Identity, Personality & Shared Meals */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          {!isEditingName ? (
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-stone-900">{pet.petName}</span>
              <button
                onClick={() => {
                  setNameInput(pet.petName);
                  setIsEditingName(true);
                }}
                className="text-stone-400 hover:text-stone-700 p-0.5 rounded transition"
                title="이름 바꾸기"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveName} className="flex items-center gap-1">
              <input
                type="text"
                maxLength={8}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="text-xs px-2 py-0.5 border border-stone-300 rounded font-semibold w-24 focus:outline-none focus:ring-1 focus:ring-stone-400"
                autoFocus
              />
              <button
                type="submit"
                className="text-[11px] px-2 py-0.5 bg-[#435746] text-white rounded font-medium"
              >
                저장
              </button>
              <button
                type="button"
                onClick={() => setIsEditingName(false)}
                className="text-stone-400 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* Growth Stage Badge */}
          <button
            onClick={() => onOpenChatModal && onOpenChatModal(activeDialogue, 'GROWTH')}
            className="text-[11px] font-semibold text-[#324534] bg-[#EEF2EE] hover:bg-[#E4ECE5] px-2 py-0.5 rounded-full border border-stone-200/60 flex items-center gap-1 transition"
            title="성장 단계 및 성격 보기"
          >
            <Sparkles className="w-2.5 h-2.5 text-[#4A5D4E]" />
            <span>{stageInfo.name.split(':')[0]} · {getPetFormTitle(pet)}</span>
          </button>

          {/* Personality Icon */}
          <span className="text-xs hidden sm:inline" title={personalityInfo.name}>
            {personalityInfo.icon}
          </span>
        </div>

        {/* Today's Meals Counter */}
        <div className="text-[11px] font-medium text-stone-500 bg-stone-50 px-2.5 py-1 rounded-xl border border-stone-200/60 flex items-center gap-1">
          <Utensils className="w-3 h-3 text-[#435746]" />
          <span>오늘 함께한 식사 <strong className="text-stone-800 font-bold">{Object.values(summary.byMealType).filter((meal) => meal.items.length > 0).length}끼</strong></span>
        </div>
      </div>

      {/* Main Pet Visual & Dynamic Proactive Speech Bubble */}
      <div className="py-3 flex flex-col sm:flex-row items-center sm:items-start gap-3.5 sm:gap-4">
        {/* Interactive Pet Avatar */}
        <div className="shrink-0 flex flex-col items-center">
          <PetAvatar
            stage={pet.growthStage} evolutionPath={pet.evolutionPath} satiety={satiety}
            mood={activeDialogue.mood}
            size="md"
            onClick={handlePetAction}
            className="cursor-pointer"
          />
          <button
            onClick={handlePetAction}
            className="mt-1 text-[10px] text-stone-500 hover:text-stone-800 font-medium flex items-center gap-1 bg-stone-50 hover:bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200/50 transition active:scale-95"
          >
            <Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
            <span>쓰다듬기</span>
          </button>
        </div>

        {/* Speech Bubble */}
        <div className="flex-1 w-full bg-stone-50/80 p-3 sm:p-3.5 rounded-2xl border border-stone-200/70 relative">
          {/* Bubble tail pointing to pet on sm screen */}
          <div className="hidden sm:block absolute -left-2 top-6 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-stone-200/80" />
          <div className="hidden sm:block absolute -left-1.5 top-6 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-stone-50" />

          <div className="flex items-center justify-between text-[10px] text-stone-400 mb-1">
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3 text-[#435746]" />
              <span className="font-medium">밥친구 {pet.petName}의 한마디</span>
            </div>
            <button
              onClick={cycleDialogue}
              className="text-stone-400 hover:text-stone-700 p-0.5 rounded flex items-center gap-0.5 transition"
              title="다른 대화 듣기"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>새 대화</span>
            </button>
          </div>

          {/* Dialogue Message */}
          <p
            onClick={() => onOpenChatModal && onOpenChatModal(activeDialogue)}
            className="text-xs sm:text-sm text-stone-800 font-medium leading-relaxed cursor-pointer hover:text-stone-950 transition"
          >
            "{activeDialogue.message}"
          </p>

          {activeDialogue.subMessage && (
            <p className="text-[11px] text-stone-500 font-normal mt-1 leading-snug">
              {activeDialogue.subMessage}
            </p>
          )}

          {/* Action Chips Directly Inside Dialogue Bubble (Seamless Bridge to Actions) */}
          {activeDialogue.actions && activeDialogue.actions.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-stone-200/50 flex flex-wrap gap-1.5">
              {activeDialogue.actions.map((act) => (
                <button
                  key={act.id}
                  onClick={() => handleActionClick(act)}
                  className="text-[11px] font-semibold bg-white hover:bg-stone-100 active:scale-95 text-stone-800 px-2.5 py-1 rounded-xl border border-stone-200/90 shadow-2xs transition flex items-center gap-1"
                >
                  <span>{act.label}</span>
                  <ChevronRight className="w-3 h-3 text-stone-400" />
                </button>
              ))}
            </div>
          )}

          {/* Petting Notice Toast */}
          {pettingNotice && (
            <div className="mt-2 p-1.5 bg-[#EEF2EE] text-[#28382A] text-[11px] font-medium rounded-xl border border-stone-200 flex items-center gap-1 animate-in fade-in">
              <Heart className="w-3 h-3 fill-rose-500 text-rose-500 shrink-0" />
              <span>{pettingNotice}</span>
            </div>
          )}
        </div>
      </div>

      {/* Growth Progress Bar & Companion Stats */}
      <div className="bg-stone-50/60 rounded-xl p-3 border border-stone-100 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-stone-500 font-medium">
            성장 진행도 ({pet.experience} / {stageInfo.maxExp} EXP)
          </span>
          <span className="font-bold text-[#324534] tabular-nums">{expProgress}%</span>
        </div>

        <div className="w-full bg-stone-200/70 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-[#435746] h-full rounded-full transition-all duration-500"
            style={{ width: `${expProgress}%` }}
          />
        </div>
        <div className="text-[10px] text-stone-500 text-right">
          오늘 성장 {todayExp}/{DAILY_EXP_LIMIT} EXP · 쓰다듬기 보상은 하루 1회
        </div>
        <div className="text-[11px] text-stone-600 flex flex-wrap items-center justify-between gap-1">
          <span>{getPetFormTitle(pet)}</span>
          <span>{pet.growthStage === 4 ? '성장 도감에 모습을 남겼어요' : dietOutlook.mealCount ? `다음 방향 · ${EVOLUTION_CONFIG[dietOutlook.path].name}` : '오늘 식사로 성장 방향을 알아봐요'}</span>
        </div>

        {/* Sub-Metrics: 친밀도, 탐험도, 취향 이해도 */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center text-[10px] text-stone-600">
          <div className="bg-white/80 py-1 px-1.5 rounded-lg border border-stone-200/60">
            <span className="text-stone-400 block">친밀도</span>
            <strong className="font-bold text-stone-900 tabular-nums">{pet.affection ?? 0}%</strong>
          </div>
          <div className="bg-white/80 py-1 px-1.5 rounded-lg border border-stone-200/60">
            <span className="text-stone-400 block">탐험도</span>
            <strong className="font-bold text-stone-900 tabular-nums">{pet.explorationProgress ?? 0}%</strong>
          </div>
          <div className="bg-white/80 py-1 px-1.5 rounded-lg border border-stone-200/60">
            <span className="text-stone-400 block">취향 이해도</span>
            <strong className="font-bold text-stone-900 tabular-nums">{pet.tasteUnderstanding ?? 0}%</strong>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="mt-3"><PetSatietyMeter value={satiety} /></div>
      <div className="grid grid-cols-3 gap-2 pt-3">
        {/* Action 1: 식사 기록하기 */}
        <button
          onClick={() => onOpenMealLogger('LUNCH')}
          className="py-2 px-2 bg-[#435746] hover:bg-[#344637] active:scale-[0.98] text-white rounded-xl text-xs font-semibold shadow-2xs transition flex items-center justify-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>식사 기록</span>
        </button>

        {/* Action 2: 밥친구와 대화 */}
        <button
          onClick={() => onOpenChatModal && onOpenChatModal(activeDialogue)}
          className="py-2 px-2 bg-stone-900 hover:bg-stone-800 active:scale-[0.98] text-white rounded-xl text-xs font-semibold shadow-2xs transition flex items-center justify-center gap-1"
        >
          <MessageCircle className="w-3.5 h-3.5 text-amber-300" />
          <span>밥친구 대화</span>
        </button>

        {/* Action 3: 음식 도감 바로가기 */}
        <button
          onClick={() => onNavigateToCollection('FOOD')}
          className="py-2 px-2 bg-stone-100 hover:bg-stone-200/80 active:scale-[0.98] text-stone-700 rounded-xl text-xs font-semibold border border-stone-200 transition flex items-center justify-center gap-1"
        >
          <BookOpen className="w-3.5 h-3.5 text-stone-500" />
          <span>음식 도감</span>
        </button>
      </div>
    </div>
  );
};
