import React from 'react';
import { LockKeyhole, Sparkles } from 'lucide-react';
import { PetProfile } from '../types/nutrition';
import { EVOLUTION_CONFIG, EVOLUTION_PATHS, getDietOutlook, normalizePetEvolution, petFormKey, TOTAL_PET_FORMS } from '../utils/petEvolution';
import { plentifulMealCount } from '../utils/petSatiety';
import { PetAvatar } from './PetAvatar';
import { startNewPetGeneration } from '../utils/petEngine';

export function PetGrowthCollection({ pet, onUpdatePet }: { pet: PetProfile; onUpdatePet?: (pet: PetProfile) => void }) {
  const normalized = normalizePetEvolution(pet);
  const unlocked = new Set(normalized.unlockedForms);
  const outlook = getDietOutlook(normalized);
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-stone-900"><Sparkles className="w-4 h-4 text-[#435746]" />성장 도감</h3>
          <p className="mt-1 text-xs text-stone-500 leading-relaxed">실제로 진화한 모습만 공개돼요. 다른 계열의 같은 단계도 직접 만나야 열려요.</p>
        </div>
        <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold tabular-nums">{unlocked.size}/{TOTAL_PET_FORMS} 발견</span>
      </div>
      <div className="rounded-xl bg-[#F2F5F0] border border-stone-200 p-3 space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <PetAvatar stage={1} size="sm" showHeartOnTap={false} />
          <div>
            <p className="font-bold text-stone-800">모든 밥친구는 작은 새싹에서 시작해요</p>
            <p className="mt-1 text-stone-600">최근 7일 · {outlook.dayCount}일, {outlook.mealCount}끼의 식사 기억</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['GARDEN', 'PROTEIN', 'GRAIN'] as const).map((group) => <div key={group} className="rounded-lg bg-white px-2 py-2 text-center text-[11px] text-stone-600">
            <span>{EVOLUTION_CONFIG[group].name}</span><strong className="block mt-0.5 text-sm" style={{ color: EVOLUTION_CONFIG[group].color }}>{outlook.scores[group]}끼</strong>
          </div>)}
        </div>
        <p className="text-[11px] text-stone-600 leading-relaxed">
          {pet.growthStage === 4 ? '마지막 성장에 도달했어요. 만난 모습은 도감에 계속 남아요.' : outlook.mealCount ? `다음 성장 방향: ${EVOLUTION_CONFIG[outlook.path].name} · 진화하는 순간의 식사 기억으로 결정돼요.` : '오늘의 첫 식사를 기록하면 다음 성장 방향이 나타나요.'}
        </p>
      </div>
      <p className="text-[11px] text-stone-500">이번 성장 이야기의 최근 배부른 식사 기억 {plentifulMealCount(pet)}/3회 · 사람의 칼로리 초과량과는 관계없어요.</p>
      <div className="space-y-4">
        {EVOLUTION_PATHS.map((path) => <div key={path}>
          <div className="mb-2">
            <h4 className="font-bold text-xs" style={{ color: EVOLUTION_CONFIG[path].color }}>{EVOLUTION_CONFIG[path].name}</h4>
            <p className="text-[11px] text-stone-500 mt-0.5">{EVOLUTION_CONFIG[path].hint}</p>
          </div>
          <div className={`grid ${path === 'PIG' ? 'grid-cols-2' : 'grid-cols-3'} gap-2`}>
            {(path === 'PIG' ? [1, 2, 3, 4] as const : [2, 3, 4] as const).map((stage) => {
              const discovered = unlocked.has(petFormKey(path, stage));
              const current = pet.growthStage === stage && normalized.evolutionPath === path;
              return <div key={stage} className={`relative flex flex-col items-center rounded-xl border p-2.5 text-center ${current ? 'border-[#435746] bg-[#F2F5F0]' : 'border-stone-200 bg-stone-50/60'}`}>
                <span className="text-[10px] font-semibold text-stone-400">{stage}단계{current ? ' · 현재' : ''}</span>
                <PetAvatar stage={stage} evolutionPath={path} silhouette={!discovered} size="md" showHeartOnTap={false} />
                <p className="text-[11px] font-bold text-stone-700">{discovered ? EVOLUTION_CONFIG[path].titles[stage - 1] : '???'}</p>
                <span className="mt-1 flex items-center gap-1 text-[10px] text-stone-400">{discovered ? '발견 완료' : <><LockKeyhole className="w-2.5 h-2.5" />아직 만나지 못함</>}</span>
              </div>;
            })}
          </div>
        </div>)}
      </div>
      <p className="text-[11px] leading-relaxed text-stone-500">아침·점심·저녁마다 각 식재료 계열은 한 번만 반영돼요. 같은 끼니의 여러 음식은 함께 반영하지만 반복 기록이나 식사량으로 점수를 늘릴 수는 없어요. 지난 날짜의 수정은 급식에 반영되지 않아요. 간식은 식재료 점수 대신 포만감과 배부른 식사 기억에만 반영돼요.</p>
      {pet.growthStage === 4 && <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 space-y-2">
        <h4 className="text-xs font-bold text-stone-800">{pet.generation || 1}번째 성장 이야기</h4>
        <p className="text-[11px] text-stone-500 leading-relaxed">1,000 EXP를 채우면 새싹으로 다시 자라며 다른 진화를 만날 수 있어요. 이름·성격·친밀도·도감·함께한 기록은 이어집니다. 오늘의 성장 한도는 그대로예요.</p>
        {onUpdatePet && <button type="button" disabled={pet.experience < 1000} onClick={() => {
          if (!window.confirm('새로운 성장 이야기를 시작할까요? 경험치는 0, 성장 단계는 1단계로 돌아갑니다. 도감·친밀도·함께한 기록과 오늘의 성장 한도는 유지됩니다.')) return;
          const next = startNewPetGeneration(normalized);
          if (next) onUpdatePet(next);
        }} className="rounded-lg bg-[#435746] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">{pet.experience >= 1000 ? '새로운 성장 이야기 시작' : `완전 성장까지 ${1000 - pet.experience} EXP`}</button>}
      </div>}
    </section>
  );
}
