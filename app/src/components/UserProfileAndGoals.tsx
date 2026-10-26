/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Info,
  RotateCcw,
  Save,
  Sliders,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import {
  ActivityLevel,
  GoalType,
  UserGoal,
  UserProfile,
} from '../types/nutrition';
import {
  ACTIVITY_FACTORS,
  calculateBMR,
  calculateNutritionGoals,
  calculateTDEE,
  GOAL_TYPE_LABELS,
} from '../utils/nutritionEngine';

interface UserProfileAndGoalsProps {
  profile: UserProfile;
  goal: UserGoal;
  onUpdateProfileAndGoals: (newProfile: UserProfile, newGoal: UserGoal) => void;
  initialTab?: 'GOALS' | 'BODY';
}

export const UserProfileAndGoals: React.FC<UserProfileAndGoalsProps> = ({
  profile,
  goal,
  onUpdateProfileAndGoals,
  initialTab = 'GOALS',
}) => {
  const [activeTab, setActiveTab] = useState<'GOALS' | 'BODY'>(initialTab);

  // Goal Edit State (Default is read-only)
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);

  // Form drafts for Goal editing
  const [draftCalories, setDraftCalories] = useState<number>(goal.dailyCalorieTarget);
  const [draftCarbs, setDraftCarbs] = useState<number>(goal.carbohydrateTargetG);
  const [draftProtein, setDraftProtein] = useState<number>(goal.proteinTargetG);
  const [draftFat, setDraftFat] = useState<number>(goal.fatTargetG);

  // Physical Profile Form state
  const [displayName, setDisplayName] = useState<string>(profile.displayName);
  const [age, setAge] = useState<number>(profile.age);
  const [sex, setSex] = useState<'MALE' | 'FEMALE'>(profile.sexForCalculation);
  const [heightCm, setHeightCm] = useState<number>(profile.heightCm);
  const [weightKg, setWeightKg] = useState<number>(profile.currentWeightKg);
  const [targetWeightKg, setTargetWeightKg] = useState<number>(profile.targetWeightKg);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile.activityLevel);
  const [goalType, setGoalType] = useState<GoalType>(profile.goalType);
  const [targetDurationWeeks, setTargetDurationWeeks] = useState<number>(profile.targetDurationWeeks || 12);
  const [isProfileSavedAlert, setIsProfileSavedAlert] = useState<boolean>(false);

  // Compute official system recommended goal based on current profile parameters
  const recommendedGoal = calculateNutritionGoals({
    ...profile,
    age,
    sexForCalculation: sex,
    heightCm,
    currentWeightKg: weightKg,
    targetWeightKg,
    activityLevel,
    goalType,
  });

  // Check whether current active goal is custom or matching system recommendation
  const isCustomUserGoal = Boolean(
    goal.isCustomManual ||
      goal.dailyCalorieTarget !== recommendedGoal.dailyCalorieTarget ||
      goal.carbohydrateTargetG !== recommendedGoal.carbohydrateTargetG ||
      goal.proteinTargetG !== recommendedGoal.proteinTargetG ||
      goal.fatTargetG !== recommendedGoal.fatTargetG
  );

  // Live Math calculations for current active goal (Read-only view)
  const readOnlyTotalCal = goal.dailyCalorieTarget;
  const readOnlyCarbKcal = goal.carbohydrateTargetG * 4;
  const readOnlyCarbPct = readOnlyTotalCal > 0 ? Math.round((readOnlyCarbKcal / readOnlyTotalCal) * 100) : 0;

  const readOnlyProteinKcal = goal.proteinTargetG * 4;
  const readOnlyProteinPct = readOnlyTotalCal > 0 ? Math.round((readOnlyProteinKcal / readOnlyTotalCal) * 100) : 0;
  const readOnlyProteinPerKg = profile.currentWeightKg > 0 ? (goal.proteinTargetG / profile.currentWeightKg).toFixed(1) : '0';

  const readOnlyFatKcal = goal.fatTargetG * 9;
  const readOnlyFatPct = readOnlyTotalCal > 0 ? Math.round((readOnlyFatKcal / readOnlyTotalCal) * 100) : 0;

  // Live calculations for editing draft
  const draftCarbKcal = draftCarbs * 4;
  const draftCarbPct = draftCalories > 0 ? Math.round((draftCarbKcal / draftCalories) * 100) : 0;

  const draftProteinKcal = draftProtein * 4;
  const draftProteinPct = draftCalories > 0 ? Math.round((draftProteinKcal / draftCalories) * 100) : 0;
  const draftProteinPerKg = profile.currentWeightKg > 0 ? (draftProtein / profile.currentWeightKg).toFixed(1) : '0';

  const draftFatKcal = draftFat * 9;
  const draftFatPct = draftCalories > 0 ? Math.round((draftFatKcal / draftCalories) * 100) : 0;

  const draftMacroCalSum = draftCarbKcal + draftProteinKcal + draftFatKcal;

  // Safety floor check
  const safetyFloor = sex === 'MALE' ? 1500 : 1200;
  const isDraftBelowSafety = draftCalories < safetyFloor;

  // Live BMR & TDEE preview
  const liveBmr = calculateBMR(weightKg, heightCm, age, sex);
  const liveTdee = calculateTDEE(liveBmr, activityLevel);

  // Handlers for Goal Section
  const handleStartEditGoal = () => {
    setDraftCalories(goal.dailyCalorieTarget);
    setDraftCarbs(goal.carbohydrateTargetG);
    setDraftProtein(goal.proteinTargetG);
    setDraftFat(goal.fatTargetG);
    setIsEditingGoal(true);
  };

  const handleCancelEditGoal = () => {
    // 취소를 누르면 편집 중인 변경사항을 취소하고 이전 값으로 복원한다
    setDraftCalories(goal.dailyCalorieTarget);
    setDraftCarbs(goal.carbohydrateTargetG);
    setDraftProtein(goal.proteinTargetG);
    setDraftFat(goal.fatTargetG);
    setIsEditingGoal(false);
  };

  const handleResetToRecommended = () => {
    // 권장값으로 되돌리기
    setDraftCalories(recommendedGoal.dailyCalorieTarget);
    setDraftCarbs(recommendedGoal.carbohydrateTargetG);
    setDraftProtein(recommendedGoal.proteinTargetG);
    setDraftFat(recommendedGoal.fatTargetG);
  };

  const handleSaveGoal = () => {
    // 변경사항 저장
    const isMatchingRecommended =
      draftCalories === recommendedGoal.dailyCalorieTarget &&
      draftCarbs === recommendedGoal.carbohydrateTargetG &&
      draftProtein === recommendedGoal.proteinTargetG &&
      draftFat === recommendedGoal.fatTargetG;

    const updatedGoal: UserGoal = {
      ...goal,
      dailyCalorieTarget: draftCalories,
      carbohydrateTargetG: draftCarbs,
      proteinTargetG: draftProtein,
      fatTargetG: draftFat,
      calculationMethod: isMatchingRecommended
        ? 'Mifflin-St Jeor BMR & ACSM Activity Multiplier'
        : '사용자 직접 수동 설정',
      calorieAdjustmentReason: isMatchingRecommended
        ? recommendedGoal.calorieAdjustmentReason
        : `사용자가 직접 일일 목표(${draftCalories} kcal, 탄 ${draftCarbs}g, 단 ${draftProtein}g, 지 ${draftFat}g)로 조정함`,
      isCustomManual: !isMatchingRecommended,
    };

    onUpdateProfileAndGoals(profile, updatedGoal);
    setIsEditingGoal(false);
  };

  // Handler for Profile Section Save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedProfile: UserProfile = {
      ...profile,
      displayName,
      age,
      sexForCalculation: sex,
      heightCm,
      currentWeightKg: weightKg,
      targetWeightKg,
      activityLevel,
      goalType,
      targetDurationWeeks,
      updatedAt: new Date().toISOString(),
    };

    // If goal was system recommended, auto recalculate goal based on new profile
    let updatedGoal = goal;
    if (!goal.isCustomManual) {
      updatedGoal = calculateNutritionGoals(updatedProfile);
    } else {
      // Keep custom calorie/macros but update BMR/TDEE
      const newBmr = calculateBMR(weightKg, heightCm, age, sex);
      const newTdee = calculateTDEE(newBmr, activityLevel);
      updatedGoal = {
        ...goal,
        bmr: newBmr,
        tdee: newTdee,
        goalType,
      };
    }

    onUpdateProfileAndGoals(updatedProfile, updatedGoal);
    setIsProfileSavedAlert(true);
    setTimeout(() => setIsProfileSavedAlert(false), 2500);
  };

  return (
    <div className="space-y-5">
      {/* Top Segmented Navigation Tabs */}
      <div className="flex items-center p-1 bg-stone-100 rounded-xl">
        <button
          type="button"
          onClick={() => {
            setActiveTab('GOALS');
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'GOALS'
              ? 'bg-white text-stone-900 shadow-2xs font-bold'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>일일 영양 목표</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('BODY');
          }}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'BODY'
              ? 'bg-white text-stone-900 shadow-2xs font-bold'
              : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>신체 정보 및 대사량</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: 일일 영양 목표 설정 (기본: 읽기 전용 / 수정: 수정 모드) */}
      {/* ========================================================================= */}
      {activeTab === 'GOALS' && (
        <div className="space-y-4">
          {!isEditingGoal ? (
            /* ======================================================= */
            /* 1.1 기본 화면: 읽기 전용 (Read-Only Mode)               */
            /* ======================================================= */
            <div className="bg-white rounded-2xl border border-stone-200/80 p-5 space-y-5 shadow-2xs">
              {/* Header */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-stone-900">
                    일일 영양 목표
                  </h3>

                  {/* System vs User Custom Badge */}
                  {isCustomUserGoal ? (
                    <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      사용자 직접 설정 수치
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-[#2C4030] bg-[#EEF2EE] border border-stone-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#4A5D4E]" />
                      시스템 권장 수치
                    </span>
                  )}
                </div>

                <p className="text-xs text-stone-500 leading-relaxed">
                  사용자 프로필과 권장 공식에 따라 계산된 하루 영양 목표입니다.
                </p>
              </div>

              {/* Status explanation */}
              {isCustomUserGoal ? (
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/70 text-xs text-amber-900 space-y-1">
                  <div className="font-semibold flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-amber-700" />
                    <span>사용자 맞춤 설정 적용 중</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-normal">
                    현재 사용자 지정 칼로리와 탄단지 목표가 적용되어 있습니다. 공식 권장 목표({recommendedGoal.dailyCalorieTarget.toLocaleString()} kcal)로 언제든 되돌릴 수 있습니다.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-xs text-stone-600 leading-normal">
                  신체 정보(키 {profile.heightCm}cm · 체중 {profile.currentWeightKg}kg · 만 {profile.age}세) 및 Mifflin-St Jeor 공식에 따른 안전한 권장 영양 비율입니다.
                </div>
              )}

              {/* Daily Goals Read-Only Metric List (Prompt Format) */}
              <div className="bg-stone-50/60 rounded-xl p-4 border border-stone-200/70 divide-y divide-stone-200/60 text-stone-800">
                {/* Total Calories */}
                <div className="py-2.5 first:pt-0 flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-600">하루 총칼로리</span>
                  <span className="text-base font-extrabold text-stone-900 tabular-nums">
                    {readOnlyTotalCal.toLocaleString()} kcal
                  </span>
                </div>

                {/* Carbohydrates */}
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-600">탄수화물</span>
                  <span className="text-xs font-medium text-stone-900 tabular-nums">
                    <strong className="font-bold">{goal.carbohydrateTargetG} g</strong>
                    <span className="text-stone-300 mx-1.5">·</span>
                    {readOnlyCarbKcal.toLocaleString()} kcal
                    <span className="text-stone-300 mx-1.5">·</span>
                    <span className="text-stone-600 font-semibold">{readOnlyCarbPct}%</span>
                  </span>
                </div>

                {/* Protein */}
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-600">단백질</span>
                  <span className="text-xs font-medium text-stone-900 tabular-nums">
                    <strong className="font-bold">{goal.proteinTargetG} g</strong>
                    <span className="text-stone-300 mx-1.5">·</span>
                    {readOnlyProteinKcal.toLocaleString()} kcal
                    <span className="text-stone-300 mx-1.5">·</span>
                    <span className="text-stone-600 font-semibold">{readOnlyProteinPct}%</span>
                    <span className="text-stone-300 mx-1.5">·</span>
                    <span className="text-[#344837] font-semibold">체중당 {readOnlyProteinPerKg} g/kg</span>
                  </span>
                </div>

                {/* Fat */}
                <div className="py-2.5 last:pb-0 flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-600">지방</span>
                  <span className="text-xs font-medium text-stone-900 tabular-nums">
                    <strong className="font-bold">{goal.fatTargetG} g</strong>
                    <span className="text-stone-300 mx-1.5">·</span>
                    {readOnlyFatKcal.toLocaleString()} kcal
                    <span className="text-stone-300 mx-1.5">·</span>
                    <span className="text-stone-600 font-semibold">{readOnlyFatPct}%</span>
                  </span>
                </div>
              </div>

              {/* Macro Proportion Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium">
                  <span>영양소 에너지 비율</span>
                  <span className="tabular-nums">
                    탄수화물 {readOnlyCarbPct}% · 단백질 {readOnlyProteinPct}% · 지방 {readOnlyFatPct}%
                  </span>
                </div>
                <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${readOnlyCarbPct}%` }}
                    className="bg-[#5B6D5E] transition-all duration-300"
                    title={`탄수화물 ${readOnlyCarbPct}%`}
                  />
                  <div
                    style={{ width: `${readOnlyProteinPct}%` }}
                    className="bg-[#8DA391] transition-all duration-300"
                    title={`단백질 ${readOnlyProteinPct}%`}
                  />
                  <div
                    style={{ width: `${readOnlyFatPct}%` }}
                    className="bg-[#C4BAA9] transition-all duration-300"
                    title={`지방 ${readOnlyFatPct}%`}
                  />
                </div>
              </div>

              {/* Bottom: Only "수정" button as specified in prompt */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleStartEditGoal}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-2xs transition active:scale-[0.98]"
                >
                  수정
                </button>
              </div>
            </div>
          ) : (
            /* ======================================================= */
            /* 1.2 수정 모드 (Edit Mode)                               */
            /* ======================================================= */
            <div className="bg-white rounded-2xl border border-stone-200/80 p-5 space-y-5 shadow-2xs">
              <div className="space-y-1 pb-2 border-b border-stone-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-stone-900">
                    일일 영양 목표 수정
                  </h3>
                  <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full">
                    편집 모드
                  </span>
                </div>
                <p className="text-xs text-stone-500 leading-relaxed">
                  슬라이더를 사용하거나 정확한 수치를 직접 입력해 하루 영양 목표를 변경할 수 있습니다.
                </p>
              </div>

              {/* Safety notice if below recommended safety floor */}
              {isDraftBelowSafety && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">권장 최저 안전 칼로리 미만</span>
                    <span className="text-[11px] text-rose-700">
                      성인 {sex === 'MALE' ? '남성' : '여성'}의 건강 유지를 위한 최소 일일 섭취 기준은 {safetyFloor} kcal입니다. 극단적인 저칼로리는 대사량 저하와 영양 불균형을 유발할 수 있습니다.
                    </span>
                  </div>
                </div>
              )}

              {/* 4 Items to edit: 1. 총칼로리, 2. 탄수화물, 3. 단백질, 4. 지방 */}
              <div className="space-y-4">
                {/* 1. 하루 총칼로리 */}
                <div className="p-4 bg-stone-50/70 rounded-xl border border-stone-200/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="input-calories" className="text-xs font-bold text-stone-900 block">
                        1. 하루 총칼로리
                      </label>
                      <span className="text-[11px] text-stone-400">일일 총 목표 열량</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        id="input-calories"
                        type="number"
                        min={800}
                        max={5000}
                        step={10}
                        value={draftCalories}
                        onChange={(e) => setDraftCalories(Math.max(0, Number(e.target.value)))}
                        className="w-24 text-right text-sm font-bold text-stone-900 bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 tabular-nums focus:outline-none focus:ring-1 focus:ring-stone-400"
                      />
                      <span className="text-xs font-semibold text-stone-500">kcal</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={1000}
                    max={4000}
                    step={20}
                    value={Math.min(4000, Math.max(1000, draftCalories))}
                    onChange={(e) => setDraftCalories(Number(e.target.value))}
                    className="w-full accent-[#344837] cursor-pointer"
                  />

                  <div className="flex justify-between text-[10px] text-stone-400">
                    <span>1,000 kcal</span>
                    <span>권장 공식: {recommendedGoal.dailyCalorieTarget} kcal</span>
                    <span>4,000 kcal</span>
                  </div>
                </div>

                {/* 2. 탄수화물 목표(g) */}
                <div className="p-4 bg-stone-50/70 rounded-xl border border-stone-200/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="input-carbs" className="text-xs font-bold text-stone-900 block">
                        2. 탄수화물 목표(g)
                      </label>
                      <div className="text-[11px] text-stone-500 tabular-nums">
                        {draftCarbKcal.toLocaleString()} kcal · {draftCarbPct}%
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        id="input-carbs"
                        type="number"
                        min={20}
                        max={600}
                        step={1}
                        value={draftCarbs}
                        onChange={(e) => setDraftCarbs(Math.max(0, Number(e.target.value)))}
                        className="w-20 text-right text-sm font-bold text-stone-900 bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 tabular-nums focus:outline-none focus:ring-1 focus:ring-stone-400"
                      />
                      <span className="text-xs font-semibold text-stone-500">g</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={30}
                    max={500}
                    step={5}
                    value={Math.min(500, Math.max(30, draftCarbs))}
                    onChange={(e) => setDraftCarbs(Number(e.target.value))}
                    className="w-full accent-[#5B6D5E] cursor-pointer"
                  />

                  <div className="flex justify-between text-[10px] text-stone-400">
                    <span>30 g</span>
                    <span>권장: {recommendedGoal.carbohydrateTargetG} g</span>
                    <span>500 g</span>
                  </div>
                </div>

                {/* 3. 단백질 목표(g) */}
                <div className="p-4 bg-stone-50/70 rounded-xl border border-stone-200/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="input-protein" className="text-xs font-bold text-stone-900 block">
                        3. 단백질 목표(g)
                      </label>
                      <div className="text-[11px] text-stone-500 tabular-nums">
                        {draftProteinKcal.toLocaleString()} kcal · {draftProteinPct}% · 체중당 {draftProteinPerKg} g/kg
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        id="input-protein"
                        type="number"
                        min={20}
                        max={350}
                        step={1}
                        value={draftProtein}
                        onChange={(e) => setDraftProtein(Math.max(0, Number(e.target.value)))}
                        className="w-20 text-right text-sm font-bold text-stone-900 bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 tabular-nums focus:outline-none focus:ring-1 focus:ring-stone-400"
                      />
                      <span className="text-xs font-semibold text-stone-500">g</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={30}
                    max={300}
                    step={5}
                    value={Math.min(300, Math.max(30, draftProtein))}
                    onChange={(e) => setDraftProtein(Number(e.target.value))}
                    className="w-full accent-[#8DA391] cursor-pointer"
                  />

                  <div className="flex justify-between text-[10px] text-stone-400">
                    <span>30 g</span>
                    <span>권장: {recommendedGoal.proteinTargetG} g</span>
                    <span>300 g</span>
                  </div>
                </div>

                {/* 4. 지방 목표(g) */}
                <div className="p-4 bg-stone-50/70 rounded-xl border border-stone-200/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <label htmlFor="input-fat" className="text-xs font-bold text-stone-900 block">
                        4. 지방 목표(g)
                      </label>
                      <div className="text-[11px] text-stone-500 tabular-nums">
                        {draftFatKcal.toLocaleString()} kcal · {draftFatPct}%
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        id="input-fat"
                        type="number"
                        min={10}
                        max={250}
                        step={1}
                        value={draftFat}
                        onChange={(e) => setDraftFat(Math.max(0, Number(e.target.value)))}
                        className="w-20 text-right text-sm font-bold text-stone-900 bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 tabular-nums focus:outline-none focus:ring-1 focus:ring-stone-400"
                      />
                      <span className="text-xs font-semibold text-stone-500">g</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={15}
                    max={200}
                    step={5}
                    value={Math.min(200, Math.max(15, draftFat))}
                    onChange={(e) => setDraftFat(Number(e.target.value))}
                    className="w-full accent-[#C4BAA9] cursor-pointer"
                  />

                  <div className="flex justify-between text-[10px] text-stone-400">
                    <span>15 g</span>
                    <span>권장: {recommendedGoal.fatTargetG} g</span>
                    <span>200 g</span>
                  </div>
                </div>
              </div>

              {/* Live Calorie & Macro Sum Comparison Card */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-semibold text-stone-800">
                  <span>탄단지 에너지 합계</span>
                  <span className="tabular-nums font-bold">
                    {draftMacroCalSum.toLocaleString()} kcal
                  </span>
                </div>

                <div className="h-1.5 w-full bg-stone-200 rounded-full overflow-hidden flex">
                  <div style={{ width: `${draftCarbPct}%` }} className="bg-[#5B6D5E]" />
                  <div style={{ width: `${draftProteinPct}%` }} className="bg-[#8DA391]" />
                  <div style={{ width: `${draftFatPct}%` }} className="bg-[#C4BAA9]" />
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-500 pt-0.5">
                  <span>총 칼로리 목표: {draftCalories.toLocaleString()} kcal</span>
                  {Math.abs(draftMacroCalSum - draftCalories) > 30 ? (
                    <button
                      type="button"
                      onClick={() => setDraftCalories(draftMacroCalSum)}
                      className="text-[#334636] font-semibold hover:underline"
                    >
                      총칼로리를 탄단지 합계에 맞추기
                    </button>
                  ) : (
                    <span className="text-stone-400 font-medium">탄단지 열량 균형 양호</span>
                  )}
                </div>
              </div>

              {/* Action Buttons: 권장값으로 되돌리기 / 취소 / 변경사항 저장 */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={handleResetToRecommended}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>권장값으로 되돌리기</span>
                </button>

                <div className="w-full sm:w-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEditGoal}
                    className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 rounded-xl transition"
                  >
                    취소
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveGoal}
                    className="flex-1 sm:flex-initial px-5 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition shadow-2xs active:scale-[0.98]"
                  >
                    변경사항 저장
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: 신체 정보 및 대사량 (Body Profile & BMR / TDEE)                    */}
      {/* ========================================================================= */}
      {activeTab === 'BODY' && (
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200/80 p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-stone-900">
                  기본 신체 정보
                </h3>
                <p className="text-xs text-stone-500">
                  Mifflin-St Jeor 공식의 기초대사량(BMR) 계산에 직접 사용되는 신체 수치입니다.
                </p>
              </div>

              {isProfileSavedAlert && (
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  저장 완료
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">이름 / 닉네임</label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">만 나이 (세)</label>
                <input
                  type="number"
                  min={10}
                  max={120}
                  required
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium tabular-nums focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">성별 (대사량 계산 기준)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSex('FEMALE')}
                    className={`py-2 rounded-xl text-xs font-semibold transition ${
                      sex === 'FEMALE'
                        ? 'bg-[#344837] text-white shadow-2xs'
                        : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    여성
                  </button>
                  <button
                    type="button"
                    onClick={() => setSex('MALE')}
                    className={`py-2 rounded-xl text-xs font-semibold transition ${
                      sex === 'MALE'
                        ? 'bg-[#344837] text-white shadow-2xs'
                        : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    남성
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">신장 (cm)</label>
                <input
                  type="number"
                  min={100}
                  max={250}
                  step="0.5"
                  required
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-medium tabular-nums focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">현재 체중 (kg)</label>
                <input
                  type="number"
                  min={30}
                  max={250}
                  step="0.1"
                  required
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold tabular-nums focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">목표 체중 (kg)</label>
                <input
                  type="number"
                  min={30}
                  max={250}
                  step="0.1"
                  required
                  value={targetWeightKg}
                  onChange={(e) => setTargetWeightKg(Number(e.target.value))}
                  className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-xl font-bold tabular-nums text-[#344837] focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
              </div>
            </div>

            {/* Health Goal Type */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-stone-700 mb-2">건강 관리 목표</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['LOSS', 'MAINTAIN', 'GAIN', 'BALANCE'] as GoalType[]).map((gType) => {
                  const meta = GOAL_TYPE_LABELS[gType];
                  const isSelected = goalType === gType;
                  return (
                    <button
                      key={gType}
                      type="button"
                      onClick={() => setGoalType(gType)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        isSelected
                          ? 'border-[#344837] bg-[#EEF2EE] text-[#2C4030] shadow-2xs font-semibold'
                          : 'border-stone-200 bg-stone-50/50 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <div className="text-xs font-bold">{meta.name}</div>
                      <div className="text-[10px] text-stone-400 mt-0.5">{meta.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Activity Level Selector */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-stone-700 mb-2">
                일상 활동량 (Activity Factor)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {(Object.keys(ACTIVITY_FACTORS) as ActivityLevel[]).map((level) => {
                  const info = ACTIVITY_FACTORS[level];
                  const isSelected = activityLevel === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setActivityLevel(level)}
                      className={`p-2.5 rounded-xl text-left border transition ${
                        isSelected
                          ? 'border-[#344837] bg-[#EEF2EE] shadow-2xs'
                          : 'border-stone-200 bg-white hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-stone-900">{info.label}</span>
                        <span className="text-[10px] font-semibold text-[#344837]">
                          x{info.factor}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-400 mt-0.5 line-clamp-1">{info.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mathematical Derivation Card */}
          <div className="bg-stone-900 text-white p-5 rounded-2xl shadow-2xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-800">
              <Calculator className="w-4 h-4 text-[#8DA391]" />
              <h4 className="font-bold text-xs text-white">Mifflin-St Jeor 기초대사량 & TDEE 산출</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-stone-800/80 p-3 rounded-xl border border-stone-700">
                <span className="text-[10px] text-stone-400 block mb-0.5">기초대사량 (BMR)</span>
                <span className="text-lg font-bold text-white tabular-nums">
                  {liveBmr.toLocaleString()} kcal/일
                </span>
                <p className="text-[10px] text-stone-400 mt-1 font-mono">
                  10×{weightKg} + 6.25×{heightCm} - 5×{age} {sex === 'MALE' ? '+ 5' : '- 161'}
                </p>
              </div>

              <div className="bg-stone-800/80 p-3 rounded-xl border border-stone-700">
                <span className="text-[10px] text-stone-400 block mb-0.5">총 에너지 소비량 (TDEE)</span>
                <span className="text-lg font-bold text-[#8DA391] tabular-nums">
                  {liveTdee.toLocaleString()} kcal/일
                </span>
                <p className="text-[10px] text-stone-400 mt-1 font-mono">
                  BMR × 활동계수({ACTIVITY_FACTORS[activityLevel].factor})
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-2xs transition active:scale-[0.98] flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>신체 정보 저장</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
