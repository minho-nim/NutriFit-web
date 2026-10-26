/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Info,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { STANDARD_ALLERGENS } from '../data/mockFoods';
import { UserAllergyConfig } from '../types/nutrition';

interface AllergySettingsProps {
  userAllergies: UserAllergyConfig[];
  onUpdateAllergies: (allergies: UserAllergyConfig[]) => void;
}

export const AllergySettings: React.FC<AllergySettingsProps> = ({
  userAllergies,
  onUpdateAllergies,
}) => {
  const [selectedStandardCode, setSelectedStandardCode] = useState<string>('');
  const [customAllergenName, setCustomAllergenName] = useState<string>('');

  const toggleAllergyActive = (allergenCode: string) => {
    const updated = userAllergies.map((a) =>
      a.allergenCode === allergenCode ? { ...a, isActive: !a.isActive } : a
    );
    onUpdateAllergies(updated);
  };

  const changeHandlingMode = (allergenCode: string, mode: 'WARN' | 'STRICT_EXCLUDE') => {
    const updated = userAllergies.map((a) =>
      a.allergenCode === allergenCode ? { ...a, handlingMode: mode } : a
    );
    onUpdateAllergies(updated);
  };

  const removeAllergy = (allergenCode: string) => {
    const updated = userAllergies.filter((a) => a.allergenCode !== allergenCode);
    onUpdateAllergies(updated);
  };

  const handleAddStandardAllergen = () => {
    if (!selectedStandardCode) return;
    const std = STANDARD_ALLERGENS.find((s) => s.code === selectedStandardCode);
    if (!std) return;

    if (userAllergies.some((a) => a.allergenCode === std.code)) {
      // already exists, just activate
      const updated = userAllergies.map((a) =>
        a.allergenCode === std.code ? { ...a, isActive: true } : a
      );
      onUpdateAllergies(updated);
    } else {
      const newAllergy: UserAllergyConfig = {
        allergenCode: std.code,
        allergenName: std.name,
        isActive: true,
        handlingMode: 'WARN',
        notes: `${std.category} 표준 분류 항목`,
      };
      onUpdateAllergies([...userAllergies, newAllergy]);
    }
    setSelectedStandardCode('');
  };

  const handleAddCustomAllergen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAllergenName.trim()) return;

    const code = `CUSTOM_${Date.now()}`;
    const newAllergy: UserAllergyConfig = {
      allergenCode: code,
      allergenName: customAllergenName.trim(),
      isActive: true,
      handlingMode: 'WARN',
      notes: '사용자 직접 추가 알레르기/기피 성분',
    };

    onUpdateAllergies([...userAllergies, newAllergy]);
    setCustomAllergenName('');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-600" />
          알레르기 및 식품 제한 관리 (SCR-11)
        </h2>
        <p className="text-xs text-slate-500">
          사용자의 알레르기 유발 식품과 기피 성분을 등록하여 식단 추천 및 음식 기록 전 과정에서 안전 검증을 수행합니다.
        </p>
      </div>

      {/* Verification Code Explanations Banner (PART 8.3) */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
        <h3 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-emerald-600" />
          <span>NutriFit 식품 안전 및 알레르기 검증 상태 기준 (PART 8.3 준수)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-rose-200">
            <span className="font-bold text-rose-700 flex items-center gap-1 mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              CONTAINS (포함 확인)
            </span>
            <p className="text-slate-600 text-[11px]">
              원재료 목록에서 사용자 등록 알레르기 성분이 직접 확인되어 강력 경고를 표시합니다.
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-amber-200">
            <span className="font-bold text-amber-800 flex items-center gap-1 mb-1">
              <AlertCircle className="w-3.5 h-3.5" />
              CROSS_CONTACT_RISK (교차접촉 주의)
            </span>
            <p className="text-slate-600 text-[11px]">
              동일 제조라인 또는 조리환경에서 교차오염 위험이 공시된 식품으로 주의를 안내합니다.
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-emerald-200">
            <span className="font-bold text-emerald-800 flex items-center gap-1 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              VERIFIED_NO_MATCH (성분 미검출)
            </span>
            <p className="text-slate-600 text-[11px]">
              확인된 공식 성분표에서 일치 항목 미검출. (단, 개인 체질에 따른 절대적 보증은 아닙니다)
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="font-bold text-slate-700 flex items-center gap-1 mb-1">
              <HelpCircle className="w-3.5 h-3.5" />
              UNKNOWN (정보 불충분)
            </span>
            <p className="text-slate-600 text-[11px]">
              원재료 정보가 부재하여 검증 불가. 안전하다고 단정하지 않고 확인 필요를 고지합니다.
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="font-bold text-slate-700 flex items-center gap-1 mb-1">
              <Shield className="w-3.5 h-3.5" />
              NOT_CHECKED (미설정)
            </span>
            <p className="text-slate-600 text-[11px]">
              알레르기 설정을 건너뛴 상태로 '알레르기 없음'이 아닌 '정보 미설정'으로 관리합니다.
            </p>
          </div>
        </div>
      </div>

      {/* Active Allergies List */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="font-bold text-sm text-slate-900">
            현재 등록된 알레르기 유발 식품 ({userAllergies.filter((a) => a.isActive).length}개 활성화)
          </h3>
          <span className="text-xs text-slate-400">초기 기본 프로필: 땅콩, 새우, 우유</span>
        </div>

        <div className="divide-y divide-slate-100">
          {userAllergies.map((allergy) => (
            <div key={allergy.allergenCode} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={allergy.isActive}
                  onChange={() => toggleAllergyActive(allergy.allergenCode)}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">
                      {allergenFormatName(allergy.allergenName)}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-sm font-semibold">
                      코드: {allergy.allergenCode}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {allergy.notes || '안전 필터링 항목'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Handling Policy dropdown */}
                <select
                  value={allergy.handlingMode}
                  onChange={(e) => changeHandlingMode(allergy.allergenCode, e.target.value as any)}
                  className="text-xs font-semibold p-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-700"
                >
                  <option value="WARN">WARN (경고 표시 및 대체 제안)</option>
                  <option value="STRICT_EXCLUDE">STRICT (추천에서 완전 배제)</option>
                </select>

                <button
                  onClick={() => removeAllergy(allergy.allergenCode)}
                  className="text-slate-300 hover:text-rose-600 p-1 transition"
                  title="항목 제거"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Allergen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Add from Standards */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h4 className="font-bold text-xs text-slate-900">식약처 19종 주요 알레르기 물질에서 추가</h4>
          <div className="flex gap-2">
            <select
              value={selectedStandardCode}
              onChange={(e) => setSelectedStandardCode(e.target.value)}
              className="flex-1 text-xs p-2.5 border border-slate-300 rounded-xl bg-white"
            >
              <option value="">알레르기 유발 식품 선택...</option>
              {STANDARD_ALLERGENS.map((std) => (
                <option key={std.code} value={std.code}>
                  {std.name} ({std.category})
                </option>
              ))}
            </select>
            <button
              onClick={handleAddStandardAllergen}
              disabled={!selectedStandardCode}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>추가</span>
            </button>
          </div>
        </div>

        {/* Custom Allergen / Restriction */}
        <form onSubmit={handleAddCustomAllergen} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h4 className="font-bold text-xs text-slate-900">기타 기피 식품 및 사용자 맞춤 제한 성분</h4>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="예: 복숭아, 고수, 카페인, 글루텐 등"
              value={customAllergenName}
              onChange={(e) => setCustomAllergenName(e.target.value)}
              className="flex-1 text-xs p-2.5 border border-slate-300 rounded-xl"
            />
            <button
              type="submit"
              disabled={!customAllergenName.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>등록</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

function allergenFormatName(name: string): string {
  return name;
}
