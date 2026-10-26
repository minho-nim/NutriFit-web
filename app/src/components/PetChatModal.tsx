/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  Check,
  ChevronRight,
  Compass,
  Heart,
  MessageCircle,
  Plus,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Utensils,
  X,
  Zap,
} from 'lucide-react';
import {
  DailyNutritionSummary,
  FoodCollectionItem,
  FoodLog,
  MealType,
  PetDialogue,
  PetMood,
  PetPersonality,
  PetProfile,
  UserGoal,
  UserProfile,
  UserTasteProfile,
} from '../types/nutrition';
import { PetAvatar } from './PetAvatar';
import { PetGrowthCollection } from './PetGrowthCollection';
import { PetSatietyMeter } from './PetSatietyMeter';
import { usePetSatiety } from '../hooks/usePetSatiety';
import { mealTypeForText } from '../utils/mealFlow';
import { getPetFormTitle } from '../utils/petEvolution';
import {
  getPetChatResponse,
  interactWithPet,
  PERSONALITY_CONFIG,
  STAGE_CONFIG,
} from '../utils/petEngine';

interface ChatMessage {
  id: string;
  sender: 'PET' | 'USER';
  text: string;
  subText?: string;
  mood?: PetMood;
  suggestedAction?: {
    type: 'RECOMMEND' | 'LOG_MEAL' | 'EXPLORE' | 'FILTER';
    param?: string;
  };
  timestamp: string;
}

interface PetChatModalProps {
  pet: PetProfile;
  summary: DailyNutritionSummary;
  profile: UserProfile;
  goal: UserGoal;
  tasteProfile: UserTasteProfile;
  foodLogs: FoodLog[];
  collectionCount: number;
  initialDialogue?: PetDialogue;
  initialTab?: 'CHAT' | 'GROWTH';
  onUpdatePet: (updatedPet: PetProfile) => void;
  onOpenMealLogger: (mealType: MealType) => void;
  onNavigateToDiscover: (filter?: string) => void;
  onNavigateToCollection: (tab?: 'FOOD' | 'GROWTH') => void;
  onClose: () => void;
}

