import React from 'react';

export function PetSatietyMeter({ value }: { value: number }) {
  const fullness = Math.round(value);
  return <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-3 space-y-1.5">
    <div className="flex justify-between gap-2 text-[11px] font-semibold text-stone-600">
      <span>밥친구 포만감 · {fullness >= 95 ? '배 토닥토닥, 잠깐 쉴래요' : fullness >= 75 ? '배가 포근하게 불러요' : '편안한 배'}</span>
      <span className="tabular-nums">{fullness}%</span>
    </div>
    <div role="progressbar" aria-label="펫 포만감" aria-valuemin={0} aria-valuemax={100} aria-valuenow={fullness} className="h-1.5 rounded-full bg-stone-200 overflow-hidden">
      <div className={`h-full rounded-full transition-all ${fullness >= 75 ? 'bg-rose-300' : 'bg-[#86A78D]'}`} style={{ width: `${fullness}%` }} />
    </div>
    <p className="text-[10px] leading-relaxed text-stone-500">시간이 지나면 내려가요. 다음 식사로 75% 이상이 되면 추가 EXP 절반, 95% 이상이면 추가 EXP는 쉬어가요. 대화·쓰다듬기로는 내려가지 않아요.</p>
  </div>;
}
