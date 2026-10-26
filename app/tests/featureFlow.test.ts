import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEFAULT_USER_PROFILE, StorageService } from '../src/services/storage';
import { DEFAULT_PET_PROFILE, getContextualPetDialogue, processFeedbackReward, processMealLogReward, syncFoodCollection } from '../src/utils/petEngine';
import { analyzeUserTaste, extractQuickCombos, generateCuratedRecommendations } from '../src/utils/tasteEngine';
import { calculateDailySummary, calculateNutritionGoals } from '../src/utils/nutritionEngine';
import { petDateKey, recordDietMeal, reconcilePetDiet, getDietOutlook } from '../src/utils/petEvolution';
import { mealTypeForText, recommendationLog } from '../src/utils/mealFlow';
import { FoodCollectionView } from '../src/components/FoodCollectionView';
import type { FoodLog, PetProfile } from '../src/types/nutrition';

const fresh = (): PetProfile => structuredClone(DEFAULT_PET_PROFILE);
const meal = (overrides: Partial<FoodLog> = {}): FoodLog => ({
  id: crypto.randomUUID(), userId: 'user', foodId: 'test', foodNameSnapshot: '두부', mealType: 'LUNCH',
  consumedAt: new Date().toISOString(), consumedDate: petDateKey(), weightG: 150, calories: 150,
  carbohydrates: 4, protein: 18, fat: 6, inputMethod: 'SEARCH', allergenStatus: 'NOT_CHECKED',
  detectedAllergens: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...overrides,
});
const profile = structuredClone(DEFAULT_USER_PROFILE);
const goal = calculateNutritionGoals(profile);
const summary = calculateDailySummary(petDateKey(), [], goal);
const tasteProfile = analyzeUserTaste([], []);
const params = { profile, goal, summary, tasteProfile, recentLogs: [], userAllergies: [], mealType: 'LUNCH' as const, feedbacks: [] };

test('collection synchronization is idempotent and deleted logs do not remain discovered', () => {
  const log = meal();
  const once = syncFoodCollection([log]);
  const twice = syncFoodCollection([log], once);
  assert.deepEqual(twice, once);
  assert.equal(twice.find((item) => item.normalizedName === '두부')?.recordCount, 1);
  const saved = once.map((item) => item.normalizedName === '두부' ? { ...item, isFavorite: true, personalRating: 5 } : item);
  const removed = syncFoodCollection([], saved).find((item) => item.normalizedName === '두부')!;
  assert.equal(removed.recordCount, 0);
  assert.equal(removed.isDiscovered, false);
  assert.equal(removed.isFavorite, true);
});

test('collection nutrition uses the latest portion without averaging incompatible amounts', () => {
  const early = meal({ consumedAt: '2026-10-20T10:00:00', consumedDate: '2026-10-20' });
  const latest = meal({ weightG: 300, calories: 300, protein: 36 });
  const item = syncFoodCollection([latest, early]).find((item) => item.normalizedName === '두부')!;
  assert.equal(item.recordCount, 2);
  assert.equal(item.servingWeightG, 300);
  assert.equal(item.calories, 300);
});

test('recommendation IDs survive re-renders and category filters change actual candidates', () => {
  assert.deepEqual(generateCuratedRecommendations(params).map((rec) => rec.id), generateCuratedRecommendations(params).map((rec) => rec.id));
  const soup = generateCuratedRecommendations({ ...params, categoryFilter: '국물' });
  assert.ok(soup.length > 0 && soup.every((rec) => rec.cookingMethod === 'SOUP'));
  assert.ok(generateCuratedRecommendations({ ...params, categoryFilter: '고단백' }).every((rec) => rec.protein >= 30));
  assert.ok(generateCuratedRecommendations({ ...params, categoryFilter: '가벼운식단' }).every((rec) => rec.estimatedCalories <= 450));
});

test('alternatives carry their own complete nutrients and match current allergy exclusions', () => {
  const recs = generateCuratedRecommendations({ ...params, userAllergies: [{ allergenCode: 'MILK', allergenName: '우유', isActive: true, handlingMode: 'WARN' }] });
  assert.ok(recs.length > 0);
  for (const rec of recs) {
    for (const candidate of [rec, rec.alternativeMenu].filter(Boolean)) {
      assert.ok(!candidate!.allergens?.includes('MILK'));
      const log = recommendationLog(candidate!, profile.id, '2026-10-20', '보리');
      assert.equal(log.calories, candidate!.estimatedCalories);
      assert.equal(log.carbohydrates, candidate!.carbohydrates);
      assert.equal(log.fat, candidate!.fat);
      assert.equal(log.weightG, candidate!.estimatedWeightG);
      assert.deepEqual(log.ingredientsSnapshot, candidate!.ingredients);
      assert.equal(log.consumedDate, '2026-10-20');
    }
  }
});

test('a filter with all matching foods excluded returns an honest empty list', () => {
  const recs = generateCuratedRecommendations({ ...params, categoryFilter: '국물', userAllergies: [{ allergenCode: 'SOY', allergenName: '대두', isActive: true, handlingMode: 'STRICT_EXCLUDE' }] });
  assert.deepEqual(recs, []);
});

test('breakfast and snack suggestions use suitable portions from the same food data', () => {
  const snacks = generateCuratedRecommendations({ ...params, mealType: 'SNACK' });
  assert.ok(snacks.length > 0 && snacks.every((rec) => rec.estimatedCalories <= 250));
  assert.ok(generateCuratedRecommendations({ ...params, mealType: 'BREAKFAST' }).every((rec) => rec.estimatedCalories <= 450));
});

