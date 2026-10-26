/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  Check,
  Compass,
  Filter,
  Flame,
  Heart,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Utensils,
} from 'lucide-react';
import {
  FoodCollectionItem,
  MealType,
  PetProfile,
} from '../types/nutrition';
import { PetAvatar } from './PetAvatar';
import { PetGrowthCollection } from './PetGrowthCollection';

export type CollectionFilter =
  | 'ALL'
  | 'FREQUENT'
  | 'FIRST_TIME'
  | 'WANT_AGAIN'
  | 'NEW_EXPLORE'
  | 'FAVORITES';

interface FoodCollectionViewProps {
  initialTab?: 'FOOD' | 'GROWTH';
  pet: PetProfile;
  onUpdatePet?: (pet: PetProfile) => void;
  collections: FoodCollectionItem[];
  onToggleFavorite: (itemId: string) => void;
  onUpdateRating: (itemId: string, rating: number) => void;
  onQuickLogItem: (item: FoodCollectionItem) => void;
}

export const FoodCollectionView: React.FC<FoodCollectionViewProps> = ({
  initialTab = 'FOOD',
  pet,
  onUpdatePet,
  collections,
  onToggleFavorite,
  onUpdateRating,
  onQuickLogItem,
}) => {
  const [activeFilter, setActiveFilter] = useState<CollectionFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [collectionTab, setCollectionTab] = useState<'FOOD' | 'GROWTH'>(initialTab);

  const filterTabs: { id: CollectionFilter; label: string }[] = [
    { id: 'ALL', label: '전체 음식' },
    { id: 'FREQUENT', label: '자주 먹는 음식' },
    { id: 'FIRST_TIME', label: '처음 먹은 음식' },
    { id: 'WANT_AGAIN', label: '다시 먹고 싶은 음식' },
    { id: 'NEW_EXPLORE', label: '새로운 메뉴 탐험' },
    { id: 'FAVORITES', label: '나만의 즐겨찾기' },
  ];

  // Discovered count
  const discoveredItems = collections.filter((c) => c.isDiscovered);
  const totalCount = collections.length;
  const discoveredRatio = totalCount > 0 ? Math.round((discoveredItems.length / totalCount) * 100) : 0;

  // Filter items
  const filteredItems = collections.filter((item) => {
    // Search query match
    if (searchQuery.trim() && !item.foodName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    switch (activeFilter) {
      case 'FREQUENT':
        return item.recordCount >= 2;
      case 'FIRST_TIME':
        return item.recordCount === 1;
      case 'WANT_AGAIN':
        return (item.personalRating && item.personalRating >= 4) || item.isFavorite;
      case 'NEW_EXPLORE':
        return !item.isDiscovered;
      case 'FAVORITES':
        return item.isFavorite;
      case 'ALL':
      default:
        return true;
    }
  });

  return (
    <div className="space-y-4 pb-20">
      <div className="flex gap-2 rounded-xl bg-stone-100 p-1" role="group" aria-label="도감 종류">
        {(['FOOD', 'GROWTH'] as const).map((tab) => <button key={tab} type="button" aria-pressed={collectionTab === tab} onClick={() => setCollectionTab(tab)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${collectionTab === tab ? 'bg-white text-[#435746] shadow-sm' : 'text-stone-500'}`}>{tab === 'FOOD' ? '음식 도감' : '펫 성장 도감'}</button>)}
      </div>
      {collectionTab === 'GROWTH' ? <PetGrowthCollection pet={pet} onUpdatePet={onUpdatePet} /> : <>
      {/* Top Banner: Collection Overview & Pet Partner */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#435746] bg-[#EEF2EE] px-2 py-0.5 rounded-full">
                {pet.petName}의 식사 도감
              </span>
              <span className="text-[11px] text-stone-400">탐험도 {pet.explorationProgress}%</span>
            </div>
            <h3 className="font-bold text-base text-stone-900 mt-1">
              나만의 음식 도감
            </h3>
          </div>

          <div className="shrink-0">
            <PetAvatar stage={pet.growthStage} evolutionPath={pet.evolutionPath} mood="PROUD" size="sm" />
          </div>
        </div>

        {/* Collection Completion Bar */}
        <div className="bg-stone-50 rounded-xl p-3 border border-stone-100 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-600 font-medium">도감 수집 달성도</span>
            <span className="text-stone-900 font-bold tabular-nums">
              {discoveredItems.length}종 발견 ({discoveredRatio}%)
            </span>
          </div>

          <div className="w-full bg-stone-200/80 rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#435746] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(5, discoveredRatio))}%` }}
            />
          </div>

          <p className="text-[11px] text-stone-500 leading-snug pt-0.5">
            "{pet.petName}와(과) 함께 다양한 음식을 기록할수록 도감이 채워지고 탐험 경험치를 얻어요!"
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="도감에 수집된 음식명 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
        </div>
      </div>

      {/* Filter Category Tabs (6 Filters) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                isActive
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'bg-white text-stone-600 border border-stone-200/80 hover:bg-stone-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Collection Items List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-stone-200/80 shadow-2xs text-center space-y-2">
          <BookOpen className="w-8 h-8 text-stone-300 mx-auto" />
          <h4 className="font-bold text-sm text-stone-800">해당하는 음식이 아직 없어요</h4>
          <p className="text-xs text-stone-400 max-w-xs mx-auto">
            {activeFilter === 'FAVORITES'
              ? '자주 찾는 음식에 하트 아이콘을 눌러 나만의 즐겨찾기에 추가해보세요!'
              : activeFilter === 'WANT_AGAIN'
              ? '식사 기록 후 별점 4점 이상을 주면 다시 먹고 싶은 음식으로 분류돼요.'
              : '새로운 식사를 기록하면 자동으로 도감에 등록됩니다.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredItems.map((item) => {
            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-4 border transition-all ${
                  item.isDiscovered
                    ? 'border-stone-200/80 shadow-2xs'
                    : 'border-dashed border-stone-300 bg-stone-50/40 opacity-80'
                }`}
              >
                {/* Header: Name & Favorite button */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.isDiscovered ? (
                        <span className="text-[10px] font-bold text-[#344837] bg-[#EEF2EE] px-1.5 py-0.2 rounded-sm border border-stone-200/60">
                          발견 완료 · {item.recordCount}회 기록
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded-sm">
                          미발견 탐험 메뉴
                        </span>
                      )}

                      {item.recordCount >= 3 && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded-sm border border-amber-200">
                          단골 메뉴
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm text-stone-900 mt-1">
                      {item.foodName}
                    </h4>
                  </div>

                  <button
                    onClick={() => onToggleFavorite(item.id)}
                    className={`p-1.5 rounded-full transition ${
                      item.isFavorite
                        ? 'text-rose-500 bg-rose-50'
                        : 'text-stone-300 hover:text-stone-600 hover:bg-stone-50'
                    }`}
                    title={item.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                  >
                    <Heart className={`w-4 h-4 ${item.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <p className="mt-2 text-[10px] text-stone-400">{item.servingWeightG || 100}g 기준 · {item.isDiscovered ? '최근 기록량' : '식품 기준량'}</p>
                {/* Nutrition Snapshot */}
                <div className="flex items-center gap-2 text-[11px] text-stone-500 my-2 py-1.5 px-2.5 bg-stone-50 rounded-xl">
                  <span className="font-bold text-stone-900 tabular-nums">{item.calories} kcal</span>
                  <span className="text-stone-300">·</span>
                  <span>단 <strong className="text-stone-800">{item.protein}g</strong></span>
                  <span className="text-stone-300">·</span>
                  <span>탄 {item.carbohydrates}g</span>
                  <span className="text-stone-300">·</span>
                  <span>지 {item.fat}g</span>
                </div>

                {/* Rating Stars & Quick Log Action */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                  {/* Rating Stars */}
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => onUpdateRating(item.id, star)}
                        className="text-stone-300 hover:text-amber-400 p-0.5 transition"
                        title={`${star}점 부여`}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            item.personalRating && star <= item.personalRating
                              ? 'text-amber-400 fill-amber-400'
                              : ''
                          }`}
                        />
                      </button>
                    ))}
                    {item.personalRating ? (
                      <span className="text-[10px] text-stone-500 ml-1 font-semibold">
                        {item.personalRating}점
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-400 ml-1">별점 평가</span>
                    )}
                  </div>

                  {/* Quick Log Button */}
                  <button
                    onClick={() => onQuickLogItem(item)}
                    className="text-xs font-semibold text-[#344837] hover:text-[#253527] bg-[#EEF2EE] hover:bg-[#E3EBE3] px-2.5 py-1 rounded-xl transition flex items-center gap-1 active:scale-95"
                  >
                    <Plus className="w-3 h-3" />
                    <span>기록하기</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>}
    </div>
  );
};
