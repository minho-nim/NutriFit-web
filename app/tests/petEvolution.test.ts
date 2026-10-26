import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { FoodLog, PetProfile } from '../src/types/nutrition';
import { DEFAULT_PET_PROFILE, getPetChatResponse, interactWithPet, processMealLogReward, processFeedbackReward, startNewPetGeneration } from '../src/utils/petEngine';
import { feedPet, getPetSatiety, plentifulMealCount } from '../src/utils/petSatiety';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PetGrowthCollection } from '../src/components/PetGrowthCollection';
import { advancePetEvolution, getDietOutlook, normalizePetEvolution, petDateKey, recordDietMeal } from '../src/utils/petEvolution';

const fresh = (): PetProfile => structuredClone(DEFAULT_PET_PROFILE);
const meal = (overrides: Partial<FoodLog> = {}): FoodLog => ({
  id: crypto.randomUUID(), userId: 'user', foodId: 'test-food', foodNameSnapshot: '두부',
  mealType: 'LUNCH', consumedAt: new Date().toISOString(), consumedDate: petDateKey(), weightG: 100,
  calories: 100, carbohydrates: 2, protein: 12, fat: 4, inputMethod: 'SEARCH',
  allergenStatus: 'NOT_CHECKED', detectedAllergens: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  ...overrides,
});

test('a meal determines the new path only when the pet actually evolves', () => {
  const before = { ...fresh(), experience: 99 };
  const result = processMealLogReward(before, meal(), false);
  assert.equal(result.updatedPet.growthStage, 2);
  assert.equal(result.updatedPet.evolutionPath, 'PROTEIN');
  assert.deepEqual(result.updatedPet.unlockedForms, ['SEED:1', 'PROTEIN:2']);
  assert.equal(result.isStageUp, true);
});

test('repeat logs and larger portions cannot multiply meal direction points', () => {
  let pet = recordDietMeal(fresh(), meal());
  for (let index = 0; index < 20; index++) pet = recordDietMeal(pet, meal({ weightG: 1000, calories: 1000, protein: 120, carbohydrates: 20, fat: 40 }));
  assert.equal(getDietOutlook(pet).scores.PROTEIN, 1);
  assert.equal(pet.dietEntries?.length, 1);
  assert.equal(getDietOutlook(pet).path, 'PROTEIN');
});

test('different dishes in the same meal contribute different ingredient groups', () => {
  let pet = recordDietMeal(fresh(), meal());
  pet = recordDietMeal(pet, meal({ foodNameSnapshot: '채소 샐러드', protein: 1, carbohydrates: 3, fat: 2 }));
  assert.equal(getDietOutlook(pet).scores.PROTEIN, 1);
  assert.equal(getDietOutlook(pet).scores.GARDEN, 1);
  assert.equal(getDietOutlook(pet).mealCount, 1);
  assert.equal(getDietOutlook(pet).path, 'BALANCED');
});

test('historical meals and snacks do not create evolution points', () => {
  const pet = recordDietMeal(recordDietMeal(fresh(), meal({ consumedDate: '2020-01-01' })), meal({ mealType: 'SNACK' }));
  assert.equal(pet.dietEntries?.length, 0);
});

test('only the last seven days influence the next direction', () => {
  const pet = { ...fresh(), dietEntries: [{ date: '2020-01-01', mealType: 'LUNCH' as const, groups: ['PROTEIN' as const] }] };
  assert.equal(getDietOutlook(pet).mealCount, 0);
});

test('changing diet preserves the current form until evolution, then retains discovered forms', () => {
  const current: PetProfile = { ...fresh(), experience: 200, growthStage: 2, evolutionPath: 'PROTEIN', unlockedForms: ['SEED:1', 'PROTEIN:2'] };
  const fed = recordDietMeal(current, meal({ foodNameSnapshot: '채소 샐러드', protein: 1, carbohydrates: 3, fat: 2 }));
  assert.equal(advancePetEvolution(fed, 2).evolutionPath, 'PROTEIN');
  const evolved = advancePetEvolution(fed, 3);
  assert.equal(evolved.evolutionPath, 'GARDEN');
  assert.ok(evolved.unlockedForms?.includes('PROTEIN:2'));
  assert.ok(evolved.unlockedForms?.includes('GARDEN:3'));
  assert.ok(!evolved.unlockedForms?.includes('GARDEN:2'));
  assert.ok(!evolved.unlockedForms?.includes('GARDEN:4'));
});