test('ratings and custom ingredient snapshots influence learned preferences', () => {
  const low = meal({ satisfactionRating: 1, ingredientsSnapshot: ['두부'], cookingMethodSnapshot: 'STEAM' });
  const high = meal({ satisfactionRating: 5, ingredientsSnapshot: ['현미'], cookingMethodSnapshot: 'BOIL' });
  const taste = analyzeUserTaste([low, high], []);
  assert.equal(taste.favoriteIngredients[0].name, '현미');
  assert.equal(taste.favoriteCookingMethods[0].method, 'BOIL');
});

test('past-date records cannot award EXP, affection or a shared meal', () => {
  const result = processMealLogReward(fresh(), meal({ consumedDate: '2020-01-01' }), true);
  assert.equal(result.expGained, 0);
  assert.equal(result.affectionGained, 0);
  assert.equal(result.explorationGained, 0);
  assert.equal(result.updatedPet.totalMealsShared, 0);
});

test('multiple dishes count as one shared meal and one affection reward', () => {
  const first = processMealLogReward(fresh(), meal(), false);
  const second = processMealLogReward(first.updatedPet, meal({ foodNameSnapshot: '현미밥' }), false);
  assert.equal(second.updatedPet.totalMealsShared, 1);
  assert.equal(first.affectionGained, 10);
  assert.equal(second.affectionGained, 0);
});

test('new feedback IDs cannot farm the same menu and eating feedback adds no duplicate EXP', () => {
  const feedback = { id: 'first', recommendationId: 'menu', menuName: '두부 전골', reaction: 'INTERESTED' as const, createdAt: new Date().toISOString() };
  const first = processFeedbackReward(fresh(), feedback);
  assert.equal(first.expGained, 15);
  assert.equal(processFeedbackReward(first.updatedPet, { ...feedback, id: 'second' }).expGained, 0);
  assert.equal(processFeedbackReward(fresh(), { ...feedback, reaction: 'EATEN' }).expGained, 0);
});

test('deleting a dish updates future growth direction and preserves the current discovered form', () => {
  const tofu = meal();
  const salad = meal({ foodNameSnapshot: '채소 샐러드', protein: 1 });
  let pet = recordDietMeal(recordDietMeal(fresh(), tofu), salad);
  pet = { ...pet, growthStage: 2, evolutionPath: 'GARDEN', rewardedMealLogIds: [tofu.id, salad.id], unlockedForms: ['SEED:1', 'GARDEN:2'] };
  const updated = reconcilePetDiet(pet, [tofu]);
  assert.equal(getDietOutlook(updated).path, 'PROTEIN');
  assert.equal(updated.evolutionPath, 'GARDEN');
  assert.ok(updated.unlockedForms?.includes('GARDEN:2'));
});

test('dialogue meal slots and fullness collection navigation have concrete destinations', () => {
  assert.equal(mealTypeForText('저녁 식사 기록'), 'DINNER');
  assert.equal(mealTypeForText('아침 기록'), 'BREAKFAST');
  assert.equal(mealTypeForText('오후 간식'), 'SNACK');
  const dialogue = getContextualPetDialogue({ pet: { ...fresh(), satiety: 100, satietyUpdatedAt: new Date().toISOString() }, summary, tasteProfile, recentLogs: [], collectionCount: 0 });
  assert.equal(dialogue.actions?.[0].collectionTab, 'GROWTH');
  const markup = renderToStaticMarkup(createElement(FoodCollectionView, { pet: fresh(), initialTab: 'GROWTH', collections: [], onToggleFavorite() {}, onUpdateRating() {}, onQuickLogItem() {} }));
  assert.ok(markup.includes('실제로 진화한 모습만 공개'));
});

test('recommendation ingredient snapshots reach taste learning and diet direction', () => {
  const rec = generateCuratedRecommendations({ ...params, categoryFilter: '국물' })[0];
  const log = { ...meal(), ...recommendationLog(rec, 'user', petDateKey(), '보리') };
  const taste = analyzeUserTaste([log], []);
  assert.ok(taste.favoriteIngredients.some((item) => item.name.includes('버섯')));
  assert.equal(taste.favoriteCookingMethods[0].method, 'SOUP');
  assert.equal(getDietOutlook(recordDietMeal(fresh(), log)).scores.GARDEN, 1);
});

test('frequent combo count measures repeated meals, not the number of dishes', () => {
  const tofu = meal();
  const rice = meal({ foodNameSnapshot: '현미밥', foodId: 'rice' });
  const combo = extractQuickCombos([tofu, rice, { ...tofu, id: 'past-tofu', consumedDate: '2020-01-01' }, { ...rice, id: 'past-rice', consumedDate: '2020-01-01' }]);
  assert.equal(combo.length, 1);
  assert.equal(combo[0].timesLogged, 2);
  assert.equal(combo[0].foods.length, 2);
});

test('backup restore rejects invalid structure without changing existing saved data', () => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  } });
  const backup = JSON.parse(StorageService.exportAllData());
  assert.equal(StorageService.importAllData(JSON.stringify(backup)), true);
  const before = new Map(values);
  assert.equal(StorageService.importAllData(JSON.stringify({ ...backup, foodLogs: {} })), false);
  assert.deepEqual(values, before);
  assert.equal(StorageService.importAllData('{}'), false);
  assert.deepEqual(values, before);
  const restored = StorageService.getPetProfile();
  assert.equal(restored.growthStage, backup.petProfile.growthStage);
});
