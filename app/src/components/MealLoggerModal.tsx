/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useId } from 'react';
import {
  AlertTriangle,
  Camera,
  Check,
  ChevronLeft,
  Info,
  Plus,
  Search,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { VERIFIED_FOODS } from '../data/mockFoods';
import { analyzeFoodImage } from '../services/api';
import {
  FoodItem,
  FoodLog,
  MealType,
  UserAllergyConfig,
} from '../types/nutrition';
import {
  MEAL_TYPE_LABELS,
  scaleNutrients,
  verifyAllergens,
} from '../utils/nutritionEngine';

// Quick preset demo pictures for testing photo detection
const PRESET_DEMO_PHOTOS = [
  {
    name: '닭가슴살 샐러드',
    img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80',
    weight: 250,
  },
  {
    name: '소고기 야채 비빔밥',
    img: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=300&q=80',
    weight: 450,
  },
  {
    name: '새우 볶음밥 (알레르기 포함)',
    img: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=300&q=80',
    weight: 320,
  },
];

interface MealLoggerModalProps {
  initialFood?: FoodItem;
  initialMealType: MealType;
  selectedDate: string;
  userAllergies: UserAllergyConfig[];
  customFoods: FoodItem[];
  onSaveFoodLog: (log: Omit<FoodLog, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onSaveCustomFood: (food: FoodItem) => void;
  onClose: () => void;
}

export const MealLoggerModal: React.FC<MealLoggerModalProps> = ({
  initialFood,
  initialMealType,
  selectedDate,
  userAllergies,
  customFoods,
  onSaveFoodLog,
  onSaveCustomFood,
  onClose,
}) => {
  const photoInputId = useId();
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [mode, setMode] = useState<'SEARCH' | 'PHOTO' | 'CUSTOM'>('SEARCH');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(initialFood || null);
  const [weightG, setWeightG] = useState<number>(initialFood?.servingSize || 100);

  // Photo state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const photoRecognitionEnabled = import.meta.env.VITE_ENABLE_AI_PHOTO === 'true';

  // Custom food form state
  const [customName, setCustomName] = useState('');
  const [customGrams, setCustomGrams] = useState(100);
  const [customCal, setCustomCal] = useState(150);
  const [customCarbs, setCustomCarbs] = useState(20);
  const [customProt, setCustomProt] = useState(10);
  const [customFat, setCustomFat] = useState(3);

  // All foods
  const allFoods = [...VERIFIED_FOODS, ...customFoods];
  const searchResults = allFoods.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return f.name.toLowerCase().includes(q) || f.foodType.toLowerCase().includes(q);
  });

  // Calculate live scaled nutrition
  const scaled = selectedFood
    ? scaleNutrients(selectedFood, weightG)
    : { calories: 0, carbohydrates: 0, protein: 0, fat: 0, fiber: undefined };

  // Allergen verification
  const allergenCheck = selectedFood
    ? verifyAllergens(selectedFood, userAllergies)
    : { status: 'NOT_CHECKED' as const, matchedAllergens: [], crossContactAllergens: [], warningMessage: '' };

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setWeightG(food.servingSize || 100);
  };

  const handleConfirmLog = () => {
    if (!selectedFood) return;

    onSaveFoodLog({
      userId: 'user-default-01',
      foodId: selectedFood.id,
      foodNameSnapshot: selectedFood.name,
      ingredientsSnapshot: selectedFood.ingredients,
      allergensSnapshot: selectedFood.allergens,
      cookingMethodSnapshot: selectedFood.cookingMethod,
      flavorProfileSnapshot: selectedFood.flavorProfile,
      mealType,
      consumedAt: new Date().toISOString(),
      consumedDate: selectedDate,
      weightG,
      calories: scaled.calories,
      carbohydrates: scaled.carbohydrates,
      protein: scaled.protein,
      fat: scaled.fat,
      fiber: scaled.fiber,
      inputMethod: mode === 'PHOTO' ? 'PHOTO_AI' : mode === 'SEARCH' ? 'SEARCH' : 'CUSTOM_INPUT',
      allergenStatus: allergenCheck.status,
      detectedAllergens: allergenCheck.matchedAllergens,
      photoUrl: photoPreview || undefined,
    });
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = reader.result as string;
      setPhotoPreview(b64);
      await analyzePhoto(b64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const analyzePhoto = async (base64: string, mime: string) => {
    if (!photoRecognitionEnabled) return;
    setPhotoError('');
    setIsAnalyzing(true);
    try {
      const res = await analyzeFoodImage(base64, mime);
      if (res.recognizedFoods && res.recognizedFoods.length > 0) {
        const top = res.recognizedFoods[0];
        const matched = top.matchedFood || {
          id: `ai-food-${Date.now()}`,
          name: top.foodName,
          foodType: 'AI 인식 음식',
          servingSize: top.estimatedWeightG,
          servingUnit: `${top.estimatedWeightG}g`,
          nutritionBasisGrams: 100,
          calories: top.nutritionPer100g.calories,
          carbohydrates: top.nutritionPer100g.carbohydrates,
          protein: top.nutritionPer100g.protein,
          fat: top.nutritionPer100g.fat,
          ingredients: top.ingredients || [],
          allergens: [],
          sourceType: 'AI_ESTIMATED',
          sourceReference: 'Gemini 3.8 Flash Vision 분석',
          verifiedAt: new Date().toISOString().split('T')[0],
        };
        setSelectedFood(matched);
        setWeightG(top.estimatedWeightG || 180);
      }
    } catch (err) {
      console.error(err);
      setSelectedFood(null);
      setPhotoError('사진을 분석하지 못했습니다. 음식 검색이나 직접 입력으로 기록해 주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newFood: FoodItem = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      foodType: '직접 등록',
      servingSize: customGrams,
      servingUnit: `${customGrams}g`,
      nutritionBasisGrams: 100,
      calories: customCal,
      carbohydrates: customCarbs,
      protein: customProt,
      fat: customFat,
      ingredients: ['직접 입력'],
      allergens: [],
      sourceType: 'USER_CUSTOM',
      sourceReference: '사용자 직접 등록',
      verifiedAt: new Date().toISOString().split('T')[0],
      isCustom: true,
    };

    onSaveCustomFood(newFood);
    setSelectedFood(newFood);
    setWeightG(customGrams);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-xl overflow-hidden animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedFood && (
              <button
                onClick={() => setSelectedFood(null)}
                className="p-1 -ml-1 text-slate-400 hover:text-slate-700"
                aria-label="뒤로 가기"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h3 className="font-bold text-base text-slate-900">
              {selectedFood ? '섭취량 설정' : '식사 기록'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Meal Type Pill Selector */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto">
          <span className="text-xs text-slate-400 shrink-0 mr-1">끼니:</span>
          {(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as MealType[]).map((m) => (
            <button
              key={m}
              onClick={() => setMealType(m)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition shrink-0 ${
                mealType === m
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {MEAL_TYPE_LABELS[m].name}
            </button>
          ))}
        </div>

        {/* Content Body: Either Selecting Food OR Adjusting Portion */}
        {!selectedFood ? (
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Mode Switcher */}
            <div className="flex border-b border-slate-100 text-xs font-semibold">
              <button
                onClick={() => setMode('SEARCH')}
                className={`flex-1 py-3 text-center transition border-b-2 ${
                  mode === 'SEARCH'
                    ? 'border-emerald-600 text-emerald-700 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                음식 검색
              </button>
              <button
                onClick={() => setMode('PHOTO')}
                disabled={!photoRecognitionEnabled}
                title={photoRecognitionEnabled ? '사진으로 음식 분석' : '이 버전에서는 음식 검색과 직접 입력을 사용해 주세요.'}
                className={`flex-1 py-3 text-center transition border-b-2 ${
                  mode === 'PHOTO'
                    ? 'border-emerald-600 text-emerald-700 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                사진 인식
              </button>
              <button
                onClick={() => setMode('CUSTOM')}
                className={`flex-1 py-3 text-center transition border-b-2 ${
                  mode === 'CUSTOM'
                    ? 'border-emerald-600 text-emerald-700 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                직접 입력
              </button>
            </div>

            {/* Mode 1: Search */}
            {!photoRecognitionEnabled && <p className="px-4 pt-3 text-xs text-slate-500">음식 검색이나 직접 입력으로 식사를 기록해 주세요. 이 버전은 AI 사진 분석을 사용하지 않습니다.</p>}
            {mode === 'SEARCH' && (
              <div className="p-4 space-y-3 flex-1 flex flex-col">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="음식명 검색 (예: 닭가슴살, 현미밥, 된장찌개)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-96">
                  {searchResults.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => handleSelectFood(f)}
                      className="py-3 px-2 flex items-center justify-between hover:bg-slate-50 cursor-pointer rounded-lg transition"
                    >
                      <div>
                        <div className="font-semibold text-xs text-slate-900">{f.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {f.servingUnit} · 100g당 {f.calories} kcal · 단백질 {f.protein}g
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                  {searchResults.length === 0 && (
                    <div className="py-12 text-center text-xs text-slate-400">
                      검색 결과가 없습니다. '직접 입력' 탭을 이용해 보세요.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mode 2: Photo Recognition */}
            {mode === 'PHOTO' && (
              <div className="p-5 space-y-4">
                {photoError && <p role="alert" className="text-xs text-rose-600">{photoError}</p>}
                <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/50">
                  {photoPreview ? (
                    <div className="space-y-3">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-36 h-36 object-cover mx-auto rounded-xl shadow-xs"
                      />
                      <label
                        htmlFor={photoInputId}
                        className="inline-block text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer underline"
                      >
                        다른 사진 선택
                      </label>
                      <input
                        id={photoInputId}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="sr-only"
                      />
                    </div>
                  ) : (
                    <div>
                      <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-700">
                        음식 사진을 찍거나 올려주세요
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        AI가 음식명과 중량을 추정합니다
                      </p>
                      <label
                        htmlFor={photoInputId}
                        className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-800 transition"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>사진 올리기</span>
                      </label>
                      <input
                        id={photoInputId}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="sr-only"
                      />
                    </div>
                  )}

                  {isAnalyzing && (
                    <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-semibold animate-pulse">
                      <Sparkles className="w-4 h-4" />
                      <span>Gemini AI가 음식을 분석 중입니다...</span>
                    </div>
                  )}
                </div>

                {/* Preset demos */}
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-2">
                    빠른 테스트용 샘플 사진
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_DEMO_PHOTOS.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setPhotoPreview(p.img);
                          const matched = VERIFIED_FOODS.find((f) => f.name.includes(p.name.split(' ')[0])) || VERIFIED_FOODS[0];
                          setSelectedFood(matched);
                          setWeightG(p.weight);
                        }}
                        className="text-left border border-slate-200 rounded-xl overflow-hidden hover:border-slate-400 transition"
                      >
                        <img src={p.img} alt={p.name} className="w-full h-16 object-cover" />
                        <span className="text-[10px] font-semibold text-slate-700 block p-1.5 truncate">
                          {p.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mode 3: Custom Input */}
            {mode === 'CUSTOM' && (
              <form onSubmit={handleCreateCustom} className="p-5 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">음식명 *</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 닭가슴살 볶음밥"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">섭취량 (g)</label>
                    <input
                      type="number"
                      min={10}
                      value={customGrams}
                      onChange={(e) => setCustomGrams(Number(e.target.value))}
                      className="w-full text-xs p-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">칼로리 (kcal)</label>
                    <input
                      type="number"
                      min={0}
                      value={customCal}
                      onChange={(e) => setCustomCal(Number(e.target.value))}
                      className="w-full text-xs p-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">탄수화물 (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={customCarbs}
                      onChange={(e) => setCustomCarbs(Number(e.target.value))}
                      className="w-full text-xs p-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">단백질 (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={customProt}
                      onChange={(e) => setCustomProt(Number(e.target.value))}
                      className="w-full text-xs p-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">지방 (g)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={customFat}
                      onChange={(e) => setCustomFat(Number(e.target.value))}
                      className="w-full text-xs p-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 mt-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
                >
                  음식 선택 및 섭취량 설정
                </button>
              </form>
            )}
          </div>
        ) : (
          /* Step 2: Portion & Nutrition Confirmation */
          <div className="p-5 space-y-4 overflow-y-auto">
            {/* Selected Food Info */}
            <div className="pb-3 border-b border-slate-100 flex items-start justify-between">
              <div>
                <h4 className="font-extrabold text-base text-slate-900">{selectedFood.name}</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  기준 {selectedFood.nutritionBasisGrams}g당 {selectedFood.calories} kcal
                </p>
              </div>
              <button
                onClick={() => setSelectedFood(null)}
                className="text-xs text-slate-500 hover:underline"
              >
                음식 다시 선택
              </button>
            </div>

            {/* Allergen Check Banner */}
            {allergenCheck.status === 'CONTAINS' && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">알레르기 성분 주의:</strong>
                  <p className="mt-0.5">{allergenCheck.warningMessage}</p>
                </div>
              </div>
            )}

            {/* Weight Slider & Quick chips */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">섭취 중량 (g)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={10}
                    max={1500}
                    value={weightG}
                    onChange={(e) => setWeightG(Number(e.target.value))}
                    className="w-16 p-1 text-right text-xs font-bold border border-slate-300 rounded-md"
                  />
                  <span className="text-xs text-slate-500">g</span>
                </div>
              </div>

              <input
                type="range"
                min={10}
                max={600}
                step={10}
                value={weightG}
                onChange={(e) => setWeightG(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer my-2"
              />

              <div className="flex gap-2">
                {[50, 100, 150, 200, 300].map((g) => (
                  <button
                    key={g}
                    onClick={() => setWeightG(g)}
                    className={`flex-1 py-1 rounded-lg text-xs font-semibold border transition ${
                      weightG === g
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {g}g
                  </button>
                ))}
              </div>
            </div>

            {/* Scaled Nutrients Summary */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                {weightG}g 기준 환산 영양소
              </span>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">칼로리</span>
                  <span className="font-extrabold text-slate-900">{scaled.calories}</span>
                  <span className="text-[10px] text-slate-400"> kcal</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">탄수화물</span>
                  <span className="font-bold text-slate-800">{scaled.carbohydrates}g</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">단백질</span>
                  <span className="font-bold text-slate-800">{scaled.protein}g</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">지방</span>
                  <span className="font-bold text-slate-800">{scaled.fat}g</span>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <button
              onClick={handleConfirmLog}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{MEAL_TYPE_LABELS[mealType].name} 기록 완료</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
