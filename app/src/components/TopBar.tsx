import React from 'react';
import { ChevronLeft, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react';
import { getTodayString } from '../services/storage';
interface TopBarProps {
  selectedDate: string; onSelectDate: (date: string) => void; activeAllergiesCount: number;
  onOpenAllergies: () => void; tasteConfidence: 'LEARNING' | 'ESTABLISHED' | 'MATURE'; onOpenTasteInsights: () => void;
}
export const TopBar: React.FC<TopBarProps> = ({ selectedDate, onSelectDate, activeAllergiesCount, onOpenAllergies, onOpenTasteInsights }) => {
  const date = new Date(`${selectedDate}T12:00:00`);
  const isToday = selectedDate === getTodayString();
  const changeDay = (offset: number) => {
    const next = new Date(date); next.setDate(next.getDate() + offset);
    onSelectDate(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`);
  };
  return <header className="sticky top-0 z-30 border-b border-stone-100 bg-[#F5F6F8]/95 backdrop-blur-xl">
    <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-5">
      <span className="text-[23px] font-extrabold tracking-tight text-stone-900">Nutri<span className="text-blue-500">Fit</span><span className="text-blue-500">.</span></span>
      <div className="flex items-center gap-1">
        <button onClick={onOpenTasteInsights} aria-label="나의 취향 보기" title="나의 취향 보기" className="grid h-11 w-11 place-items-center rounded-full text-stone-500 hover:bg-white"><Sparkles size={21} /></button>
        <button onClick={onOpenAllergies} aria-label={`알레르기 설정 ${activeAllergiesCount}개 활성`} title="알레르기 설정" className="relative grid h-11 w-11 place-items-center rounded-full text-stone-500 hover:bg-white"><ShieldCheck size={21} />{activeAllergiesCount > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-blue-500" />}</button>
      </div>
    </div>
    <div className="mx-auto flex h-11 max-w-xl items-center justify-between px-4">
      <button aria-label="이전 날짜" onClick={() => changeDay(-1)} className="grid h-11 w-11 place-items-center rounded-full text-stone-400"><ChevronLeft size={19} /></button>
      <button aria-label={`${selectedDate}, 오늘로 돌아가기`} onClick={() => onSelectDate(getTodayString())} className="min-h-11 text-sm font-semibold text-stone-700">{isToday ? '오늘' : date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}<span className="ml-2 font-normal text-stone-400">{isToday ? date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }) : '오늘로 돌아가기'}</span></button>
      <button aria-label="다음 날짜" onClick={() => changeDay(1)} className="grid h-11 w-11 place-items-center rounded-full text-stone-400"><ChevronRight size={19} /></button>
    </div>
  </header>;
};