test('meal and feedback rewards share the daily cap, petting cannot level up', () => {
  let pet = fresh();
  pet = processMealLogReward(pet, meal(), true).updatedPet;
  pet = processFeedbackReward(pet, { id: 'feedback', menuName: '두부', reaction: 'INTERESTED' } as any).updatedPet;
  assert.equal(pet.dailyExpGained, 60);
  assert.equal(processMealLogReward(pet, meal(), true).expGained, 0);
  const stroked = interactWithPet(pet, 'PET');
  assert.equal(stroked.expGained, 0);
  assert.equal(interactWithPet(stroked.updatedPet, 'PET').affectionGained, 0);
});

test('legacy save migration reveals only the existing form and sanitizes duplicate diet entries', () => {
  const old: PetProfile = { ...fresh(), growthStage: 3, experience: 320, dietEntries: [
    { date: petDateKey(), mealType: 'LUNCH', groups: ['GARDEN'] },
    { date: petDateKey(), mealType: 'LUNCH', groups: ['GARDEN'] },
  ] };
  const restored = normalizePetEvolution(JSON.parse(JSON.stringify(old)));
  assert.deepEqual(restored.unlockedForms, ['SEED:1', 'BALANCED:3']);
  assert.equal(restored.dietEntries?.length, 1);
  assert.equal(restored.experience, 320);
});

test('locked collection cards hide species names and render only silhouettes', () => {
  const markup = renderToStaticMarkup(createElement(PetGrowthCollection, { pet: fresh() }));
  assert.ok(markup.includes('brightness(0)'));
  assert.ok(markup.includes('???'));
  assert.ok(!markup.includes('숲의 수호자'));
  assert.ok(!markup.includes('별빛 모험가'));
  const discovered = renderToStaticMarkup(createElement(PetGrowthCollection, { pet: { ...fresh(), growthStage: 2, evolutionPath: 'PROTEIN', unlockedForms: ['SEED:1', 'PROTEIN:2'] } }));
  assert.ok(discovered.includes('씩씩한 탐험가'));
  assert.ok(!discovered.includes('용감한 대장'));
  assert.ok(!discovered.includes('잎새 친구'));
});

test('a new generation requires maturity and preserves discoveries and the daily reward budget', () => {
  assert.equal(startNewPetGeneration(fresh()), null);
  const mature: PetProfile = { ...fresh(), growthStage: 4, experience: 1000, affection: 75, evolutionPath: 'GARDEN', unlockedForms: ['SEED:1', 'GARDEN:2', 'GARDEN:3', 'GARDEN:4'], dailyExpDate: petDateKey(), dailyExpGained: 60 };
  const next = startNewPetGeneration(mature)!;
  assert.equal(next.growthStage, 1);
  assert.equal(next.experience, 0);
  assert.equal(next.generation, 2);
  assert.equal(next.affection, 75);
  assert.deepEqual(next.unlockedForms, mature.unlockedForms);
  assert.equal(processMealLogReward(next, meal(), true).expGained, 0);
});

test('fullness decays with elapsed time, including offline time, and does not go below zero', () => {
  const now = new Date();
  const pet = { ...fresh(), satiety: 80, satietyUpdatedAt: now.toISOString() };
  assert.equal(getPetSatiety(pet, now), 80);
  assert.equal(getPetSatiety(pet, new Date(now.getTime() + 2 * 3_600_000)), 56);
  assert.equal(getPetSatiety(pet, new Date(now.getTime() + 10 * 3_600_000)), 0);
  assert.equal(getPetSatiety(pet, new Date(now.getTime() - 3_600_000)), 80);
  assert.equal(getPetSatiety(fresh(), now), 0);
});

test('multi-dish and repeated meal records count as a single feeding, independent of quantity', () => {
  const now = new Date();
  const first = feedPet(fresh(), meal({ mealType: 'BREAKFAST' }), now);
  assert.equal(first.fullness, 40);
  const repeated = feedPet(first.updatedPet, meal({ mealType: 'BREAKFAST', weightG: 1000, calories: 1000 }), now);
  assert.equal(repeated.fullness, 40);
  assert.equal(repeated.isNewFeeding, false);
  assert.equal(repeated.updatedPet.feedingEvents?.length, 1);
  const lunch = feedPet(repeated.updatedPet, meal({ mealType: 'LUNCH' }), now);
  assert.equal(lunch.fullness, 80);
  assert.equal(lunch.expMultiplier, 0.5);
  const dinner = feedPet(lunch.updatedPet, meal({ mealType: 'DINNER' }), now);
  assert.equal(dinner.fullness, 100);
  assert.equal(dinner.expMultiplier, 0);
});

