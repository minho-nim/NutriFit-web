import React from 'react';
import { Heart } from 'lucide-react';
import { PetAvatar } from './PetAvatar';
import { EVOLUTION_CONFIG } from '../utils/petEvolution';
import { mealMemory } from '../utils/petCompanion';
import type { FoodLog, PetProfile } from '../types/nutrition';

export function PetMemories({ pet, logs }: { pet: PetProfile; logs: FoodLog[] }) {
  const memory = mealMemory(logs);
  return <section className="space-y-4" aria-label="우리의 추억">
    <div className="rounded-3xl bg-blue-50 p-5"><Heart size={20} className="mb-3 text-blue-500" /><h3 className="mb-2 text-lg font-bold">우리의 식사 기억</h3>
      <p className="text-sm leading-relaxed text-stone-600">{memory?.message || '함께한 첫 식사를 기다리고 있어. 기록할 때마다 우리의 이야기가 쌓여.'}</p></div>
    <h3 className="pt-2 text-base font-bold">자라온 순간들</h3>
    {!pet.growthMemories?.length && <div className="rounded-2xl border border-dashed border-stone-200 p-6 text-center text-sm leading-relaxed text-stone-500">다음 진화부터 추억 카드가 생겨요.<br />그날의 모습과 함께 먹은 음식을 남겨둘게요.</div>}
    {(pet.growthMemories || []).map((item) => <article key={item.id} className="rounded-3xl border border-stone-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4"><PetAvatar stage={item.stage} evolutionPath={item.evolutionPath} mood="PROUD" size="md" showHeartOnTap={false} />
        <div><p className="text-xs text-stone-400">{new Date(item.date).toLocaleDateString('ko-KR')} · {item.generation}번째 이야기</p>
          <h4 className="mt-1 font-bold">{EVOLUTION_CONFIG[item.evolutionPath].titles[item.stage - 1]}가 된 날</h4></div></div>
      <p className="mt-4 text-sm leading-relaxed text-stone-500">{item.foods.length ? `${item.foods.join(', ')}… 함께한 식사가 나를 키웠어.` : '나를 알아가며 함께 자란 소중한 순간이야.'}</p>
    </article>)}
  </section>;
}
