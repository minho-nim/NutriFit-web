/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle,
  Clock,
  Info,
  Plus,
  Scale,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { getTodayString } from '../services/storage';
import { UserProfile, WeightLog } from '../types/nutrition';

interface WeightTrackerProps {
  profile: UserProfile;
  weightLogs: WeightLog[];
  onAddWeightLog: (weightKg: number, measuredAt: string, note?: string) => void;
  onDeleteWeightLog: (logId: string) => void;
  onUpdateCurrentWeight: (newWeight: number) => void;
}

export const WeightTracker: React.FC<WeightTrackerProps> = ({
  profile,
  weightLogs,
  onAddWeightLog,
  onDeleteWeightLog,
  onUpdateCurrentWeight,
}) => {
  const [inputWeight, setInputWeight] = useState<number>(profile.currentWeightKg);
  const [inputDate, setInputDate] = useState<string>(getTodayString());
  const [inputNote, setInputNote] = useState<string>('아침 공복 측정');

  const sortedLogs = [...weightLogs].sort(
    (a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime()
  );

  const latestWeight = sortedLogs.length > 0 ? sortedLogs[0].weightKg : profile.currentWeightKg;
  const initialWeight = sortedLogs.length > 0 ? sortedLogs[sortedLogs.length - 1].weightKg : profile.currentWeightKg;
  const targetWeight = profile.targetWeightKg;

  // Total change from start
  const totalChangeKg = Number((latestWeight - initialWeight).toFixed(1));
  const remainingToTargetKg = Number((latestWeight - targetWeight).toFixed(1));

  // BMI Calculation (Asian/Korean standard)
  const heightM = profile.heightCm / 100;
  const bmi = Number((latestWeight / (heightM * heightM)).toFixed(1));

  let bmiLabel = '정상';
  let bmiColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (bmi < 18.5) {
    bmiLabel = '저체중';
    bmiColor = 'text-amber-700 bg-amber-50 border-amber-200';
  } else if (bmi >= 23 && bmi < 25) {
    bmiLabel = '비만 전단계(과체중)';
    bmiColor = 'text-amber-800 bg-amber-50 border-amber-200';
  } else if (bmi >= 25) {
    bmiLabel = '비만 (1단계 이상)';
    bmiColor = 'text-rose-700 bg-rose-50 border-rose-200';
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputWeight || inputWeight <= 0) return;

    onAddWeightLog(inputWeight, inputDate, inputNote.trim() || undefined);
    if (!sortedLogs.length || inputDate >= sortedLogs[0].measuredAt) onUpdateCurrentWeight(inputWeight);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Scale className="w-5 h-5 text-emerald-600" />
          체중 및 진행 현황 (SCR-10)
        </h2>
        <p className="text-xs text-slate-500">
          체중 변화 추세를 안전하게 추적하고 목표 달성률을 확인합니다.
        </p>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Current Weight */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 block">최근 기록 체중</span>
          <div className="text-3xl font-black text-slate-900 mt-1">
            {latestWeight} <span className="text-sm font-normal text-slate-500">kg</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${bmiColor}`}>
              BMI {bmi} ({bmiLabel})
            </span>
          </div>
        </div>

        {/* Target Weight */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 block">목표 체중</span>
          <div className="text-3xl font-black text-emerald-700 mt-1">
            {targetWeight} <span className="text-sm font-normal text-slate-500">kg</span>
          </div>
          <div className="text-xs text-slate-600 mt-2 font-medium">
            {remainingToTargetKg > 0 ? (
              <span>목표까지 <strong className="text-emerald-700 font-bold">{remainingToTargetKg}kg</strong> 남음</span>
            ) : (
              <span className="text-emerald-700 font-bold">목표 체중 달성 완료!</span>
            )}
          </div>
        </div>

        {/* Change from Start */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 block">시작 대비 누적 변화</span>
          <div className="text-3xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <span>{totalChangeKg > 0 ? `+${totalChangeKg}` : totalChangeKg}</span>
            <span className="text-sm font-normal text-slate-500">kg</span>
            {totalChangeKg < 0 ? (
              <TrendingDown className="w-5 h-5 text-emerald-600" />
            ) : totalChangeKg > 0 ? (
              <TrendingUp className="w-5 h-5 text-amber-600" />
            ) : null}
          </div>
          <span className="text-xs text-slate-400 mt-2 block">
            시작 체중: {initialWeight}kg
          </span>
        </div>
      </div>

      {/* Add Weight Entry Form */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h3 className="font-extrabold text-sm text-slate-900 mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-600" />
          <span>새 체중 측정값 기록하기</span>
        </h3>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">체중 (kg)</label>
            <input
              type="number"
              step="0.1"
              min="20"
              max="250"
              required
              value={inputWeight}
              onChange={(e) => setInputWeight(Number(e.target.value))}
              className="w-full text-xs font-bold p-2.5 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">측정 날짜</label>
            <input
              type="date"
              required
              value={inputDate}
              onChange={(e) => setInputDate(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">측정 메모</label>
            <input
              type="text"
              placeholder="예: 공복 측정, 운동 후"
              value={inputNote}
              onChange={(e) => setInputNote(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              체중 저장하기
            </button>
          </div>
        </form>
      </div>

      {/* Clinical Guidance Notice (PART 11.2) */}
      <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">체중 변화 분석 및 안전 가이드라인:</strong>
          <p className="mt-1 leading-relaxed text-blue-800">
            수분 섭취, 나트륨 반응, 호르몬 주기 등에 따라 일일 1~2kg의 단기 변동은 자연스러운 생리 현상입니다.
            NutriFit은 단기 변동만으로 칼로리 목표를 급격하게 제한하지 않으며, 최소 2주 이상의 장기 추세를 기준으로 안전한 목표 유지를 권장합니다.
          </p>
        </div>
      </div>

      {/* Weight History Timeline */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <h3 className="font-extrabold text-sm text-slate-900">체중 기록 이력 (최신순)</h3>

        <div className="divide-y divide-slate-100">
          {sortedLogs.map((log) => (
            <div key={log.id} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-sm">
                    {log.weightKg} <span className="text-xs font-normal text-slate-500">kg</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {log.measuredAt} {log.note && `· "${log.note}"`}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onDeleteWeightLog(log.id)}
                className="text-slate-300 hover:text-rose-500 p-1.5 transition"
                title="기록 삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