test('talking, chatting, petting and recommendation feedback cannot reduce fullness', () => {
  const now = new Date();
  const pet = { ...fresh(), satiety: 80, satietyUpdatedAt: now.toISOString() };
  for (const action of ['PET', 'TALK', 'TREAT'] as const) {
    const after = interactWithPet(pet, action).updatedPet;
    assert.equal(after.satiety, pet.satiety);
    assert.equal(after.satietyUpdatedAt, pet.satietyUpdatedAt);
    assert.equal(getPetSatiety(after, now), 80);
  }
  const original = JSON.stringify(pet);
  const reply = getPetChatResponse('대화하면 배가 꺼져?', { pet, summary: {} as any, tasteProfile: {} as any, collectionCount: 0 });
  assert.ok(reply.reply.includes('시간'));
  assert.equal(JSON.stringify(pet), original);
  const feedback = processFeedbackReward(pet, { id: 'full-feedback', menuName: '두부', reaction: 'INTERESTED' } as any).updatedPet;
  assert.equal(feedback.satiety, 80);
  assert.equal(feedback.satietyUpdatedAt, pet.satietyUpdatedAt);
});

test('a full pet earns half bonus EXP or none, without losing accumulated experience', () => {
  const now = new Date().toISOString();
  const half = processMealLogReward({ ...fresh(), experience: 50, satiety: 40.01, satietyUpdatedAt: now }, meal(), false);
  assert.equal(half.expGained, 15);
  assert.equal(half.updatedPet.experience, 65);
  const stuffed = processMealLogReward({ ...fresh(), experience: 50, satiety: 80, satietyUpdatedAt: now }, meal(), false);
  assert.equal(stuffed.expGained, 0);
  assert.equal(stuffed.updatedPet.experience, 50);
  assert.ok(stuffed.dialogueMessage.includes('배불러'));
});

test('old meal edits do not feed, while a snack counts once as its own feeding', () => {
  const now = new Date();
  const past = feedPet(fresh(), meal({ consumedDate: '2020-01-01' }), now);
  assert.equal(past.isNewFeeding, false);
  assert.equal(past.fullness, 0);
  const snack = feedPet(fresh(), meal({ mealType: 'SNACK' }), now);
  assert.equal(snack.fullness, 40);
  assert.equal(feedPet(snack.updatedPet, meal({ mealType: 'SNACK' }), now).fullness, 40);
});

test('pig forms unlock only after evolving with three plentiful feeding memories', () => {
  const now = new Date();
  let pet = fresh();
  for (const mealType of ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const) pet = feedPet(pet, meal({ mealType }), now).updatedPet;
  assert.equal(plentifulMealCount(pet, now), 3);
  assert.equal(getDietOutlook(pet, now).path, 'PIG');
  const evolved = advancePetEvolution(pet, 2);
  assert.equal(evolved.evolutionPath, 'PIG');
  assert.ok(evolved.unlockedForms?.includes('PIG:2'));
  assert.ok(!evolved.unlockedForms?.includes('PIG:1'));
  assert.ok(!evolved.unlockedForms?.includes('PIG:3'));
  const markup = renderToStaticMarkup(createElement(PetGrowthCollection, { pet: fresh() }));
  assert.ok(markup.includes('17'));
  assert.ok(!markup.includes('미식 돼지왕'));
});

test('pig hatch keeps discoveries and current fullness, but past-generation memories do not determine the new path', () => {
  const now = new Date();
  let pet = fresh();
  for (const mealType of ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const) pet = feedPet(pet, meal({ mealType }), now).updatedPet;
  const mature = { ...pet, growthStage: 4 as const, experience: 1000, evolutionPath: 'PIG' as const, unlockedForms: ['SEED:1', 'PIG:4'] };
  const next = startNewPetGeneration(mature)!;
  assert.equal(next.evolutionPath, 'PIG');
  assert.ok(next.unlockedForms?.includes('PIG:1'));
  assert.ok(next.unlockedForms?.includes('PIG:4'));
  assert.equal(next.satiety, mature.satiety);
  assert.equal(next.satietyUpdatedAt, mature.satietyUpdatedAt);
  assert.equal(plentifulMealCount(next, now), 0);
  assert.equal(feedPet(next, meal({ mealType: 'SNACK' }), now).isNewFeeding, false);
});
