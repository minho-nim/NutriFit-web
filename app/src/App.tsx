/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TopBar } from './components/TopBar';
import { BottomNav, MainTab } from './components/BottomNav';
import { HomeDashboard } from './components/HomeDashboard';
import { DiaryView } from './components/DiaryView';
import { DiscoverView } from './components/DiscoverView';
import { FoodCollectionView } from './components/FoodCollectionView';
import { MyProfileView } from './components/MyProfileView';
import { MealLoggerModal } from './components/MealLoggerModal';
import { PetReactionModal, PetReactionModalData } from './components/PetReactionModal';
import { PetChatModal } from './components/PetChatModal';
import {
  getTodayString,
  StorageService,
} from './services/storage';
import {
  FoodCollectionItem,
  FoodItem,
  FoodLog,
  MealType,
  MealRecommendation,
  PetDialogue,
  PetProfile,
  QuickMealCombo,
  RecommendationFeedback,
  UserAllergyConfig,
  UserGoal,
  UserProfile,
  WeightLog,
} from './types/nutrition';
import { verifyAllergens } from './utils/nutritionEngine';
import { calculateNutritionGoals } from './utils/nutritionEngine';
import { VERIFIED_FOODS } from './data/mockFoods';
import { reconcilePetDiet, recordDietMeal } from './utils/petEvolution';
import { recommendationLog } from './utils/mealFlow';
import { calculateDailySummary } from './utils/nutritionEngine';
import { analyzeUserTaste } from './utils/tasteEngine';
import {
  normalizeFoodName,
  processFeedbackReward,
  processMealLogReward,
  syncFoodCollection,
} from './utils/petEngine';