export const PetChatModal: React.FC<PetChatModalProps> = ({
  pet,
  summary,
  profile,
  goal,
  tasteProfile,
  foodLogs,
  collectionCount,
  initialDialogue,
  initialTab = 'CHAT',
  onUpdatePet,
  onOpenMealLogger,
  onNavigateToDiscover,
  onNavigateToCollection,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'CHAT' | 'GROWTH'>(initialTab);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [currentMood, setCurrentMood] = useState<PetMood>(initialDialogue?.mood || 'HAPPY');
  const [pettingFeedback, setPettingFeedback] = useState<string | null>(null);
  const satiety = usePetSatiety(pet);

  // Initial greeting message from pet
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init-1',
      sender: 'PET',
      text:
        initialDialogue?.message ||
        `안녕, ${profile.displayName}! 오늘 어떤 맛있는 식사를 함께할까? 편하게 말해줘!`,
      subText: initialDialogue?.subMessage,
      mood: initialDialogue?.mood || 'HAPPY',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const personalityInfo = PERSONALITY_CONFIG[pet.personality || 'WARM_FRIEND'];
  const stageInfo = STAGE_CONFIG[pet.growthStage] || STAGE_CONFIG[2];
  const expProgress = Math.min(
    100,
    Math.round(((pet.experience - stageInfo.minExp) / (stageInfo.maxExp - stageInfo.minExp)) * 100)
  );

  // Quick conversation prompt chips
  const quickChips = [
    { label: '🍲 따뜻한 국물 요리 추천해줘', query: '따뜻한 국밥이나 국물 요리 추천해줘' },
    { label: '✨ 새로운 음식 탐험할래', query: '새로운 음식 도감 탐험하고 싶어' },
    { label: '💪 든든한 고단백 식단 골라줘', query: '단백질 가득한 고단백 식단 추천해줘' },
    { label: '🥗 가볍고 속 편한 메뉴 어때?', query: '속 편하고 가벼운 샐러드나 부드러운 메뉴' },
    { label: '✍️ 방금 먹은 식사 기록할게', query: '방금 식사 먹었어 기록할래' },
  ];

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    // 1. Add User Message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'USER',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');

    // 2. Generate Pet Response with intelligent context
    setTimeout(() => {
      const response = getPetChatResponse(text, {
        pet,
        summary,
        tasteProfile,
        collectionCount,
      });

      setCurrentMood(response.mood);

      const petMsg: ChatMessage = {
        id: `pet-${Date.now()}`,
        sender: 'PET',
        text: response.reply,
        mood: response.mood,
        suggestedAction: response.suggestedAction,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, petMsg]);
    }, 350);
  };

  const handlePetAction = () => {
    const result = interactWithPet(pet, 'PET');
    onUpdatePet(result.updatedPet);
    setCurrentMood(result.mood);
    setPettingFeedback(result.message);
    setTimeout(() => setPettingFeedback(null), 3000);
  };

  const handleSelectPersonality = (pKey: PetPersonality) => {
    const updated: PetProfile = {
      ...pet,
      personality: pKey,
      updatedAt: new Date().toISOString(),
    };
    onUpdatePet(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-stone-200/90 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-3">
            <PetAvatar
              stage={pet.growthStage} evolutionPath={pet.evolutionPath} satiety={satiety}
              mood={satiety >= 95 ? 'SLEEPY' : currentMood}
              size="sm"
              onClick={handlePetAction}
              className="cursor-pointer"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-stone-900 tracking-tight">
                  밥친구 {pet.petName}
                </h3>
                <span className="text-[11px] font-semibold text-[#324534] bg-[#EEF2EE] px-2 py-0.5 rounded-full border border-stone-200/60">
                  {personalityInfo.icon} {personalityInfo.name}
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                {stageInfo.name.split(':')[0]} · {getPetFormTitle(pet)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-100 bg-white px-4 pt-1">
          <button
            onClick={() => setActiveTab('CHAT')}
            className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'CHAT'
                ? 'border-[#435746] text-[#324534]'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>밥친구와 대화</span>
          </button>
          <button
            onClick={() => setActiveTab('GROWTH')}
            className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition ${
              activeTab === 'GROWTH'
                ? 'border-[#435746] text-[#324534]'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>성장 단계 & 성격 ({pet.experience} EXP)</span>
          </button>
        </div>

        {/* TAB 1: Chat Stream */}
        {activeTab === 'CHAT' && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#FAF9F6]">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {/* Petting Feedback Toast */}
              {pettingFeedback && (
                <div className="bg-[#EEF2EE] text-[#2F4231] text-xs font-semibold py-1.5 px-3 rounded-full border border-stone-200 text-center animate-in fade-in flex items-center justify-center gap-1.5 mx-auto max-w-xs shadow-2xs">
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  <span>{pettingFeedback}</span>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${
                    msg.sender === 'USER' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.sender === 'PET' && (
                    <div className="shrink-0 pt-0.5">
                      <PetAvatar stage={pet.growthStage} evolutionPath={pet.evolutionPath} mood={msg.mood || 'HAPPY'} size="sm" />
                    </div>
                  )}

                  <div className={`max-w-[82%] space-y-1.5`}>
                    <div
                      className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                        msg.sender === 'USER'
                          ? 'bg-[#435746] text-white rounded-tr-xs'
                          : 'bg-white text-stone-800 border border-stone-200/80 rounded-tl-xs'
                      }`}
                    >
                      <p className="font-medium whitespace-pre-wrap">{msg.text}</p>
                      {msg.subText && (
                        <p className="text-[11px] text-stone-500 mt-1 pt-1 border-t border-stone-100">
                          {msg.subText}
                        </p>
                      )}
                    </div>

                    {/* Action buttons suggested by Pet */}
                    {msg.suggestedAction && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.suggestedAction.type === 'RECOMMEND' && (
                          <button
                            onClick={() => {
                              onNavigateToDiscover(msg.suggestedAction?.param);
                              onClose();
                            }}
                            className="bg-[#435746] hover:bg-[#344637] text-white text-[11px] font-semibold px-2.5 py-1 rounded-xl shadow-2xs flex items-center gap-1 transition"
                          >
                            <Compass className="w-3 h-3" />
                            <span>추천 메뉴 바로보기</span>
                          </button>
                        )}
                        {msg.suggestedAction.type === 'LOG_MEAL' && (
                          <button
                            onClick={() => {
                              onOpenMealLogger(mealTypeForText(msg.text));
                              onClose();
                            }}
                            className="bg-stone-900 hover:bg-stone-800 text-white text-[11px] font-semibold px-2.5 py-1 rounded-xl shadow-2xs flex items-center gap-1 transition"
                          >
                            <Plus className="w-3 h-3" />
                            <span>식사 기록 열기</span>
                          </button>
                        )}
                        {msg.suggestedAction.type === 'EXPLORE' && (
                          <button
                            onClick={() => {
                              onNavigateToCollection();
                              onClose();
                            }}
                            className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-semibold px-2.5 py-1 rounded-xl border border-stone-200 flex items-center gap-1 transition"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>음식 도감 열기</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Reply Chips */}
            <div className="bg-white border-t border-stone-100 p-2.5 overflow-x-auto flex gap-1.5 no-scrollbar">
              {quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip.query)}
                  className="shrink-0 text-[11px] font-medium bg-stone-50 hover:bg-stone-100 active:scale-95 text-stone-700 px-2.5 py-1 rounded-full border border-stone-200 transition"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="bg-white border-t border-stone-100 p-3 flex items-center gap-2"
            >
              <button
                type="button"
                onClick={handlePetAction}
                title="보리 쓰다듬기"
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition"
              >
                <Heart className="w-4 h-4 fill-rose-500" />
              </button>

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="밥친구에게 편하게 물어보세요 (예: 오늘 점심 뭐 먹지?)"
                className="flex-1 text-xs sm:text-sm px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-stone-400 font-medium placeholder:text-stone-400"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="bg-[#435746] hover:bg-[#344637] disabled:opacity-40 text-white p-2 rounded-xl transition shadow-2xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: Growth Stages & Personality */}
        {activeTab === 'GROWTH' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 bg-[#FAF9F6]">
            {/* Pet Status Summary Card */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <PetAvatar
                    stage={pet.growthStage} evolutionPath={pet.evolutionPath} satiety={satiety}
                    mood="HAPPY"
                    size="md"
                    onClick={handlePetAction}
                    className="cursor-pointer"
                  />
                  <div>
                    <h4 className="font-bold text-base text-stone-900 tracking-tight">
                      {pet.petName}의 성장 다이어리
                    </h4>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {stageInfo.name} · 총 {pet.totalMealsShared}끼 함께 식사함
                    </p>
                  </div>
                </div>

                <button
                  onClick={handlePetAction}
                  className="bg-[#EEF2EE] hover:bg-[#E3EAE4] text-[#324534] px-3 py-1.5 rounded-xl text-xs font-semibold border border-stone-200 transition flex items-center gap-1 active:scale-95"
                >
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                  <span>쓰다듬기 (+친밀도)</span>
                </button>
              </div>

              {/* EXP Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-500 font-medium">
                    {getPetFormTitle(pet)} ({pet.experience} / {stageInfo.maxExp} EXP)
                  </span>
                  <span className="font-bold text-[#324534] tabular-nums">{expProgress}%</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#435746] h-full rounded-full transition-all duration-500"
                    style={{ width: `${expProgress}%` }}
                  />
                </div>
              </div>

              <PetSatietyMeter value={satiety} />
              {/* No Guilt Guarantee Banner */}
              <div className="bg-stone-50 rounded-xl p-2.5 border border-stone-200/60 flex items-start gap-2 text-stone-600 text-xs">
                <ShieldCheck className="w-4 h-4 text-[#435746] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>안심 약속:</strong> 식사량이나 칼로리 제한은 성장에 영향을 주지 않으며,
                  식사를 거르거나 접속이 늦어져도 밥친구가 아프거나 굶주리지 않습니다.
                </p>
              </div>
            </div>

            <PetGrowthCollection pet={pet} onUpdatePet={onUpdatePet} />

            {/* Personality Selector */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h4 className="font-bold text-xs text-stone-500 uppercase tracking-wider">
                  밥친구 성격 선택
                </h4>
                <span className="text-[11px] text-stone-400">대화 스타일과 메뉴 추천 톤이 달라져요</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(
                  [
                    'WARM_FRIEND',
                    'CURIOUS_EXPLORER',
                    'GOURMET_CHEF',
                    'CHEERFUL_VITAMIN',
                  ] as PetPersonality[]
                ).map((pKey) => {
                  const pConf = PERSONALITY_CONFIG[pKey];
                  const isSelected = (pet.personality || 'WARM_FRIEND') === pKey;

                  return (
                    <button
                      key={pKey}
                      type="button"
                      onClick={() => handleSelectPersonality(pKey)}
                      className={`text-left p-3 rounded-2xl border transition active:scale-[0.99] ${
                        isSelected
                          ? 'bg-[#EEF2EE] border-[#435746] shadow-2xs ring-1 ring-[#435746]'
                          : 'bg-white hover:bg-stone-50 border-stone-200/80 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                          <span>{pConf.icon}</span>
                          <span>{pConf.name}</span>
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-[#435746]" />}
                      </div>
                      <p className="text-[11px] text-stone-500 leading-snug">
                        {pConf.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
