/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Database,
  Download,
  FileText,
  Lock,
  RefreshCcw,
  RotateCcw,
  Settings,
  Shield,
  Upload,
} from 'lucide-react';
import { StorageService } from '../services/storage';

interface AppSettingsProps {
  onDataResetOrImported: () => void;
}

export const AppSettings: React.FC<AppSettingsProps> = ({ onDataResetOrImported }) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleExport = () => {
    const json = StorageService.exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nutrifit-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = StorageService.importAllData(content);
      if (success) {
        setImportStatus('백업 데이터 복원이 성공적으로 완료되었습니다.');
        onDataResetOrImported();
      } else {
        setImportStatus('데이터 형식 파싱 오류가 발생했습니다. 올바른 백업 파일을 선택하세요.');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm('모든 기록을 초기 데모 상태로 초기화하시겠습니까?')) {
      StorageService.resetToDefault();
      onDataResetOrImported();
      setImportStatus('기본 테스트 데이터로 초기화되었습니다.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-600" />
          앱 설정 및 데이터 관리 (SCR-13)
        </h2>
        <p className="text-xs text-slate-500">
          로컬 브라우저 저장소 데이터 백업, 복원 및 데이터 프라이버시 정책을 관리합니다.
        </p>
      </div>

      {importStatus && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Backup & Restore */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-600" />
          <span>데이터 백업 및 복원 (Data Export & Import)</span>
        </h3>
        <p className="text-xs text-slate-500">
          사용자의 프로필, 영양 목표, 식사 기록, 체중 이력, 알레르기 설정 일체를 JSON 파일로 안전하게 다운로드하거나 불러올 수 있습니다.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-2xs transition"
          >
            <Download className="w-4 h-4" />
            <span>전체 데이터 백업 다운로드 (.json)</span>
          </button>

          <label className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer shadow-2xs transition">
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>백업 파일 복원 불러오기</span>
            <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          </label>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition ml-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>초기 데모 데이터로 리셋</span>
          </button>
        </div>
      </div>

      {/* Official Data Source & Verification Notice */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-600" />
          <span>식품 영양성분 및 데이터 출처 공시 (PART 5.1 준수)</span>
        </h3>
        <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
          <p>
            1. <strong>식품의약품안전처:</strong> 식품영양성분 데이터베이스 공공누리 개방 데이터
          </p>
          <p>
            2. <strong>농촌진흥청 국립농업과학원:</strong> 국가표준식품성분표 제10개정판 (2024)
          </p>
          <p>
            3. <strong>외식 영양성분 자료집:</strong> 한국 다빈도 외식 메뉴 및 프랜차이즈 공시 영양정보
          </p>
          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            * 사용자가 직접 등록한 음식(USER_CUSTOM)과 AI가 사진에서 추정한 영양소(AI_ESTIMATED)는 공식 검증 데이터와 명확히 구분되어 관리됩니다.
          </p>
        </div>
      </div>

      {/* Privacy & Safety Pledges */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>보안 및 개인정보 보호 원칙 (PART 16 준수)</span>
        </h3>
        <div className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
          <p className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>민감 신체 정보(체중, 신장, 알레르기)는 암호화된 세션 및 사용자 브라우저 로컬 저장소에 우선 보관됩니다.</span>
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>AI 사진 분석 요청 시 전송되는 이미지 데이터는 음식 식별 목적 이외의 용도로 일체 보관되지 않습니다.</span>
          </p>
          <p className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>알레르기 안전 판정은 사용자의 안전을 최우선으로 하여, 불확실한 성분은 '미검증/확인 필요' 상태로 엄격하게 고지합니다.</span>
          </p>
        </div>
      </div>
    </div>
  );
};
