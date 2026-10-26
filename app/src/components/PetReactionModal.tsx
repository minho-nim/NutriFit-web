/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Award, Check, Sparkles, Utensils, X } from 'lucide-react';
import { PetProfile } from '../types/nutrition';
import { PetAvatar } from './PetAvatar';
import { getPetSatiety } from '../utils/petSatiety';

export interface PetReactionModalData {
  source?: 'FEEDBACK';
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  expGained: number;
  affectionGained: number;
  explorationGained: number;
  isStageUp: boolean;
  dialogueMessage: string;
}

interface PetReactionModalProps {
  pet: PetProfile;
  data: PetReactionModalData;
  onClose: () => void;
}

export const PetReactionModal: React.FC<PetReactionModalProps> = ({
  pet,
  data,
  onClose,
}) => {
  const satiety = getPetSatiety(pet);
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-stone-200/80 text-center relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebratory Stage Up Banner */}
        {data.isStageUp && (
          <div className="mb-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white py-1.5 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs animate-bounce">
            <Sparkles className="w-3.5 h-3.5" />
            <span>성장 단계 상승! {pet.stageName} 달성!</span>
          </div>
        )}

        {/* Eating Animated Pet Avatar */}
        <div className="my-2 flex justify-center">
          <PetAvatar
            stage={pet.growthStage} evolutionPath={pet.evolutionPath} satiety={satiety}
            mood={satiety >= 95 ? 'SLEEPY' : 'HAPPY'}
            size="lg"
            isEating={!data.source && satiety < 95}
          />
        </div>

        {/* Meal Title & Partner Quote */}
        <div className="space-y-1.5 mt-3">
          <span className="text-[11px] font-bold text-[#435746] bg-[#EEF2EE] px-2.5 py-0.5 rounded-full inline-block">
            {data.source ? '취향 피드백으로 함께 성장했어요' : `${pet.petName}와(과) 함께한 식사 기록`}
          </span>
          <h3 className="font-bold text-lg text-stone-900 tracking-tight">
            {data.foodName}
          </h3>
          <p className="text-xs text-stone-600 font-medium px-2 leading-relaxed">
            "{data.dialogueMessage}"
          </p>
        </div>

        {/* Nutrient Quick Snapshot */}
        {!data.source && <div className="grid grid-cols-4 gap-1.5 my-4 py-2.5 px-3 bg-stone-50 rounded-2xl border border-stone-100 text-center text-xs">
          <div>
            <span className="text-[10px] text-stone-400 block">열량</span>
            <strong className="text-stone-900 font-bold tabular-nums">{data.calories}</strong>
            <span className="text-[9px] text-stone-400 block">kcal</span>
          </div>
          <div>
            <span className="text-[10px] text-stone-400 block">단백질</span>
            <strong className="text-stone-900 font-bold tabular-nums">{data.protein}</strong>
            <span className="text-[9px] text-stone-400 block">g</span>
          </div>
          <div>
            <span className="text-[10px] text-stone-400 block">탄수화물</span>
            <strong className="text-stone-900 font-bold tabular-nums">{data.carbs}</strong>
            <span className="text-[9px] text-stone-400 block">g</span>
          </div>
          <div>
            <span className="text-[10px] text-stone-400 block">지방</span>
            <strong className="text-stone-900 font-bold tabular-nums">{data.fat}</strong>
            <span className="text-[9px] text-stone-400 block">g</span>
          </div>
        </div>

        }
        {/* Rewards Earned */}
        <div className="flex items-center justify-center gap-3 text-xs font-semibold py-1 mb-4 text-[#334636]">
          <span className="bg-[#EEF2EE] px-2.5 py-1 rounded-xl border border-stone-200/80">
            +{data.expGained} EXP
          </span>
          <span className="bg-[#EEF2EE] px-2.5 py-1 rounded-xl border border-stone-200/80">
            +{data.affectionGained} 친밀도
          </span>
          {data.explorationGained > 0 && (
            <span className="bg-[#EEF2EE] px-2.5 py-1 rounded-xl border border-stone-200/80">
              +{data.explorationGained} 탐험도
            </span>
          )}
        </div>

        {/* Confirm Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-[#435746] hover:bg-[#344637] text-white rounded-2xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 active:scale-[0.98]"
        >
          <Check className="w-4 h-4" />
          <span>{data.source ? '성장 확인했어!' : '맛있게 먹었어!'}</span>
        </button>
      </div>
    </div>
  );
};
