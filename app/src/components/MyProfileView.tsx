/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Calculator,
  ChevronRight,
  Database,
  FileText,
  Heart,
  RotateCcw,
  Scale,
  ShieldAlert,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { UserProfileAndGoals } from './UserProfileAndGoals';
import { AllergySettings } from './AllergySettings';
import { WeightTracker } from './WeightTracker';
import { AppSettings } from './AppSettings';
import {
  UserAllergyConfig,
  UserGoal,
  UserProfile,
  UserTasteProfile,
  WeightLog,
} from '../types/nutrition';
import { GOAL_TYPE_LABELS } from '../utils/nutritionEngine';

interface MyProfileViewProps {
  initialScreen?: 'ALLERGIES' | null;
  profile: UserProfile;
  goal: UserGoal;
  tasteProfile: UserTasteProfile;
  userAllergies: UserAllergyConfig[];
  weightLogs: WeightLog[];
  onUpdateProfileAndGoals: (newProfile: UserProfile, newGoal: UserGoal) => void;
  onUpdateAllergies: (allergies: UserAllergyConfig[]) => void;
  onAddWeightLog: (weightKg: number, measuredAt: string, note?: string) => void;
  onDeleteWeightLog: (logId: string) => void;
  onUpdateCurrentWeight: (newWeight: number) => void;
  onResetTasteProfile: () => void;
  onDataResetOrImported: () => void;
}

type SubScreen = 'PROFILE_GOALS' | 'WEIGHT' | 'ALLERGIES' | 'TASTE_PREFS' | 'BACKUP' | 'SOURCES' | null;

