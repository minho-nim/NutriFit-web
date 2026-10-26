import type { FoodLog, PetMood, PetProfile } from '../types/nutrition';
import { getPetSatiety } from './petSatiety';

const dayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const hasPlayedToday = (pet: PetProfile, now = new Date()) => pet.dailyPlayDate === dayKey(now);

export function mealMemory(logs: FoodLog[], now = new Date()): { message: string; food: string } | null {
  const today = dayKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const past = logs.filter((log) => log.consumedDate <= today && log.calories > 0 && log.weightG > 0)
    .sort((a, b) => b.consumedDate.localeCompare(a.consumedDate) || b.consumedAt.localeCompare(a.consumedAt));
  const yesterdayLog = past.find((log) => log.consumedDate === dayKey(yesterday));
  if (yesterdayLog) {
    const repeated = past.some((log) => log.consumedDate === today && log.foodNameSnapshot === yesterdayLog.foodNameSnapshot);
    return { food: yesterdayLog.foodNameSnapshot, message: repeated
      ? `어제도 ${yesterdayLog.foodNameSnapshot} 먹었네! 이제 우리 단골 메뉴다.`
      : `어제 함께 먹은 ${yesterdayLog.foodNameSnapshot}, 아직 기억나. 같이 먹어서 좋았어!` };
  }
  const favorite = past.find((log) => (log.satisfactionRating || 0) >= 4);
  if (favorite) return { food: favorite.foodNameSnapshot, message: `${favorite.foodNameSnapshot}에 높은 별점을 줬었지? 네가 좋아하는 맛, 기억하고 있어.` };
  if (past[0]) return { food: past[0].foodNameSnapshot, message: `우리 함께 먹은 ${past[0].foodNameSnapshot}, 소중한 식사 기억으로 남아 있어.` };
  return null;
}

export function companionBehavior(pet: PetProfile, logs: FoodLog[], now = new Date()): { label: string; message: string; mood: PetMood; motion: 'rest' | 'wave' | 'hop' | 'sway' } {
  const full = getPetSatiety(pet, now);
  if (full >= 95) return { label: '배 토닥토닥', message: '아 배불러~ 그래도 맛은 있네. 잠깐 누워서 쉴래!', mood: 'SLEEPY', motion: 'rest' };
  if (full >= 75) return { label: '포근하게 쉬는 중', message: '배가 든든해. 네 옆에서 느긋하게 쉬고 싶어.', mood: 'SAVORING', motion: 'sway' };
  const recent = logs.find((log) => log.consumedDate === dayKey(now) && (log.satisfactionRating || 0) >= 4);
  if (recent) return { label: '좋아하는 맛을 만났어', message: `${recent.foodNameSnapshot}! 네가 좋아하니까 나도 신나.`, mood: 'EXCITED', motion: 'hop' };
  switch (pet.personality) {
    case 'CURIOUS_EXPLORER': return { label: '공을 데굴데굴', message: '오늘도 반가워! 나랑 공놀이 한 번 할래?', mood: 'CURIOUS', motion: 'wave' };
    case 'GOURMET_CHEF': return { label: '오늘의 맛을 생각 중', message: '왔구나. 오늘 함께할 맛있는 한 끼가 기대돼.', mood: 'THINKING', motion: 'sway' };
    case 'CHEERFUL_VITAMIN': return { label: '신나게 반기는 중', message: '기다렸어! 너를 보니까 벌써 기분이 좋아!', mood: 'CHEERING', motion: 'hop' };
    default: return { label: '반가워, 오늘도', message: '찾아와줘서 좋아. 오늘도 네 옆에 있을게.', mood: 'HAPPY', motion: 'wave' };
  }
}

export function completeDailyPlay(pet: PetProfile, now = new Date()): PetProfile {
  if (hasPlayedToday(pet, now)) return pet;
  return { ...pet, dailyPlayDate: dayKey(now), affection: Math.min(100, pet.affection + 3),
    interactionCount: (pet.interactionCount || 0) + 1, lastInteractedAt: now.toISOString(), updatedAt: now.toISOString() };
}

export function captureGrowthMemory(before: PetProfile, after: PetProfile, logs: FoodLog[], now = new Date()): PetProfile {
  if (after.growthStage <= before.growthStage) return after;
  const id = `${after.generation || 1}:${after.growthStage}:${after.evolutionPath || 'BALANCED'}`;
  if (after.growthMemories?.some((memory) => memory.id === id)) return after;
  const foods = [...new Set(logs.filter((log) => after.rewardedMealLogIds.includes(log.id) && log.consumedDate <= dayKey(now) &&
    (!after.generationStartedAt || log.createdAt >= after.generationStartedAt)).sort((a, b) => b.consumedDate.localeCompare(a.consumedDate))
    .map((log) => log.foodNameSnapshot))].slice(0, 3);
  return { ...after, growthMemories: [{ id, date: now.toISOString(), stage: after.growthStage,
    evolutionPath: after.evolutionPath || 'BALANCED', generation: after.generation || 1, foods }, ...(after.growthMemories || [])] };
}
