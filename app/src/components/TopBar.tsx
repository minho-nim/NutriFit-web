/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, ChevronLeft, ChevronRight, ShieldAlert, Sparkles } from 'lucide-react';
import { getTodayString } from '../services/storage';

interface TopBarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  activeAllergiesCount: number;
  onOpenAllergies: () => void;
  tasteConfidence: 'LEARNING' | 'ESTABLISHED' | 'MATURE';
  onOpenTasteInsights: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  selectedDate,
  onSelectDate,
  activeAllergiesCount,
  onOpenAllergies,
  tasteConfidence,
  onOpenTasteInsights,
}) => {
  const isToday = selectedDate === getTodayString();

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onSelectDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onSelectDate(d.toISOString().split('T')[0]);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (dateStr === getTodayString()) {
      const d = new Date();
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
      return `오늘, ${month}월 ${day}일 (${dayOfWeek})`;
    }
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
    return `${month}월 ${day}일 (${dayOfWeek})`;
  };

  const confidenceLabels = {
    LEARNING: { label: '취향 학습 중', color: 'bg-stone-100 text-stone-600' },
    ESTABLISHED: { label: '취향 분석 중', color: 'bg-[#EEF2EE] text-[#3D5040]' },
    MATURE: { label: '취향 학습 완료', color: 'bg-[#E6ECE6] text-[#2F4232] font-semibold' },
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FBFBFA]/95 backdrop-blur-md border-b border-stone-200/70">
      <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo & Taste Badge */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg tracking-tight text-stone-900">
            NutriFit
          </span>

          <button
            onClick={onOpenTasteInsights}
            className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border border-stone-200/80 transition ${confidenceLabels[tasteConfidence].color}`}
            title="나의 취향 변화 보기"
          >
            <Sparkles className="w-3 h-3 text-[#4A5D4E]" />
            <span>{confidenceLabels[tasteConfidence].label}</span>
          </button>
        </div>

        {/* Date Selector & Allergen indicator */}
        <div className="flex items-center gap-1.5">
          {activeAllergiesCount > 0 && (
            <button
              onClick={onOpenAllergies}
              className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50 transition"
              title={`활성 알레르기 ${activeAllergiesCount}개`}
            >
              <ShieldAlert className="w-4 h-4 text-amber-600" />
            </button>
          )}

          <div className="flex items-center bg-white border border-stone-200 rounded-lg shadow-2xs">
            <button
              onClick={handlePrevDay}
              aria-label="이전 날짜"
              className="p-1 text-stone-500 hover:text-stone-900 transition"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onSelectDate(getTodayString())}
              className="px-2 py-0.5 text-xs font-medium text-stone-800 hover:text-stone-900 transition flex items-center gap-1"
            >
              <Calendar className="w-3 h-3 text-stone-400" />
              <span>{formatDateDisplay(selectedDate)}</span>
            </button>

            <button
              onClick={handleNextDay}
              aria-label="다음 날짜"
              className="p-1 text-stone-500 hover:text-stone-900 transition"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
