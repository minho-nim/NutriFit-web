import type { FoodLog, PetProfile } from '../types/nutrition';

export const SATIETY_PER_MEAL = 40;
export const SATIETY_DECAY_PER_HOUR = 12;

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getPetSatiety(pet: PetProfile, now = new Date()): number {
  const last = Date.parse(pet.satietyUpdatedAt || '');
  if (!Number.isFinite(last) || !Number.isFinite(pet.satiety)) return 0;
  const elapsedHours = Math.max(0, now.getTime() - last) / 3_600_000;
  return Math.max(0, Math.min(100, pet.satiety! - elapsedHours * SATIETY_DECAY_PER_HOUR));
}

export function recentFeedingEvents(pet: PetProfile, now = new Date()): NonNullable<PetProfile['feedingEvents']> {
  const first = new Date(now);
  first.setDate(first.getDate() - 6);
  const seen = new Set<string>();
  return (Array.isArray(pet.feedingEvents) ? pet.feedingEvents : []).filter((event) => {
    if (!event || !/^\d{4}-\d{2}-\d{2}$/.test(event.date) || !['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'].includes(event.mealType) || event.date < dateKey(first) || event.date > dateKey(now) || !Number.isFinite(Date.parse(event.fedAt)) || Date.parse(event.fedAt) > now.getTime() || !Number.isFinite(event.fullnessAfter) || event.fullnessAfter < 0 || event.fullnessAfter > 100) return false;
    const key = `${event.date}:${event.mealType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function plentifulMealCount(pet: PetProfile, now = new Date()): number {
  return recentFeedingEvents(pet, now).filter((event) => event.generation === (pet.generation || 1) && event.fullnessAfter >= 75).length;
}

export function feedPet(pet: PetProfile, log: FoodLog, now = new Date()) {
  const before = getPetSatiety(pet, now);
  const events = recentFeedingEvents(pet, now);
  const isCurrentMeal = log.consumedDate === dateKey(now) && log.weightG > 0 && log.calories > 0;
  const isNewFeeding = isCurrentMeal && !events.some((event) => event.date === log.consumedDate && event.mealType === log.mealType);
  const fullness = isNewFeeding ? Math.min(100, before + SATIETY_PER_MEAL) : before;
  const updatedPet: PetProfile = isNewFeeding ? {
    ...pet, satiety: fullness, satietyUpdatedAt: now.toISOString(),
    feedingEvents: [...events, { date: log.consumedDate, mealType: log.mealType, fedAt: now.toISOString(), fullnessAfter: fullness, generation: pet.generation || 1 }],
  } : pet;
  // Historical meal edits do not feed or change the reward multiplier.
  const expMultiplier = !isCurrentMeal ? 1 : fullness >= 95 ? 0 : fullness >= 75 ? 0.5 : 1;
  return { updatedPet, fullness, expMultiplier, isNewFeeding };
}
