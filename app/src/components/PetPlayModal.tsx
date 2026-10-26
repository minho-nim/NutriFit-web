import { useModalDialog } from '../hooks/useModalDialog';
import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { PetAvatar } from './PetAvatar';
import { hasPlayedToday } from '../utils/petCompanion';
import { usePetSatiety } from '../hooks/usePetSatiety';
import type { PetProfile } from '../types/nutrition';

export function PetPlayModal({ pet, onComplete, onClose }: { pet: PetProfile; onComplete: () => void; onClose: () => void }) {
  const modalRef = useModalDialog<HTMLElement>(onClose);
  const [caught, setCaught] = useState(0);
  const done = caught >= 3;
  const played = hasPlayedToday(pet);
  const satiety = usePetSatiety(pet);
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="play-title">
    <section ref={modalRef} className="relative w-full max-w-sm rounded-[28px] bg-white p-6 text-center shadow-xl">
      <button onClick={onClose} aria-label="놀이 닫기" className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full text-stone-500"><X size={20} /></button>
      <p className="mb-2 text-xs font-semibold text-blue-600">잠깐, 우리 시간</p>
      <h2 id="play-title" className="text-xl font-bold">{done ? '같이 놀아서 좋았어!' : played ? '오늘도 즐거웠어' : `${pet.petName}와 공놀이`}</h2>
      <div className="my-5 flex justify-center"><PetAvatar stage={pet.growthStage} evolutionPath={pet.evolutionPath} satiety={satiety} mood={satiety >= 95 ? 'SLEEPY' : done ? 'CHEERING' : 'CURIOUS'} size="xl" /></div>
      {done || played ? <>
        <p className="mb-5 text-sm leading-relaxed text-stone-500">{done ? '데굴데굴, 네가 받아줘서 신났어. 내일 또 놀자!' : '오늘 공놀이를 함께했어. 내일 또 재미있게 놀자!'}<br />포만감과 성장 경험치는 그대로예요.</p>
        <button onClick={onClose} className="primary-action w-full"><Check size={18} /> 좋아, 내일 또 놀자</button>
      </> : <>
        <p className="text-sm text-stone-500">공을 세 번 톡톡 받아주세요 · {caught}/3</p>
        <div className="relative my-4 h-28 rounded-2xl bg-blue-50">
          <button aria-label={`공 받기 ${caught + 1}/3`} onClick={() => { const next = caught + 1; setCaught(next); if (next === 3) onComplete(); }}
            className="absolute top-7 grid h-16 w-16 place-items-center rounded-full bg-blue-500 text-3xl shadow-md transition-all duration-200 active:scale-90"
            style={{ left: `${[12, 64, 37][caught]}%` }}>🎾</button>
        </div>
        <p className="text-xs text-stone-400">하루 한 번 친밀도 +3 · 배부른 상태도 유지돼요</p>
      </>}
    </section>
  </div>;
}
