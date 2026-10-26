import React from 'react';
import { CalendarDays, Home, Plus, Sparkles, UserRound } from 'lucide-react';
export type MainTab = 'HOME' | 'DIARY' | 'DISCOVER' | 'COLLECTION' | 'MY';
interface BottomNavProps { currentTab: MainTab; onSelectTab: (tab: MainTab) => void; onOpenQuickLog: () => void }
export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab, onOpenQuickLog }) => {
  const items = [{ tab: 'HOME', label: '홈', icon: Home }, { tab: 'DIARY', label: '기록', icon: CalendarDays }, { tab: 'DISCOVER', label: '추천', icon: Sparkles }, { tab: 'MY', label: '마이', icon: UserRound }] as const;
  return <nav aria-label="주요 메뉴" className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
    <div className="mx-auto grid h-[76px] max-w-xl grid-cols-5 items-center px-2">
      {items.map(({ tab, label, icon: Icon }, index) => <React.Fragment key={tab}>
        {index === 2 && <button onClick={onOpenQuickLog} aria-label="식사 기록 추가" className="mx-auto flex min-h-14 w-16 flex-col items-center justify-center gap-1 text-xs font-semibold text-blue-600"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-500 text-white shadow-sm"><Plus size={23} /></span>기록하기</button>}
        <button onClick={() => onSelectTab(tab)} aria-current={currentTab === tab ? 'page' : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 text-xs ${currentTab === tab ? 'font-bold text-stone-900' : 'font-medium text-stone-400'}`}><Icon size={23} strokeWidth={currentTab === tab ? 2.4 : 1.7} /><span>{label}</span></button>
      </React.Fragment>)}
    </div>
  </nav>;
};