// Reward and multi-dish writes must see earlier writes from the same event.
function useImmediateState<T>(initial: () => T) {
  const [value, setValue] = useState<T>(initial);
  const current = useRef(value);
  const update = useCallback((action: React.SetStateAction<T>) => {
    const next = typeof action === 'function' ? (action as (previous: T) => T)(current.current) : action;
    current.current = next;
    setValue(next);
  }, []);
  return [value, update, current] as const;
}

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(() => StorageService.getProfile());
  const [goal, setGoal] = useState<UserGoal>(() => StorageService.getGoal());
  const [foodLogs, setFoodLogs, foodLogsRef] = useImmediateState<FoodLog[]>(() => StorageService.getFoodLogs());
  const [customFoods, setCustomFoods] = useState<FoodItem[]>(() => StorageService.getCustomFoods());
  const [userAllergies, setUserAllergies] = useState<UserAllergyConfig[]>(() => StorageService.getAllergies());
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>(() => StorageService.getWeightLogs());
  const [feedbacks, setFeedbacks] = useState<RecommendationFeedback[]>(() => StorageService.getFeedbacks());
  const [petProfile, setPetProfile, petProfileRef] = useImmediateState<PetProfile>(() => StorageService.getPetProfile());
  const [foodCollections, setFoodCollections] = useState<FoodCollectionItem[]>(() => StorageService.getFoodCollections());

  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayString());
  const [today, setToday] = useState(getTodayString);
  const todayRef = useRef(today);
  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = getTodayString();
      const previous = todayRef.current;
      if (previous !== next) {
        todayRef.current = next;
        setToday(next);
        setSelectedDate((date) => date === previous ? next : date);
      }
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const [currentTab, setCurrentTab] = useState<MainTab>('HOME');
  const [diaryTab, setDiaryTab] = useState<'LOGS' | 'COMBOS' | 'TASTE'>('LOGS');
  const [myInitialScreen, setMyInitialScreen] = useState<'ALLERGIES' | null>(null);
  const [myViewKey, setMyViewKey] = useState(0);
  const openTasteInsights = () => { setDiaryTab('TASTE'); setCurrentTab('DIARY'); };

  // Modal Logger state
  const [loggerFood, setLoggerFood] = useState<FoodItem | undefined>();
  const [collectionTab, setCollectionTab] = useState<'FOOD' | 'GROWTH'>('FOOD');
  const navigateCollection = (tab: 'FOOD' | 'GROWTH' = 'FOOD') => { setCollectionTab(tab); setCurrentTab('COLLECTION'); };
  const [isLoggerOpen, setIsLoggerOpen] = useState<boolean>(false);
  const [loggerMealType, setLoggerMealType] = useState<MealType>('LUNCH');

  // Pet celebratory meal feedback modal state
  const [petReactionData, setPetReactionData] = useState<PetReactionModalData | null>(null);

  // Pet Interactive Chat & Growth Lounge modal state
  const [petChatTab, setPetChatTab] = useState<'CHAT' | 'GROWTH'>('CHAT');
  const [isPetChatOpen, setIsPetChatOpen] = useState<boolean>(false);
  const [petChatDialogue, setPetChatDialogue] = useState<PetDialogue | undefined>(undefined);
  const [discoverCategoryFilter, setDiscoverCategoryFilter] = useState<string | undefined>(undefined);

  // Auto sync to localStorage
  useEffect(() => {
    StorageService.saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    StorageService.saveGoal(goal);
  }, [goal]);

  useEffect(() => {
    StorageService.saveFoodLogs(foodLogs);
  }, [foodLogs]);

  useEffect(() => {
    StorageService.saveCustomFoods(customFoods);
  }, [customFoods]);

  useEffect(() => {
    StorageService.saveAllergies(userAllergies);
  }, [userAllergies]);

  useEffect(() => {
    StorageService.saveWeightLogs(weightLogs);
  }, [weightLogs]);

  useEffect(() => {
    StorageService.saveFeedbacks(feedbacks);
  }, [feedbacks]);

  useEffect(() => {
    StorageService.savePetProfile(petProfile);
  }, [petProfile]);

  useEffect(() => {
    StorageService.saveFoodCollections(foodCollections);
  }, [foodCollections]);

  // Compute live daily summary for selected date
  const dailySummary = calculateDailySummary(selectedDate, foodLogs, goal);
  const petSummary = calculateDailySummary(today, foodLogs, goal);

  // Compute live learned taste profile
  const tasteProfile = analyzeUserTaste(foodLogs, feedbacks, customFoods);

  // Handlers
  const handleSaveFoodLog = (newLogData: Omit<FoodLog, 'id' | 'createdAt' | 'updatedAt'>, batch?: { reaction?: PetReactionModalData }) => {
    const knownFood = [...VERIFIED_FOODS, ...customFoods].find((food) => food.id === newLogData.foodId);
    const check = verifyAllergens(knownFood || {
      id: newLogData.foodId, name: newLogData.foodNameSnapshot, foodType: '',
      servingSize: newLogData.weightG, servingUnit: 'g', nutritionBasisGrams: newLogData.weightG,
      calories: newLogData.calories, carbohydrates: newLogData.carbohydrates,
      protein: newLogData.protein, fat: newLogData.fat,
      ingredients: newLogData.ingredientsSnapshot || [], allergens: newLogData.allergensSnapshot || [],
      sourceType: 'USER_CUSTOM', sourceReference: '', verifiedAt: '',
    }, userAllergies);
    const newLog: FoodLog = {
      ...newLogData,
      userId: profile.id,
      allergenStatus: check.status,
      detectedAllergens: [...check.matchedAllergens, ...check.crossContactAllergens],
      id: `log-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Check if food is newly discovered in collection
    const normalized = normalizeFoodName(newLogData.foodNameSnapshot);
    const existing = foodCollections.find((c) => c.normalizedName === normalized);
    const isNewFoodDiscovery = (!existing || !existing.isDiscovered) && !foodLogsRef.current.some((log) => normalizeFoodName(log.foodNameSnapshot) === normalized);

    // 2. Process Pet Reward & Nutrient Commentary
    const reward = processMealLogReward(petProfileRef.current, newLog, isNewFoodDiscovery);
    setPetProfile(reward.updatedPet);

    // Show celebration modal
    let reaction: PetReactionModalData = {
      foodName: newLog.foodNameSnapshot,
      calories: newLog.calories,
      protein: newLog.protein,
      carbs: newLog.carbohydrates,
      fat: newLog.fat,
      expGained: reward.expGained,
      affectionGained: reward.affectionGained,
      explorationGained: reward.explorationGained,
      isStageUp: reward.isStageUp,
      dialogueMessage: reward.dialogueMessage,
    };
    if (batch?.reaction) {
      const previous = batch.reaction;
      reaction = { ...reaction, foodName: `${previous.foodName} + ${reaction.foodName}`,
        calories: previous.calories + reaction.calories, protein: Number((previous.protein + reaction.protein).toFixed(1)),
        carbs: Number((previous.carbs + reaction.carbs).toFixed(1)), fat: Number((previous.fat + reaction.fat).toFixed(1)),
        expGained: previous.expGained + reaction.expGained, affectionGained: previous.affectionGained + reaction.affectionGained,
        explorationGained: previous.explorationGained + reaction.explorationGained,
        isStageUp: previous.isStageUp || reaction.isStageUp,
        dialogueMessage: previous.isStageUp ? previous.dialogueMessage : reaction.dialogueMessage,
      };
    }
    if (batch) batch.reaction = reaction;
    setPetReactionData(reaction);

    // 3. Save Food Logs
    const updatedLogs = [newLog, ...foodLogsRef.current];
    setFoodLogs(updatedLogs);

    // 4. Update Food Collection
    setFoodCollections((prev) => syncFoodCollection(updatedLogs, prev));
  };

  const handleDeleteFoodLog = (logId: string) => {
    const updatedLogs = foodLogsRef.current.filter((l) => l.id !== logId);
    setPetProfile((pet) => reconcilePetDiet(pet, updatedLogs));
    setFoodLogs(updatedLogs);
    setFoodCollections((prev) => syncFoodCollection(updatedLogs, prev));
  };

  const handleUpdateFoodLogRating = (logId: string, rating: number) => {
    const log = foodLogsRef.current.find((item) => item.id === logId);
    setFoodLogs((prev) => prev.map((item) => item.id === logId ? { ...item, satisfactionRating: rating } : item));
    if (log) setFoodCollections((prev) => prev.map((item) => item.normalizedName === normalizeFoodName(log.foodNameSnapshot) ? { ...item, personalRating: rating } : item));
  };

  const handleSaveCustomFood = (newFood: FoodItem) => {
    setCustomFoods((prev) => [newFood, ...prev]);
  };

  const handleUpdateAllergies = (newAllergies: UserAllergyConfig[]) => {
    setUserAllergies(newAllergies);
  };

  const handleAddWeightLog = (weightKg: number, measuredAt: string, note?: string) => {
    const newLog: WeightLog = {
      id: `weight-${Date.now()}`,
      userId: profile.id,
      weightKg,
      measuredAt,
      note,
    };
    setWeightLogs((prev) => [...prev, newLog]);
  };

  const handleDeleteWeightLog = (logId: string) => {
    setWeightLogs((prev) => prev.filter((w) => w.id !== logId));
  };

  const handleUpdateCurrentWeight = (newWeight: number) => {
    const next = { ...profile, currentWeightKg: newWeight, updatedAt: new Date().toISOString() };
    setProfile(next);
    const computed = calculateNutritionGoals(next);
    setGoal(goal.isCustomManual ? { ...goal, bmr: computed.bmr, tdee: computed.tdee } : computed);
  };

  const handleUpdateProfileAndGoals = (newProfile: UserProfile, newGoal: UserGoal) => {
    setProfile(newProfile);
    setGoal(newGoal);
  };

  const handleRecordFeedback = (fb: RecommendationFeedback) => {
    setFeedbacks((prev) => [fb, ...prev.filter((item) => item.menuName !== fb.menuName)]);

    // Award taste understanding and EXP to Pet
    const petReward = processFeedbackReward(petProfileRef.current, fb);
    setPetProfile(petReward.updatedPet);
    if (petReward.isStageUp) setPetReactionData({
      source: 'FEEDBACK', foodName: fb.menuName, calories: 0, protein: 0, carbs: 0, fat: 0,
      expGained: petReward.expGained, affectionGained: 0, explorationGained: 0,
      isStageUp: true, dialogueMessage: petReward.dialogueMessage,
    });
  };

  const handleResetTasteProfile = () => {
    setFeedbacks([]);
    setFoodCollections((prev) => prev.map((item) => ({ ...item, personalRating: undefined })));
    setFoodLogs((prev) => prev.map((l) => ({ ...l, satisfactionRating: undefined })));
  };

  const handleQuickLogCombo = (combo: QuickMealCombo) => {
    const batch: { reaction?: PetReactionModalData } = {};
    // All dishes contribute to the direction before any one dish can trigger evolution.
    let prepared = petProfileRef.current;
    combo.foods.forEach((food) => {
      const source = foodLogsRef.current.find((log) => log.foodId === food.foodId);
      prepared = recordDietMeal(prepared, { ...food, ingredientsSnapshot: source?.ingredientsSnapshot, foodNameSnapshot: food.foodName,
        consumedDate: selectedDate, mealType: combo.mealType });
    });
    setPetProfile(prepared);
    combo.foods.forEach((f, idx) => {
      handleSaveFoodLog({
        userId: profile.id,
        foodId: f.foodId,
        ...(() => {
          const source = foodLogsRef.current.find((log) => log.foodId === f.foodId);
          return { ingredientsSnapshot: source?.ingredientsSnapshot, allergensSnapshot: source?.allergensSnapshot,
            cookingMethodSnapshot: source?.cookingMethodSnapshot, flavorProfileSnapshot: source?.flavorProfileSnapshot };
        })(),
        foodNameSnapshot: f.foodName,
        mealType: combo.mealType,
        consumedAt: new Date(Date.now() + idx * 1000).toISOString(),
        consumedDate: selectedDate,
        weightG: f.weightG,
        calories: f.calories,
        carbohydrates: f.carbohydrates,
        protein: f.protein,
        fat: f.fat,
        inputMethod: 'SEARCH',
        allergenStatus: 'UNKNOWN',
        detectedAllergens: [],
        notes: `자주 먹은 조합 [${combo.title}]에서 일괄 기록`,
      }, batch);
    });
  };

  const handleRefreshAllData = () => {
    setProfile(StorageService.getProfile());
    setGoal(StorageService.getGoal());
    setFoodLogs(StorageService.getFoodLogs());
    setCustomFoods(StorageService.getCustomFoods());
    setUserAllergies(StorageService.getAllergies());
    setWeightLogs(StorageService.getWeightLogs());
    setFeedbacks(StorageService.getFeedbacks());
    setPetProfile(StorageService.getPetProfile());
    setFoodCollections(StorageService.getFoodCollections());
  };

  const openLogger = (mType: MealType = 'LUNCH', food?: FoodItem) => {
    setLoggerFood(food);
    setLoggerMealType(mType);
    setIsLoggerOpen(true);
  };

  const handleQuickAddFood = (rec: MealRecommendation) => {
    handleSaveFoodLog(recommendationLog(rec, profile.id, selectedDate, petProfile.petName));
  };

  // Pet & Collection Handlers
  const handleUpdatePetName = (newName: string) => {
    setPetProfile((prev) => ({
      ...prev,
      petName: newName,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleToggleFavoriteCollection = (itemId: string) => {
    setFoodCollections((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, isFavorite: !item.isFavorite } : item))
    );
  };

  const handleUpdateCollectionRating = (itemId: string, rating: number) => {
    const item = foodCollections.find((food) => food.id === itemId);
    if (item) setFoodLogs((prev) => prev.map((log) => normalizeFoodName(log.foodNameSnapshot) === item.normalizedName ? { ...log, satisfactionRating: rating } : log));
    setFoodCollections((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, personalRating: rating } : item))
    );
  };

  const handleQuickLogCollectionItem = (item: FoodCollectionItem) => {
    const known = [...VERIFIED_FOODS, ...customFoods].find((food) => food.id === item.foodId);
    const source = foodLogsRef.current.find((log) => normalizeFoodName(log.foodNameSnapshot) === item.normalizedName);
    openLogger('LUNCH', known || {
      id: item.foodId || item.id, name: item.foodName, foodType: '도감 기록',
      servingSize: item.servingWeightG || 100, servingUnit: 'g', nutritionBasisGrams: item.servingWeightG || 100,
      calories: item.calories, carbohydrates: item.carbohydrates, protein: item.protein, fat: item.fat,
      ingredients: source?.ingredientsSnapshot || [], allergens: source?.allergensSnapshot || item.allergens || [], sourceType: 'USER_CUSTOM',
      sourceReference: '이전 식사 기록', verifiedAt: '',
    });
  };

  const activeAllergiesCount = userAllergies.filter((a) => a.isActive).length;
  const discoveredCount = foodCollections.filter((c) => c.isDiscovered).length;

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-stone-900 flex flex-col font-sans selection:bg-[#405443] selection:text-white">
      {/* Editorial Clean Top Bar */}
      <TopBar
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        activeAllergiesCount={activeAllergiesCount}
        onOpenAllergies={() => { setMyInitialScreen('ALLERGIES'); setMyViewKey((value) => value + 1); setCurrentTab('MY'); }}
        tasteConfidence={tasteProfile.tasteConfidence}
        onOpenTasteInsights={openTasteInsights}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 pt-4">
        {/* Tab 1: Home Dashboard with Pet */}
        {currentTab === 'HOME' && (
          <HomeDashboard
            pet={petProfile}
            summary={dailySummary}
            petSummary={petSummary}
            profile={profile}
            goal={goal}
            tasteProfile={tasteProfile}
            recentLogs={foodLogs}
            collectionCount={discoveredCount}
            onOpenMealLogger={openLogger}
            onNavigateToDiscover={(catFilter) => {
              setDiscoverCategoryFilter(catFilter);
              setCurrentTab('DISCOVER');
            }}
            onNavigateToTasteInsights={openTasteInsights}
            onNavigateToCollection={navigateCollection}
            onUpdatePetName={handleUpdatePetName}
            onUpdatePetProfile={setPetProfile}
            onOpenPetChatModal={(dlg, tab = 'CHAT') => {
              setPetChatTab(tab);
              setPetChatDialogue(dlg);
              setIsPetChatOpen(true);
            }}
            userAllergies={userAllergies}
            feedbacks={feedbacks}
            onQuickAddFood={handleQuickAddFood}
          />
        )}

        {/* Tab 2: Meal Diary (기록) */}
        {currentTab === 'DIARY' && (
          <DiaryView
            activeTab={diaryTab}
            onSelectTab={setDiaryTab}
            summary={dailySummary}
            selectedDate={selectedDate}
            foodLogs={foodLogs}
            goal={goal}
            profile={profile}
            tasteProfile={tasteProfile}
            onOpenMealLogger={openLogger}
            onDeleteFoodLog={handleDeleteFoodLog}
            onUpdateFoodLogRating={handleUpdateFoodLogRating}
            onQuickLogCombo={handleQuickLogCombo}
            onResetTasteProfile={handleResetTasteProfile}
          />
        )}

        {/* Tab 3: Pet-Driven Menu Recommendations (펫 추천) */}
        {currentTab === 'DISCOVER' && (
          <DiscoverView
            pet={petProfile}
            profile={profile}
            goal={goal}
            summary={dailySummary}
            tasteProfile={tasteProfile}
            foodLogs={foodLogs}
            userAllergies={userAllergies}
            selectedDate={selectedDate}
            feedbacks={feedbacks}
            categoryFilter={discoverCategoryFilter}
            onClearCategoryFilter={() => setDiscoverCategoryFilter(undefined)}
            onAddRecommendationToLog={handleSaveFoodLog}
            onRecordFeedback={handleRecordFeedback}
          />
        )}

        {/* Tab 4: Food Collection / Encyclopedia (음식 도감) */}
        {currentTab === 'COLLECTION' && (
          <FoodCollectionView
            initialTab={collectionTab}
            pet={petProfile}
            onUpdatePet={setPetProfile}
            collections={foodCollections}
            onToggleFavorite={handleToggleFavoriteCollection}
            onUpdateRating={handleUpdateCollectionRating}
            onQuickLogItem={handleQuickLogCollectionItem}
          />
        )}

        {/* Tab 5: My Profile & Settings (내 정보) */}
        {currentTab === 'MY' && (
          <MyProfileView
            key={myViewKey}
            initialScreen={myInitialScreen}
            profile={profile}
            goal={goal}
            tasteProfile={tasteProfile}
            userAllergies={userAllergies}
            weightLogs={weightLogs}
            onUpdateProfileAndGoals={handleUpdateProfileAndGoals}
            onUpdateAllergies={handleUpdateAllergies}
            onAddWeightLog={handleAddWeightLog}
            onDeleteWeightLog={handleDeleteWeightLog}
            onUpdateCurrentWeight={handleUpdateCurrentWeight}
            onResetTasteProfile={handleResetTasteProfile}
            onDataResetOrImported={handleRefreshAllData}
          />
        )}
      </main>

      {/* Clean Bottom Navigation Bar (5 Tabs + Quick Log Button) */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'DIARY') setDiaryTab('LOGS');
          if (tab === 'MY') { setMyInitialScreen(null); setMyViewKey((value) => value + 1); }
          if (tab !== 'DISCOVER') {
            setDiscoverCategoryFilter(undefined);
          }
          setCurrentTab(tab);
        }}
        onOpenQuickLog={() => openLogger('LUNCH')}
      />

      {/* Fast Standalone Food Logger Modal */}
      {isLoggerOpen && (
        <MealLoggerModal
          initialFood={loggerFood}
          initialMealType={loggerMealType}
          selectedDate={selectedDate}
          userAllergies={userAllergies}
          customFoods={customFoods}
          onSaveFoodLog={handleSaveFoodLog}
          onSaveCustomFood={handleSaveCustomFood}
          onClose={() => setIsLoggerOpen(false)}
        />
      )}

      {/* Pet Celebratory Reaction Modal when a meal is logged */}
      {petReactionData && (
        <PetReactionModal
          pet={petProfile}
          data={petReactionData}
          onClose={() => setPetReactionData(null)}
        />
      )}

      {/* Pet Interactive Dialogue & Growth Lounge Modal */}
      {isPetChatOpen && (
        <PetChatModal
          pet={petProfile}
          summary={petSummary}
          profile={profile}
          goal={goal}
          tasteProfile={tasteProfile}
          foodLogs={foodLogs}
          collectionCount={discoveredCount}
          initialTab={petChatTab}
          initialDialogue={petChatDialogue}
          onUpdatePet={setPetProfile}
          onOpenMealLogger={openLogger}
          onNavigateToDiscover={(filter) => {
            setDiscoverCategoryFilter(filter);
            setCurrentTab('DISCOVER');
          }}
          onNavigateToCollection={navigateCollection}
          onClose={() => setIsPetChatOpen(false)}
        />
      )}
    </div>
  );
}
