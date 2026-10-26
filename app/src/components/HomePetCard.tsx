import React, { useState } from 'react';
import { BookOpen, ChevronRight, Heart, MessageCircle, Pencil, Plus, Sparkles } from 'lucide-react';
import type { DailyNutritionSummary, FoodLog, MealType, PetDialogue, PetProfile, UserTasteProfile } from '../types/nutrition';
import { PetAvatar } from './PetAvatar';
import { PetSatietyMeter } from './PetSatietyMeter';
import { PetPlayModal } from './PetPlayModal';
import { usePetSatiety } from '../hooks/usePetSatiety';
import { companionBehavior, completeDailyPlay, hasPlayedToday } from '../utils/petCompanion';
import { DAILY_EXP_LIMIT, getContextualPetDialogue, interactWithPet, STAGE_CONFIG } from '../utils/petEngine';
import { getPetFormTitle, petDateKey } from '../utils/petEvolution';
import { mealTypeForText } from '../utils/mealFlow';

interface HomePetCardProps {
  pet: PetProfile; summary: DailyNutritionSummary; tasteProfile: UserTasteProfile; recentLogs: FoodLog[]; collectionCount: number;
  onOpenMealLogger: (meal: MealType) => void;
  onNavigateToDiscover: (filter?: string) => void;
  onNavigateToCollection: (tab?: 'FOOD' | 'GROWTH') => void;
  onUpdatePetName: (name: string) => void;
  onUpdatePetProfile?: (pet: PetProfile) => void;
  onOpenChatModal?: (dialogue?: PetDialogue, tab?: 'CHAT' | 'GROWTH' | 'MEMORIES') => void;
}
export const HomePetCard: React.FC<HomePetCardProps> = ({ pet, summary, tasteProfile, recentLogs, collectionCount, onOpenMealLogger, onNavigateToCollection, onUpdatePetName, onUpdatePetProfile, onOpenChatModal }) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(pet.petName);
  const [notice, setNotice] = useState('');
  const [playing, setPlaying] = useState(false);
  const satiety = usePetSatiety(pet);
  const behavior = companionBehavior(pet, recentLogs);
  const dialogue = getContextualPetDialogue({ pet, summary, tasteProfile, recentLogs, collectionCount });
  const stage = STAGE_CONFIG[pet.growthStage];
  const progress = Math.min(100, Math.max(0, (pet.experience - stage.minExp) / (stage.maxExp - stage.minExp) * 100));
  const todayExp = pet.dailyExpDate === petDateKey() ? pet.dailyExpGained || 0 : 0;
  const petting = () => {
    const result = interactWithPet(pet, 'PET');
    onUpdatePetProfile?.(result.updatedPet);
    setNotice(result.message);
  };
  return <section className="overflow-hidden rounded-[28px] bg-white p-5 shadow-[0_4px_24px_#192e4d05] sm:p-6" aria-label="나의 밥친구">
    <div className="flex items-center justify-between gap-2">
      {editing ? <form className="flex items-center gap-2" onSubmit={(event) => { event.preventDefault(); if (name.trim()) { onUpdatePetName(name.trim()); setEditing(false); } }}>
        <input aria-label="밥친구 이름" autoFocus maxLength={8} value={name} onChange={(event) => setName(event.target.value)} className="w-24 rounded-xl border p-2 text-base" />
        <button className="text-sm font-bold text-blue-600" type="submit">저장</button><button type="button" onClick={() => setEditing(false)} className="text-sm text-stone-500">취소</button>
      </form> : <button onClick={() => { setName(pet.petName); setEditing(true); }} className="flex min-h-11 items-center gap-2 text-lg font-bold" aria-label={`${pet.petName} 이름 바꾸기`}>{pet.petName}<Pencil size={13} className="text-stone-400" /></button>}
      <button onClick={() => onNavigateToCollection('FOOD')} className="flex min-h-11 items-center gap-1 text-sm font-medium text-stone-500"><BookOpen size={16} /> 도감 <ChevronRight size={14} /></button>
    </div>
    <div className="my-3 flex items-center gap-3">
      <div className={`pet-motion-${behavior.motion} shrink-0`}>
        <PetAvatar stage={pet.growthStage} evolutionPath={pet.evolutionPath} satiety={satiety} mood={behavior.mood} size="lg" onClick={petting} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-2 text-xs font-semibold text-blue-500">{behavior.label}</p>
        <p className="text-base font-semibold leading-relaxed text-stone-800">{dialogue.message}</p>
        <p className="mt-2 text-xs leading-relaxed text-stone-400">{behavior.message}</p>
      </div>
    </div>
    <div className="mb-4 flex items-center justify-between gap-2">
      <button onClick={petting} className="flex min-h-11 items-center gap-1.5 rounded-full bg-rose-50 px-3 text-sm font-semibold text-rose-500"><Heart size={15} /> 쓰다듬기</button>
      <button onClick={() => onOpenChatModal?.(dialogue, 'GROWTH')} className="flex min-h-11 items-center gap-1 text-sm text-stone-500">{getPetFormTitle(pet)} <ChevronRight size={15} /></button>
    </div>
    {notice && <p role="status" className="mb-4 rounded-2xl bg-blue-50 p-3 text-sm leading-relaxed text-blue-700">{notice}</p>}
    <button onClick={() => onOpenMealLogger(mealTypeForText(''))} className="primary-action w-full"><Plus size={20} /> 식사 기록하기</button>
    <div className="mt-3 grid grid-cols-3 gap-2">
      <button className="secondary-action" onClick={() => onOpenChatModal?.(dialogue, 'CHAT')}><MessageCircle size={17} /> 대화</button>
      <button className="secondary-action" onClick={() => setPlaying(true)}><span aria-hidden="true">🎾</span> {hasPlayedToday(pet) ? '오늘 놀았어' : '같이 놀기'}</button>
      <button className="secondary-action" onClick={() => onOpenChatModal?.(dialogue, 'MEMORIES')}><Heart size={17} /> 우리 추억</button>
    </div>
    <details className="mt-5 border-t border-stone-100 pt-1">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm text-stone-500"><span className="flex items-center gap-1.5"><Sparkles size={15} /> 오늘 함께 자라는 중</span><span>{todayExp}/{DAILY_EXP_LIMIT} EXP · 자세히</span></summary>
      <div className="space-y-3 pb-1 pt-2">
        <div className="h-1.5 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-blue-400" style={{ width: `${progress}%` }} /></div>
        <p className="text-xs text-stone-400">성장 {pet.experience}/{stage.maxExp} EXP · 친밀도 {pet.affection}%</p>
        <PetSatietyMeter value={satiety} />
      </div>
    </details>
    {playing && <PetPlayModal pet={pet} onClose={() => setPlaying(false)} onComplete={() => { onUpdatePetProfile?.(completeDailyPlay(pet)); setNotice('함께 공놀이한 하루를 기억할게. 내일 또 놀자!'); }} />}
  </section>;
};
