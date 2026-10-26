import { FoodLog, PetDietGroup, PetEvolutionPath, PetProfile, PetStage } from '../types/nutrition';
import { VERIFIED_FOODS } from '../data/mockFoods';
import { plentifulMealCount } from './petSatiety';

export const EVOLUTION_PATHS: PetEvolutionPath[] = ['GARDEN', 'PROTEIN', 'GRAIN', 'BALANCED', 'PIG'];
export const TOTAL_PET_FORMS = 17;
export const EVOLUTION_CONFIG: Record<PetEvolutionPath, { name: string; hint: string; color: string; body: string; titles: string[] }> = {
  GARDEN: { name: '푸른 정원', hint: '채소·과일·식이섬유가 있는 식사를 함께 기록해 보세요.', color: '#4B8566', body: '#DDF0DF', titles: ['새싹', '잎새 친구', '꽃 정원사', '숲의 수호자'] },
  PROTEIN: { name: '튼튼한 모험가', hint: '콩·두부·달걀·생선 등 단백질 식재료를 만나 보세요.', color: '#AD604C', body: '#FFE4D6', titles: ['새싹', '씩씩한 탐험가', '용감한 대장', '별빛 모험가'] },
  GRAIN: { name: '곡물 친구', hint: '밥·귀리·통곡물처럼 곡물이 있는 식사를 함께해 보세요.', color: '#AD8536', body: '#FAEDCC', titles: ['새싹', '포근한 곡물 친구', '황금 들판 지기', '풍요의 마법사'] },
  BALANCED: { name: '다채로운 셰프', hint: '여러 식재료 계열을 고루 만나면 이 방향으로 자라요.', color: '#8074B5', body: '#EDE5FF', titles: ['새싹', '꼬마 셰프', '무지개 요리사', '미식의 마스터'] },
  PIG: { name: '포근한 미식 돼지', hint: '최근 7일에 배부른 식사 기억을 3번 남기고 진화하면 만나요. 첫 단계는 완전 성장 후 새 이야기에서 발견할 수 있어요.', color: '#B86D89', body: '#F8DCE5', titles: ['아기 꿀꿀이', '먹보 꼬마', '복슬복슬 요리사', '미식 돼지왕'] },
};

export function petDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function petFormKey(path: PetEvolutionPath, stage: PetStage): string {
  return stage === 1 && path !== 'PIG' ? 'SEED:1' : `${path}:${stage}`;
}

export function getPetFormTitle(pet: PetProfile): string {
  return pet.growthStage === 1 && pet.evolutionPath !== 'PIG' ? '새싹 밥친구' : EVOLUTION_CONFIG[pet.evolutionPath || 'BALANCED'].titles[pet.growthStage - 1];
}

export function normalizePetEvolution(pet: PetProfile): PetProfile {
  const evolutionPath = EVOLUTION_PATHS.includes(pet.evolutionPath!) ? pet.evolutionPath! : 'BALANCED';
  const knownForms = new Set(['SEED:1', 'PIG:1', ...EVOLUTION_PATHS.flatMap((path) => [2, 3, 4].map((stage) => `${path}:${stage}`))]);
  const forms = Array.isArray(pet.unlockedForms) ? pet.unlockedForms.filter((form) => knownForms.has(form)) : [];
  // Existing pets retain their present appearance, without revealing other paths.
  const unlockedForms = [...new Set(['SEED:1', ...forms, petFormKey(evolutionPath, pet.growthStage)])];
  const dietEntries: NonNullable<PetProfile['dietEntries']> = [];
  for (const entry of Array.isArray(pet.dietEntries) ? pet.dietEntries : []) {
    if (!entry || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date) || !['BREAKFAST', 'LUNCH', 'DINNER'].includes(entry.mealType) || !Array.isArray(entry.groups)) continue;
    const groups = entry.groups.filter((group) => ['GARDEN', 'PROTEIN', 'GRAIN'].includes(group));
    if (!groups.length || entry.date < cutoffDate(new Date()) || entry.date > petDateKey()) continue;
    const existing = dietEntries.find((item) => item.date === entry.date && item.mealType === entry.mealType);
    if (existing) existing.groups = [...new Set([...existing.groups, ...groups])];
    else dietEntries.push({ date: entry.date, mealType: entry.mealType, groups: [...new Set(groups)] });
  }
  return { ...pet, evolutionPath, unlockedForms, dietEntries };
}

function cutoffDate(now: Date): string {
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  return petDateKey(start);
}