export const MyProfileView: React.FC<MyProfileViewProps> = ({
  initialScreen = null,
  profile,
  goal,
  tasteProfile,
  userAllergies,
  weightLogs,
  onUpdateProfileAndGoals,
  onUpdateAllergies,
  onAddWeightLog,
  onDeleteWeightLog,
  onUpdateCurrentWeight,
  onResetTasteProfile,
  onDataResetOrImported,
}) => {
  const [activeSubScreen, setActiveSubScreen] = useState<SubScreen>(initialScreen);
  const [goalOrBodyTab, setGoalOrBodyTab] = useState<'GOALS' | 'BODY'>('GOALS');

  const goalBadge = GOAL_TYPE_LABELS[profile.goalType];
  const activeAllergies = userAllergies.filter((a) => a.isActive);

  return (
    <div className="space-y-4 pb-20">
      {/* User Header Profile Card */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-2xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-stone-900">{profile.displayName}님</h3>
            <span className="text-[11px] font-semibold text-[#344837] bg-[#EEF2EE] px-2 py-0.5 rounded-full border border-stone-200">
              {goalBadge.name}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            현재 {profile.currentWeightKg}kg · 목표 {profile.targetWeightKg}kg · 일일 {goal.dailyCalorieTarget} kcal
          </p>
        </div>

        <button
          onClick={() => {
            setGoalOrBodyTab('GOALS');
            setActiveSubScreen('PROFILE_GOALS');
          }}
          className="text-xs font-semibold text-stone-600 bg-stone-50 hover:bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200 transition"
        >
          수정
        </button>
      </div>

      {/* Menu Section 1: Health & Nutrition Goals */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="px-4 py-2.5 bg-stone-50/70 border-b border-stone-100 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
          신체 및 영양 목표
        </div>

        <div className="divide-y divide-stone-100">
          <div
            onClick={() => {
              setGoalOrBodyTab('BODY');
              setActiveSubScreen('PROFILE_GOALS');
            }}
            className="p-4 flex items-center justify-between hover:bg-stone-50/50 cursor-pointer transition"
          >
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-stone-500" />
              <div>
                <span className="text-xs font-semibold text-stone-900 block">신체 정보 및 대사량</span>
                <span className="text-[11px] text-stone-400">
                  {profile.age}세 · {profile.sexForCalculation === 'MALE' ? '남성' : '여성'} · {profile.heightCm}cm · BMR {goal.bmr} kcal
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </div>

          <div
            onClick={() => {
              setGoalOrBodyTab('GOALS');
              setActiveSubScreen('PROFILE_GOALS');
            }}
            className="p-4 flex items-center justify-between hover:bg-stone-50/50 cursor-pointer transition"
          >
            <div className="flex items-center gap-3">
              <Calculator className="w-4 h-4 text-stone-500" />
              <div>
                <span className="text-xs font-semibold text-stone-900 block">일일 영양 목표</span>
                <span className="text-[11px] text-stone-400">
                  {goal.dailyCalorieTarget} kcal (탄 {goal.carbohydrateTargetG}g · 단 {goal.proteinTargetG}g · 지 {goal.fatTargetG}g)
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </div>

          <div
            onClick={() => setActiveSubScreen('WEIGHT')}
            className="p-4 flex items-center justify-between hover:bg-stone-50/50 cursor-pointer transition"
          >
            <div className="flex items-center gap-3">
              <Scale className="w-4 h-4 text-stone-500" />
              <div>
                <span className="text-xs font-semibold text-stone-900 block">체중 측정 및 추이</span>
                <span className="text-[11px] text-stone-400">
                  최근 {weightLogs.length > 0 ? `${weightLogs[weightLogs.length - 1].weightKg}kg` : `${profile.currentWeightKg}kg`}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </div>
        </div>
      </div>

      {/* Menu Section 2: Taste Profile & Allergens */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="px-4 py-2.5 bg-stone-50/70 border-b border-stone-100 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
          취향 학습 및 식품 안전
        </div>

        <div className="divide-y divide-stone-100">
          <div
            onClick={() => setActiveSubScreen('TASTE_PREFS')}
            className="p-4 flex items-center justify-between hover:bg-stone-50/50 cursor-pointer transition"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-[#435746]" />
              <div>
                <span className="text-xs font-semibold text-stone-900 block">음식 선호도 및 취향 프로필</span>
                <span className="text-[11px] text-stone-400">
                  {tasteProfile.favoriteCookingMethods[0]
                    ? `선호 조리: ${tasteProfile.favoriteCookingMethods[0].label} · 주요 식재료: ${tasteProfile.favoriteIngredients[0]?.name || '다양'}`
                    : '기록 기반 학습 진행 중'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </div>

          <div
            onClick={() => setActiveSubScreen('ALLERGIES')}
            className="p-4 flex items-center justify-between hover:bg-stone-50/50 cursor-pointer transition"
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <div>
                <span className="text-xs font-semibold text-stone-900 block">알레르기와 식품 제한</span>
                <span className="text-[11px] text-stone-400">
                  {activeAllergies.length > 0
                    ? `${activeAllergies.map((a) => a.allergenName).join(', ')} 등록됨`
                    : '설정된 알레르기 없음'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </div>

          <div
            onClick={() => setActiveSubScreen('SOURCES')}
            className="p-4 flex items-center justify-between hover:bg-stone-50/50 cursor-pointer transition"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-stone-500" />
              <div>
                <span className="text-xs font-semibold text-stone-900 block">공공 영양 데이터 출처</span>
                <span className="text-[11px] text-stone-400">
                  식품의약품안전처 · 농촌진흥청 국가표준식품성분표 제10개정판
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Menu Section 3: Data Management */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden">
        <div className="px-4 py-2.5 bg-stone-50/70 border-b border-stone-100 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
          데이터 관리
        </div>

        <div className="divide-y divide-stone-100">
          <div
            onClick={() => setActiveSubScreen('BACKUP')}
            className="p-4 flex items-center justify-between hover:bg-stone-50/50 cursor-pointer transition"
          >
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-stone-500" />
              <div>
                <span className="text-xs font-semibold text-stone-900 block">데이터 백업 및 초기화</span>
                <span className="text-[11px] text-stone-400">JSON 내보내기 / 복원 / 데모 리셋</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400" />
          </div>
        </div>
      </div>

      {/* Focused Sub-Screen Modals */}
      {activeSubScreen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full max-w-xl rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-xl overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-stone-900">
                {activeSubScreen === 'PROFILE_GOALS' &&
                  (goalOrBodyTab === 'GOALS' ? '일일 영양 목표 설정' : '신체 정보 및 대사량')}
                {activeSubScreen === 'WEIGHT' && '체중 관리 및 추이'}
                {activeSubScreen === 'TASTE_PREFS' && '음식 선호도 및 취향 프로필'}
                {activeSubScreen === 'ALLERGIES' && '알레르기 안전 설정'}
                {activeSubScreen === 'BACKUP' && '데이터 백업 및 복원'}
                {activeSubScreen === 'SOURCES' && '공식 영양 데이터 출처'}
              </h3>
              <button
                onClick={() => setActiveSubScreen(null)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto flex-1">
              {activeSubScreen === 'PROFILE_GOALS' && (
                <UserProfileAndGoals
                  profile={profile}
                  goal={goal}
                  initialTab={goalOrBodyTab}
                  onUpdateProfileAndGoals={(p, g) => {
                    onUpdateProfileAndGoals(p, g);
                    setActiveSubScreen(null);
                  }}
                />
              )}

              {activeSubScreen === 'WEIGHT' && (
                <WeightTracker
                  profile={profile}
                  weightLogs={weightLogs}
                  onAddWeightLog={onAddWeightLog}
                  onDeleteWeightLog={onDeleteWeightLog}
                  onUpdateCurrentWeight={onUpdateCurrentWeight}
                />
              )}

              {activeSubScreen === 'TASTE_PREFS' && (
                <div className="space-y-4 text-xs text-stone-700">
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/80 space-y-2">
                    <h4 className="font-bold text-stone-900 text-sm">기록 기반 학습 요약</h4>
                    <p className="leading-relaxed text-stone-600">
                      NutriFit은 사용자가 기록한 실제 식사, 추천 피드백(관심 있음/거절), 식사 만족도 평가를 실시간으로 결합해 음식 취향 프로필을 자동 갱신합니다.
                    </p>
                    <div className="pt-2 flex items-center gap-2">
                      <span className="font-semibold text-stone-800">학습 신뢰도:</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#EEF2EE] text-[#334636] font-bold text-[11px]">
                        {tasteProfile.tasteConfidence === 'MATURE'
                          ? '정밀 학습 완료 (10회 이상 기록)'
                          : tasteProfile.tasteConfidence === 'ESTABLISHED'
                          ? '취향 분석 중 (4회 이상 기록)'
                          : '기록 수집 단계 (3회 미만)'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-stone-200/80 space-y-3">
                    <h5 className="font-bold text-stone-900">학습된 주요 선호 특성</h5>
                    <div className="space-y-1.5 text-stone-600">
                      <div>
                        <strong>선호 조리:</strong>{' '}
                        {tasteProfile.favoriteCookingMethods.map((m) => `${m.label}(${m.percentage}%)`).join(', ') || '분석 중'}
                      </div>
                      <div>
                        <strong>자주 찾는 식재료:</strong>{' '}
                        {tasteProfile.favoriteIngredients.map((i) => i.name).join(', ') || '분석 중'}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (window.confirm('취향 프로필을 초기화하시겠습니까?')) {
                          onResetTasteProfile();
                          setActiveSubScreen(null);
                        }
                      }}
                      className="mt-2 text-xs text-stone-400 hover:text-stone-700 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>취향 학습 데이터 초기화</span>
                    </button>
                  </div>
                </div>
              )}

              {activeSubScreen === 'ALLERGIES' && (
                <AllergySettings
                  userAllergies={userAllergies}
                  onUpdateAllergies={onUpdateAllergies}
                />
              )}

              {activeSubScreen === 'BACKUP' && (
                <AppSettings
                  onDataResetOrImported={() => {
                    onDataResetOrImported();
                    setActiveSubScreen(null);
                  }}
                />
              )}

              {activeSubScreen === 'SOURCES' && (
                <div className="space-y-4 text-xs text-stone-700 leading-relaxed">
                  <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                    <h4 className="font-bold text-stone-900">식품 영양성분 공공 데이터</h4>
                    <p>
                      본 서비스는 <strong>식품의약품안전처</strong> 공공누리 개방 식품영양성분 데이터베이스 및 <strong>농촌진흥청 국립농업과학원</strong> 국가표준식품성분표 제10개정판을 기반으로 기준 100g당 칼로리와 탄수화물, 단백질, 지방, 식이섬유 및 원재료 성분을 검증합니다.
                    </p>
                  </div>

                  <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                    <h4 className="font-bold text-stone-900">기초대사량 및 소비 칼로리 산정 공식</h4>
                    <p>
                      임상 영양학에서 가장 널리 검증된 <strong>Mifflin–St Jeor</strong> 공식을 사용하여 성별, 신장, 체중, 만 나이에 따른 기초대사량(BMR)을 계산하고, 활동계수(Activity Factor)를 곱해 총에너지 소비량(TDEE)을 추정합니다.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
