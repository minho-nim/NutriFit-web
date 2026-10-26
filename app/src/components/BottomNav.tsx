/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, Calendar, Compass, Home, Plus, Sparkles, User } from 'lucide-react';

export type MainTab = 'HOME' | 'DIARY' | 'DISCOVER' | 'COLLECTION' | 'MY';

interface BottomNavProps {
  currentTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  onOpenQuickLog: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenQuickLog,
}) => {
  return (
    <>
      {/* Floating Quick Meal Log Button */}
      <button
        onClick={onOpenQuickLog}
        aria-label="식사 기록 추가"
        className="fixed bottom-20 right-4 sm:right-[max(1rem,calc(50%-16rem))] z-40 w-12 h-12 rounded-full bg-[#405443] hover:bg-[#344637] active:scale-95 text-white shadow-lg flex items-center justify-center transition-all duration-200"
        title="빠른 식사 기록"
      >
        <Plus className="w-6 h-6 stroke-[2.4]" />
      </button>

      {/* 5-Tab Clean Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#FBFBFA]/95 backdrop-blur-md border-t border-stone-200/80 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-xl mx-auto px-2 h-16 flex items-center justify-around">
          {/* Tab 1: Home */}
          <button
            onClick={() => onSelectTab('HOME')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition ${
              currentTab === 'HOME'
                ? 'text-[#364939] font-bold'
                : 'text-stone-400 hover:text-stone-700 font-medium'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">홈</span>
          </button>

          {/* Tab 2: Diary (기록) */}
          <button
            onClick={() => onSelectTab('DIARY')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition ${
              currentTab === 'DIARY'
                ? 'text-[#364939] font-bold'
                : 'text-stone-400 hover:text-stone-700 font-medium'
            }`}
          >
            <Calendar className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">기록</span>
          </button>

          {/* Tab 3: Discover (펫 추천) */}
          <button
            onClick={() => onSelectTab('DISCOVER')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition ${
              currentTab === 'DISCOVER'
                ? 'text-[#364939] font-bold'
                : 'text-stone-400 hover:text-stone-700 font-medium'
            }`}
          >
            <Compass className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">펫 추천</span>
          </button>

          {/* Tab 4: Food Collection (음식 도감) */}
          <button
            onClick={() => onSelectTab('COLLECTION')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition ${
              currentTab === 'COLLECTION'
                ? 'text-[#364939] font-bold'
                : 'text-stone-400 hover:text-stone-700 font-medium'
            }`}
          >
            <BookOpen className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">음식 도감</span>
          </button>

          {/* Tab 5: My (내 정보) */}
          <button
            onClick={() => onSelectTab('MY')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition ${
              currentTab === 'MY'
                ? 'text-[#364939] font-bold'
                : 'text-stone-400 hover:text-stone-700 font-medium'
            }`}
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[11px]">내 정보</span>
          </button>
        </div>
      </nav>
    </>
  );
};