export function getDietOutlook(pet: PetProfile, now = new Date()) {
  const scores: Record<PetDietGroup, number> = { GARDEN: 0, PROTEIN: 0, GRAIN: 0 };
  const entries = (pet.dietEntries || []).filter((entry) => entry.date >= cutoffDate(now) && entry.date <= petDateKey(now));
  for (const entry of entries) {
    for (const group of new Set(entry.groups)) if (group in scores) scores[group]++;
  }
  const ordered = (Object.entries(scores) as [PetDietGroup, number][]).sort((a, b) => b[1] - a[1]);
  const total = ordered.reduce((sum, [, value]) => sum + value, 0);
  const path: PetEvolutionPath = plentifulMealCount(pet, now) >= 3 ? 'PIG' : !total || ordered[0][1] <= total * 0.55 ? 'BALANCED' : ordered[0][0];
  return { path, scores, mealCount: entries.length, dayCount: new Set(entries.map((entry) => entry.date)).size };
}

type DietMeal = Pick<FoodLog, 'foodId' | 'foodNameSnapshot' | 'consumedDate' | 'mealType' | 'weightG' | 'calories' | 'protein' | 'carbohydrates' | 'fat'> & Partial<Pick<FoodLog, 'ingredientsSnapshot' | 'fiber'>>;

export function recordDietMeal(pet: PetProfile, log: DietMeal, now = new Date()): PetProfile {
  const normalized = normalizePetEvolution(pet);
  // Historical edits and snacks cannot farm new evolution points.
  if (log.consumedDate !== petDateKey(now) || log.mealType === 'SNACK' || !(log.weightG > 0) || !(log.calories > 0)) return normalized;
  const groups = mealDietGroups(log);
  if (!groups.length) return normalized;
  const entries = normalized.dietEntries!.filter((entry) => entry.date >= cutoffDate(now) && entry.date <= petDateKey(now));
  const index = entries.findIndex((entry) => entry.date === log.consumedDate && entry.mealType === log.mealType);
  if (index < 0) entries.push({ date: log.consumedDate, mealType: log.mealType, groups });
  else entries[index] = { ...entries[index], groups: [...new Set([...entries[index].groups, ...groups])] };
  return { ...normalized, dietEntries: entries };
}

function mealDietGroups(log: DietMeal): PetDietGroup[] {
  if (!(log.weightG > 0) || !(log.calories > 0) || log.mealType === 'SNACK') return [];
  const food = VERIFIED_FOODS.find((item) => item.id === log.foodId);
  const ingredients = `${log.foodNameSnapshot} ${(log.ingredientsSnapshot || food?.ingredients || []).join(' ')}`;
  const groups: PetDietGroup[] = [];
  const energy = log.protein * 4 + log.carbohydrates * 4 + log.fat * 9;
  if (/채소|샐러드|나물|브로콜리|시금치|양배추|당근|토마토|버섯|상추|양상추|과일|사과|바나나|베리|아보카도|오이/.test(ingredients) || ((log.fiber || 0) / log.weightG) * 100 >= 2) groups.push('GARDEN');
  if (/두부|콩|달걀|계란|닭|쇠고기|소고기|돼지|연어|생선|참치|고등어|새우|요거트/.test(ingredients) || energy > 0 && log.protein * 4 / energy >= 0.25) groups.push('PROTEIN');
  if (/밥|쌀|귀리|현미|곡물|퀴노아|오트|보리|통밀|빵|면|고구마|감자/.test(ingredients) || energy > 0 && log.carbohydrates * 4 / energy >= 0.5) groups.push('GRAIN');
  return groups;
}

export function reconcilePetDiet(pet: PetProfile, logs: FoodLog[]): PetProfile {
  const normalized = normalizePetEvolution(pet);
  const dietEntries = normalized.dietEntries!.map((entry) => ({
    ...entry, groups: [...new Set(logs.filter((log) => log.consumedDate === entry.date && log.mealType === entry.mealType &&
      pet.rewardedMealLogIds.includes(log.id) && (!pet.generationStartedAt || log.createdAt >= pet.generationStartedAt))
      .flatMap(mealDietGroups))],
  })).filter((entry) => entry.groups.length > 0);
  return { ...normalized, dietEntries };
}

export function advancePetEvolution(pet: PetProfile, nextStage: PetStage): PetProfile {
  const normalized = normalizePetEvolution(pet);
  if (nextStage <= pet.growthStage) return normalized;
  const path = getDietOutlook(normalized).path;
  return {
    ...normalized, evolutionPath: path,
    unlockedForms: [...new Set([...normalized.unlockedForms!, petFormKey(path, nextStage)])],
  };
}
