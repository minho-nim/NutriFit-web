/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DailyNutritionSummary,
  FoodCollectionItem,
  FoodItem,
  FoodLog,
  PetDialogue,
  PetDialogueAction,
  PetMood,
  PetPersonality,
  PetProfile,
  PetStage,
  RecommendationFeedback,
  UserTasteProfile,
} from '../types/nutrition';
import { VERIFIED_FOODS } from '../data/mockFoods';
import { advancePetEvolution, EVOLUTION_CONFIG, normalizePetEvolution, recordDietMeal } from './petEvolution';
import { mealTypeForText } from './mealFlow';
import { feedPet, getPetSatiety } from './petSatiety';

export const PERSONALITY_CONFIG: Record<
  PetPersonality,
  {
    name: string;
    tagline: string;
    description: string;
    tone: string;
    greetingPrefix: string;
    icon: string;
  }
> = {
  WARM_FRIEND: {
    name: '다정한 밥친구',
    tagline: '언제나 곁에서 포근하게 위로해주는 단짝',
    description: '식사를 늦게 하거나 거칠 때도 따뜻하게 감싸주고, 부담 없는 편안한 식사를 권해요.',
    tone: '따뜻함, 다정함, 안도감',
    greetingPrefix: '오늘도 고생 많았어!',
    icon: '🌸',
  },
  CURIOUS_EXPLORER: {
    name: '호기심 탐험가',
    tagline: '새로운 맛의 세계를 함께 발견하는 모험가',
    description: '도감에 없는 새로운 음식과 이색 메뉴를 찾는 것을 가장 설레해요.',
    tone: '호기심, 설렘, 탐구심',
    greetingPrefix: '새로운 맛을 찾아서 출발!',
    icon: '🧭',
  },
  GOURMET_CHEF: {
    name: '섬세한 미식가',
    tagline: '재료의 풍미와 식단 밸런스를 아는 셰프',
    description: '조리법, 식재료 궁합, 영양 밸런스를 세심하게 고려해 미식의 즐거움을 알려줘요.',
    tone: '전문적, 섬세함, 조화로움',
    greetingPrefix: '오늘의 미식 조합을 연구해볼까?',
    icon: '👨‍🍳',
  },
  CHEERFUL_VITAMIN: {
    name: '활기찬 비타민',
    tagline: '지친 하루에 넘치는 에너지를 주는 비타민',
    description: '긍정적인 에너지로 씩씩하게 응원하며 활기차고 즐거운 식사 시간을 만들어줘요.',
    tone: '명랑함, 에너지, 응원',
    greetingPrefix: '오늘도 파이팅 넘치게 냠냠!',
    icon: '⚡',
  },
};

export const STAGE_CONFIG: Record<
  PetStage,
  {
    name: string;
    minExp: number;
    maxExp: number;
    title: string;
    description: string;
    featureHighlight: string;
    visualTrait: string;
    animationTrait: string;
  }
> = {
  1: {
    name: '1단계: 처음 만난 밥친구',
    minExp: 0,
    maxExp: 100,
    title: '새싹 밥알이',
    description: '서로의 식습관을 막 알아가기 시작한 귀여운 밥친구예요.',
    featureHighlight: '식사를 기록할 때마다 함께 냠냠 먹고 경험치를 얻어요.',
    visualTrait: '머리 위에 귀여운 연두빛 새싹 1개',
    animationTrait: '호기심에 통통 튀며 고개를 갸웃거려요.',
  },
  2: {
    name: '2단계: 취향을 알아가는 친구',
    minExp: 100,
    maxExp: 300,
    title: '초보 미식 밥알이',
    description: '좋아하는 맛과 식재료를 기억하기 시작한 든든한 밥친구예요.',
    featureHighlight: '선호하는 조리법과 식재료를 학습해 메뉴를 추천해줘요.',
    visualTrait: '트윈 세이지 잎과 작은 나무 스푼 액세서리',
    animationTrait: '기분 좋게 좌우로 흔들거리며 취향에 반응해요.',
  },
  3: {
    name: '3단계: 나만의 밥친구',
    minExp: 300,
    maxExp: 600,
    title: '맞춤형 미식 셰프',
    description: '내 영양 밸런스와 단골 메뉴를 꿰뚫고 있는 진정한 밥친구예요.',
    featureHighlight: '남은 칼로리와 단백질 결손을 채우는 정밀 맞춤 메뉴를 추천해요.',
    visualTrait: '골든 로렐 월계관 & 붉은 보석 반다나, 은은한 아우라',
    animationTrait: '자신감 넘치는 셰프 윙크와 요리사 불꽃 이펙트!',
  },
  4: {
    name: '4단계: 영혼의 단짝 밥친구',
    minExp: 600,
    maxExp: 1000,
    title: '마스터 미식 파트너',
    description: '눈빛만 봐도 오늘 먹고 싶은 메뉴를 알아맞히는 평생 밥친구예요!',
    featureHighlight: '풍부한 식습관 데이터로 실패 없는 궁극의 식단 조합을 완성해요.',
    visualTrait: '빛나는 마스터 왕관, 세이지 골드 아우라 & 반짝이는 별빛',
    animationTrait: '공중에 부드럽게 부유하며 주변에 별빛이 반짝여요.',
  },
};

/**
 * Default initial Pet Profile
 */
export const DEFAULT_PET_PROFILE: PetProfile = {
  petId: 'pet-default-01',
  userId: 'user-default-01',
  petName: '보리',
  growthStage: 1,
  stageName: STAGE_CONFIG[1].name,
  experience: 0,
  maxExperienceForStage: 100,
  affection: 0,
  explorationProgress: 0,
  tasteUnderstanding: 0,
  personality: 'WARM_FRIEND',
  interactionCount: 0,
  favoriteFood: undefined,
  totalMealsShared: 0,
  rewardedMealLogIds: [],
  rewardedFeedbackIds: [],
  lastFedAt: new Date().toISOString(),
  lastInteractedAt: new Date().toISOString(),
  createdAt: '2026-10-14T08:00:00Z',
  updatedAt: new Date().toISOString(),
};

/**
 * Normalizes a food name for deduplication in the Food Collection (도감)
 */
export function normalizeFoodName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\[.*?\]|\(.*?\)/g, '') // remove bracketed portion notes
    .trim();
}

/**
 * Calculate updated stage based on total experience
 */
export function calculateStage(exp: number): {
  stage: PetStage;
  stageName: string;
  maxExp: number;
} {
  if (exp >= 600) {
    return { stage: 4, stageName: STAGE_CONFIG[4].name, maxExp: 1000 };
  } else if (exp >= 300) {
    return { stage: 3, stageName: STAGE_CONFIG[3].name, maxExp: 600 };
  } else if (exp >= 100) {
    return { stage: 2, stageName: STAGE_CONFIG[2].name, maxExp: 300 };
  } else {
    return { stage: 1, stageName: STAGE_CONFIG[1].name, maxExp: 100 };
  }
}

// Growth is paced across days; all reward sources share the same daily budget.
export const DAILY_EXP_LIMIT = 60;

export function startNewPetGeneration(pet: PetProfile): PetProfile | null {
  if (pet.growthStage !== 4 || pet.experience < 1000) return null;
  return normalizePetEvolution({
    ...normalizePetEvolution(pet),
    growthStage: 1, stageName: STAGE_CONFIG[1].name, maxExperienceForStage: 100,
    experience: 0, dietEntries: [], evolutionPath: pet.evolutionPath === 'PIG' ? 'PIG' : 'BALANCED',
    generation: (pet.generation || 1) + 1,
    generationStartedAt: new Date().toISOString(),
    // Keep the collection, affection, memories and today's reward budget.
    updatedAt: new Date().toISOString(),
  });
}

function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function grantDailyExp(pet: PetProfile, requested: number): { pet: PetProfile; gained: number; isStageUp: boolean } {
  const today = localDateKey();
  const alreadyGained = pet.dailyExpDate === today ? (pet.dailyExpGained || 0) : 0;
  const gained = Math.min(requested, Math.max(0, DAILY_EXP_LIMIT - alreadyGained), Math.max(0, 1000 - pet.experience));
  const experience = pet.experience + gained;
  const stageInfo = calculateStage(experience);
  return {
    pet: {
      ...advancePetEvolution(pet, stageInfo.stage),
      experience,
      growthStage: stageInfo.stage,
      stageName: stageInfo.stageName,
      maxExperienceForStage: stageInfo.maxExp,
      dailyExpDate: today,
      dailyExpGained: alreadyGained + gained,
    },
    gained,
    isStageUp: stageInfo.stage > pet.growthStage,
  };
}

/**
 * Awards experience, affection, and exploration when a meal log is successfully stored.
 * Strictly prevents duplicate awards for identical log IDs.
 */
export function processMealLogReward(
  pet: PetProfile,
  log: FoodLog,
  isNewFoodDiscovery: boolean
): {
  updatedPet: PetProfile;
  expGained: number;
  affectionGained: number;
  explorationGained: number;
  isStageUp: boolean;
  dialogueMessage: string;
} {
  // Check duplicate
  if (pet.rewardedMealLogIds.includes(log.id)) {
    return {
      updatedPet: pet,
      expGained: 0,
      affectionGained: 0,
      explorationGained: 0,
      isStageUp: false,
      dialogueMessage: `${pet.petName}가 이미 함께 먹은 식사예요!`,
    };
  }

  const feeding = feedPet(pet, log);
  const isCurrentMeal = log.consumedDate === localDateKey() && log.weightG > 0 && log.calories > 0;
  const requestedExp = isCurrentMeal ? Math.floor((isNewFoodDiscovery ? 50 : 30) * feeding.expMultiplier) : 0;
  const growthReward = grantDailyExp(recordDietMeal(feeding.updatedPet, log), requestedExp);
  const expGained = growthReward.gained;
  const affectionGained = feeding.isNewFeeding ? Math.min(10, 100 - pet.affection) : 0;
  const explorationGained = isCurrentMeal && (isNewFoodDiscovery || feeding.isNewFeeding) ? Math.min(isNewFoodDiscovery ? 20 : 5, 100 - pet.explorationProgress) : 0;

  const newAffection = Math.min(100, pet.affection + affectionGained);
  const newExploration = Math.min(100, pet.explorationProgress + explorationGained);
  const isStageUp = growthReward.isStageUp;

  // Generate nutrient-grounded response
  let dialogueMessage = '';
  if (isNewFoodDiscovery) {
    dialogueMessage = `우와, [${log.foodNameSnapshot}]은 우리 도감에 처음 등록되는 새로운 음식이야! 새로운 맛 탐험 성공! (+${expGained} EXP)`;
  } else if (log.protein >= 25) {
    dialogueMessage = `냠냠! [${log.foodNameSnapshot}] 맛있게 먹었어! 단백질이 ${log.protein}g이나 든든하게 들어간 영양 식단이야! (+${expGained} EXP)`;
  } else if (log.carbohydrates >= 50) {
    dialogueMessage = `[${log.foodNameSnapshot}] 함께 먹으니 에너지가 솟아나! 오후를 든든하게 보낼 수 있겠어. (+${expGained} EXP)`;
  } else if (log.calories <= 200 && log.fiber && log.fiber >= 3) {
    dialogueMessage = `아삭아삭 신선한 [${log.foodNameSnapshot}]! 식이섬유가 풍부해서 속이 아주 편안하고 산뜻해. (+${expGained} EXP)`;
  } else {
    dialogueMessage = `오늘의 식사 [${log.foodNameSnapshot}] 기록 완료! 너랑 함께 먹어서 더 맛있었어. (+${expGained} EXP)`;
  }
  if (!isCurrentMeal) {
    dialogueMessage = `[${log.foodNameSnapshot}] 식사 기록을 저장했어. 오늘이 아닌 날짜의 기록은 펫 급식과 성장 보상에 반영되지 않아.`;
  } else if (feeding.expMultiplier === 0) {
    dialogueMessage = `아 배불러~ 그래도 [${log.foodNameSnapshot}] 맛은 있네… 배 토닥토닥! 지금은 조금 쉬어갈래. 식사 기록은 저장했고 추가 EXP는 쉬어가요. 쌓은 경험치는 그대로예요.`;
  } else if (feeding.expMultiplier === 0.5) {
    dialogueMessage = `아 배불러~ 그래도 [${log.foodNameSnapshot}] 맛은 있네…! 배가 불러 추가 경험치는 절반만 받을게. (+${expGained} EXP)`;
  }
  if (isStageUp) {
    const path = growthReward.pet.evolutionPath || 'BALANCED';
    dialogueMessage += ` 함께 먹은 식사 덕분에 ${EVOLUTION_CONFIG[path].titles[growthReward.pet.growthStage - 1]}로 진화했어! 성장 도감에 새 모습을 남겼어.`;
  }

  const updatedPet: PetProfile = {
    ...growthReward.pet,
    affection: newAffection,
    explorationProgress: newExploration,
    totalMealsShared: pet.totalMealsShared + (feeding.isNewFeeding ? 1 : 0),
    rewardedMealLogIds: [log.id, ...pet.rewardedMealLogIds],
    lastFedAt: feeding.isNewFeeding ? new Date().toISOString() : pet.lastFedAt,
    updatedAt: new Date().toISOString(),
  };

  return {
    updatedPet,
    expGained,
    affectionGained,
    explorationGained,
    isStageUp,
    dialogueMessage,
  };
}

/**
 * Awards experience and taste understanding when recommendation feedback is provided.
 * Strictly prevents duplicate awards for the same feedback ID.
 */
export function processFeedbackReward(
  pet: PetProfile,
  feedback: RecommendationFeedback
): {
  updatedPet: PetProfile;
  expGained: number;
  tasteGained: number;
  isStageUp: boolean;
  dialogueMessage: string;
} {
  const rewardKey = `${localDateKey()}:${normalizeFoodName(feedback.menuName)}`;
  if (pet.rewardedFeedbackIds.includes(feedback.id) || pet.rewardedFeedbackKeys?.includes(rewardKey)) {
    return {
      updatedPet: pet,
      expGained: 0,
      tasteGained: 0,
      isStageUp: false,
      dialogueMessage: '',
    };
  }

  const fullness = getPetSatiety(pet);
  const requested = feedback.reaction === 'EATEN' || fullness >= 95 ? 0 : fullness >= 75 ? 7 : 15;
  const growthReward = grantDailyExp(pet, requested);
  const expGained = growthReward.gained;
  const tasteGained = 6;
  const newTaste = Math.min(100, pet.tasteUnderstanding + tasteGained);
  const isStageUp = growthReward.isStageUp;

  let dialogueMessage = '';
  if (feedback.reaction === 'INTERESTED') {
    dialogueMessage = `[${feedback.menuName}] 마음에 든다니 기뻐! 너의 긍정적인 취향을 기억해둘게.`;
  } else if (feedback.reaction === 'DISLIKED') {
    dialogueMessage = `[${feedback.menuName}] 취향에 안 맞았구나. 피드백을 기억해서 다음엔 더 꼭 맞는 메뉴를 찾아볼게!`;
  } else if (feedback.reaction === 'EATEN') {
    dialogueMessage = `추천 메뉴 [${feedback.menuName}]을 맛있게 먹어줘서 고마워! 나랑 취향이 찰떡궁합이야.`;
  }

  const updatedPet: PetProfile = {
    ...growthReward.pet,
    tasteUnderstanding: newTaste,
    rewardedFeedbackIds: [feedback.id, ...pet.rewardedFeedbackIds],
    rewardedFeedbackKeys: [...(pet.rewardedFeedbackKeys || []).filter((key) => key.startsWith(localDateKey())), rewardKey],
    updatedAt: new Date().toISOString(),
  };

  return {
    updatedPet,
    expGained,
    tasteGained,
    isStageUp,
    dialogueMessage,
  };
}

/**
 * Awards experience and affection when interacting directly with the pet (Petting, chatting, offering treat)
 */
export function interactWithPet(
  pet: PetProfile,
  interactionType: 'PET' | 'TALK' | 'TREAT'
): {
  updatedPet: PetProfile;
  expGained: number;
  affectionGained: number;
  isStageUp: boolean;
  message: string;
  mood: PetMood;
} {
  const today = localDateKey();
  const alreadyPettedToday = pet.dailyPetDate === today && (pet.dailyPetCount || 0) >= 1;
  const expGained = 0;
  const affectionGained = alreadyPettedToday ? 0 : interactionType === 'PET' ? 3 : 2;
  const newAffection = Math.min(100, (pet.affection ?? 0) + affectionGained);
  const isStageUp = false;
  const personality = pet.personality || 'WARM_FRIEND';

  let message = '';
  let mood: PetMood = 'HAPPY';

  if (interactionType === 'PET') {
    mood = 'CHEERING';
    if (personality === 'WARM_FRIEND') {
      message = alreadyPettedToday ? '오늘은 이미 충분히 쓰다듬어줘서 마음이 포근해! 내일 또 놀아줘.' : '헤헤, 쓰다듬어줘서 마음이 포근해졌어! 매일 찾아와줘서 좋아. (+3 친밀도)';
    } else if (personality === 'CURIOUS_EXPLORER') {
      message = alreadyPettedToday ? '오늘 같이 보낸 시간이 참 좋아! 내일은 새로운 맛도 탐험하자.' : '기분 최고야! 내일은 새로운 미식 탐험을 떠나자! (+3 친밀도)';
    } else if (personality === 'GOURMET_CHEF') {
      message = alreadyPettedToday ? '오늘 네 손길 덕분에 기분이 좋아. 내일 또 만나자!' : '너의 따뜻한 손길 덕분에 요리 영감이 샘솟아! (+3 친밀도)';
    } else {
      message = alreadyPettedToday ? '오늘도 함께해서 신났어! 내일 또 놀자!' : '와아 신난다! 매일 찾아와줘서 고마워! (+3 친밀도)';
    }
  } else if (interactionType === 'TREAT') {
    mood = 'SAVORING';
    message = alreadyPettedToday ? '오늘 간식은 충분해! 같이 있어줘서 고마워.' : '냠냠! 달콤한 간식 최고야! (+2 친밀도)';
  } else {
    mood = 'EXCITED';
    message = alreadyPettedToday ? '오늘도 이야기 나눠서 즐거웠어. 내일 또 들려줘!' : '너랑 이야기하는 시간이 제일 즐거워! (+2 친밀도)';
  }

  const updatedPet: PetProfile = {
    ...pet,
    affection: newAffection,
    dailyPetDate: today,
    dailyPetCount: (pet.dailyPetDate === today ? (pet.dailyPetCount || 0) : 0) + (alreadyPettedToday ? 0 : 1),
    interactionCount: (pet.interactionCount || 0) + 1,
    lastInteractedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    updatedPet,
    expGained,
    affectionGained,
    isStageUp,
    message,
    mood,
  };
}

/**
 * Generate contextual, natural dialogue for the Pet based on real-time factors
 * Guaranteed: Zero guilt, warm companion empathy, proactive invitations, and rich action pills.
 */
export function getContextualPetDialogue(params: {
  pet: PetProfile;
  summary: DailyNutritionSummary;
  tasteProfile: UserTasteProfile;
  recentLogs: FoodLog[];
  collectionCount: number;
}): PetDialogue {
  const { pet, summary, tasteProfile, recentLogs, collectionCount } = params;
  const now = new Date();
  const hour = now.getHours();
  const personality = pet.personality || 'WARM_FRIEND';
  const stage = pet.growthStage;
  const fullness = getPetSatiety(pet);
  if (fullness >= 75) {
    return {
      id: `dlg-full-${Date.now()}`, message: fullness >= 95 ? '아 배불러~ 그래도 맛은 있네… 잠깐 누워서 배 토닥토닥할래!' : '배가 포근하게 불렀어~ 오늘 함께 먹은 맛을 천천히 기억하는 중이야.',
      subMessage: '포만감은 시간이 지나면 자연스럽게 내려가요. 대화와 쓰다듬기는 포만감을 바꾸지 않아요.',
      mood: fullness >= 95 ? 'SLEEPY' : 'SAVORING', context: 'PROACTIVE_CHAT',
      actions: [{ id: 'full-collection', label: '📖 성장 도감 구경', actionType: 'EXPLORE', collectionTab: 'GROWTH' }], timestamp: new Date().toISOString(),
    };
  }

  // 1. If a meal was logged very recently (within past 5 minutes)
  const latestLog = recentLogs[0];
  if (latestLog) {
    const logTime = new Date(latestLog.consumedAt).getTime();
    if (latestLog.consumedDate === localDateKey() && Date.now() >= logTime && Date.now() - logTime < 1000 * 60 * 5) {
      return {
        id: `dlg-${Date.now()}`,
        message: `방금 먹은 [${latestLog.foodNameSnapshot}] 정말 든든했어! 나랑 같이 먹어줘서 고마워.`,
        subMessage: `${latestLog.foodNameSnapshot}의 맛과 영양 데이터를 기억해둘게!`,
        mood: 'SAVORING',
        context: 'MEAL_ADDED',
        actions: [
          { id: 'act-1', label: '📖 음식 도감에서 확인', actionType: 'EXPLORE' },
          { id: 'act-2', label: `💬 ${pet.petName}와 대화하기`, actionType: 'INTERACT' },
        ],
        timestamp: new Date().toISOString(),
      };
    }
  }

  // 2. Proactive Meal Companion Invitations based on time & taste preferences
  // Breakfast time (06:00 ~ 10:59)
  if (hour >= 6 && hour < 11) {
    if (personality === 'CURIOUS_EXPLORER') {
      return {
        id: `dlg-${Date.now()}`,
        message: '좋은 아침! 오늘 첫 끼는 도감에 없는 새로운 아침 메뉴를 한번 탐험해볼까?',
        subMessage: '가벼운 과일 보울이나 따뜻한 죽 요리도 좋아!',
        mood: 'CURIOUS',
        context: 'PROACTIVE_CHAT',
        actions: [
          { id: 'act-br-1', label: '🥣 가벼운 아침 추천', actionType: 'RECOMMEND', categoryFilter: '가벼운식단' },
          { id: 'act-br-2', label: '🧭 도감 탐험하기', actionType: 'EXPLORE' },
          { id: 'act-br-3', label: '✍️ 아침 기록하기', actionType: 'LOG_MEAL', mealType: mealTypeForText('✍️ 아침 기록하기') },
        ],
        timestamp: new Date().toISOString(),
      };
    } else if (personality === 'GOURMET_CHEF') {
      return {
        id: `dlg-${Date.now()}`,
        message: '상쾌한 아침이야. 밤새 비어있던 몸을 깨우는 부드럽고 따뜻한 아침 식사를 준비해볼까?',
        subMessage: '달걀 요리나 그릭 요거트로 가벼운 단백질을 채워주면 오전 집중력이 쑥 올라가!',
        mood: 'HAPPY',
        context: 'PROACTIVE_CHAT',
        actions: [
          { id: 'act-br-1', label: '🍳 영양 아침 추천', actionType: 'RECOMMEND', categoryFilter: '고단백' },
          { id: 'act-br-2', label: '✍️ 아침 기록하기', actionType: 'LOG_MEAL', mealType: mealTypeForText('✍️ 아침 기록하기') },
        ],
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        id: `dlg-${Date.now()}`,
        message: '좋은 아침! 오늘 아침은 가볍게 시작할까, 든든하게 먹을까? 같이 골라보자!',
        subMessage: '바쁘다면 바나나나 삶은 계란 하나도 큰 힘이 돼.',
        mood: 'HAPPY',
        context: 'PROACTIVE_CHAT',
        actions: [
          { id: 'act-br-1', label: '☀️ 아침 메뉴 추천', actionType: 'RECOMMEND' },
          { id: 'act-br-2', label: '✍️ 먹은 식사 기록', actionType: 'LOG_MEAL', mealType: mealTypeForText('✍️ 먹은 식사 기록') },
        ],
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Lunch time (11:00 ~ 13:59) - Featured Proactive "같이 골라보자!" & "따뜻한 국밥"
  if (hour >= 11 && hour < 14) {
    const isColdWeatherOrCraving = (now.getDate() + now.getHours()) % 2 === 0;

    if (isColdWeatherOrCraving) {
      return {
        id: `dlg-${Date.now()}`,
        message: '오늘은 따뜻하고 든든한 국밥이나 찌개가 생각나는데, 오늘 점심 같이 먹어줄래?',
        subMessage: '소고기 무국, 맑은 순두부찌개, 콩나물국밥처럼 속 편한 메뉴도 아주 좋아!',
        mood: 'HUNGRY',
        context: 'PROACTIVE_CHAT',
        actions: [
          { id: 'act-soup-1', label: '🍲 따뜻한 국물 요리 볼래!', actionType: 'RECOMMEND', categoryFilter: '국물' },
          { id: 'act-soup-2', label: '🥗 가볍고 산뜻한 메뉴 원해', actionType: 'RECOMMEND', categoryFilter: '샐러드' },
          { id: 'act-soup-3', label: '✍️ 이미 먹은 점심 기록', actionType: 'LOG_MEAL', mealType: mealTypeForText('✍️ 이미 먹은 점심 기록') },
        ],
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        id: `dlg-${Date.now()}`,
        message: '오늘 점심은 뭐 먹을 거야? 영양과 취향을 듬뿍 담아서 같이 골라보자!',
        subMessage: '어떤 느낌이 당기는지 말해주면 딱 맞는 메뉴를 찾아줄게.',
        mood: 'EXCITED',
        context: 'PROACTIVE_CHAT',
        actions: [
          { id: 'act-lunch-1', label: '🍽️ 점심 메뉴 골라보기', actionType: 'RECOMMEND' },
          { id: 'act-lunch-2', label: '💪 든든한 고단백 식단', actionType: 'RECOMMEND', categoryFilter: '고단백' },
          { id: 'act-lunch-3', label: '✍️ 방금 먹은 거 기록', actionType: 'LOG_MEAL', mealType: mealTypeForText('✍️ 방금 먹은 거 기록') },
        ],
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Afternoon Snack / Exploration (14:00 ~ 16:59) - Featured Proactive "새로운 음식 발견!"
  if (hour >= 14 && hour < 17) {
    const recordedNames = new Set(recentLogs.map((log) => normalizeFoodName(log.foodNameSnapshot)));
    const undiscoveredCandidate = VERIFIED_FOODS.find((food) => !recordedNames.has(normalizeFoodName(food.name)));
    return {
      id: `dlg-${Date.now()}`,
      message: undiscoveredCandidate ? `아직 기록하지 않은 [${undiscoveredCandidate.name}]을 발견했어! 도감에서 같이 살펴볼까?` : '도감에 맛있는 기억이 가득해! 좋아했던 음식을 다시 살펴볼까?',
      subMessage: '새 음식 기록은 하루 성장 한도 안에서 보너스를 받아요.',
      mood: 'CURIOUS',
      context: 'PROACTIVE_CHAT',
      actions: [
        { id: 'act-explore-1', label: '🧭 음식 도감에서 확인', actionType: 'EXPLORE' },
        { id: 'act-explore-2', label: '✨ 새로운 메뉴 추천', actionType: 'RECOMMEND' },
        { id: 'act-explore-3', label: '✍️ 오후 간식 기록', actionType: 'LOG_MEAL', mealType: mealTypeForText('✍️ 오후 간식 기록') },
      ],
      timestamp: new Date().toISOString(),
    };
  }

  // Dinner time (17:00 ~ 21:29)
  if (hour >= 17 && hour < 22) {
    // Check if remaining protein exists
    if (summary.remainingProtein > 20) {
      return {
        id: `dlg-${Date.now()}`,
        message: `오늘 하루 정말 고생 많았어! 단백질을 채워줄 든든하고 맛있는 저녁 같이 먹자.`,
        subMessage: `두부 구이나 생선 조림, 닭가슴살 요리로 저녁을 산뜻하게 채워볼까?`,
        mood: 'HAPPY',
        context: 'RECOMMEND',
        actions: [
          { id: 'act-din-1', label: '🐟 고단백 저녁 추천', actionType: 'RECOMMEND', categoryFilter: '고단백' },
          { id: 'act-din-2', label: '🍲 부담 없는 저녁 메뉴', actionType: 'RECOMMEND', categoryFilter: '가벼운식단' },
          { id: 'act-din-3', label: '✍️ 저녁 식사 기록', actionType: 'LOG_MEAL', mealType: mealTypeForText('✍️ 저녁 식사 기록') },
        ],
        timestamp: new Date().toISOString(),
      };
    }

    return {
      id: `dlg-${Date.now()}`,
      message: '오늘 저녁은 무엇으로 마무리할까? 하루를 따뜻하게 정리해주는 맛있는 한 끼를 골라보자!',
      subMessage: '너와 함께하는 저녁 식사 시간이 하루 중 가장 기다려져.',
      mood: 'HAPPY',
      context: 'PROACTIVE_CHAT',
      actions: [
        { id: 'act-din-1', label: '🌙 저녁 메뉴 골라보기', actionType: 'RECOMMEND' },
        { id: 'act-din-2', label: '✍️ 저녁 식사 기록하기', actionType: 'LOG_MEAL', mealType: mealTypeForText('✍️ 저녁 식사 기록하기') },
      ],
      timestamp: new Date().toISOString(),
    };
  }

  // Late evening / night (22:00 ~ 05:59) - Zero guilt, warm comfort
  return {
    id: `dlg-${Date.now()}`,
    message: '오늘 하루도 나와 함께 알차게 하루를 보내줘서 고마워. 편안한 밤 보내고 내일 또 만나자!',
    subMessage: '혹시 출출하다면 따뜻한 보리차나 캐모마일 티 한 잔으로 속을 편안하게 달래줘.',
    mood: 'SLEEPY',
    context: 'CARE_COMFORT',
    actions: [
      { id: 'act-night-1', label: '💤 밥친구 쓰다듬기', actionType: 'INTERACT' },
      { id: 'act-night-2', label: '✍️ 오늘 못 쓴 기록 남기기', actionType: 'LOG_MEAL', mealType: mealTypeForText('✍️ 오늘 못 쓴 기록 남기기') },
    ],
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate interactive reply when user asks something in the Pet Chat Lounge
 */
export function getPetChatResponse(
  userQuery: string,
  params: {
    pet: PetProfile;
    summary: DailyNutritionSummary;
    tasteProfile: UserTasteProfile;
    collectionCount: number;
  }
): {
  reply: string;
  mood: PetMood;
  suggestedAction?: {
    type: 'RECOMMEND' | 'LOG_MEAL' | 'EXPLORE' | 'FILTER';
    param?: string;
  };
} {
  const { pet, summary, tasteProfile, collectionCount } = params;
  const q = userQuery.toLowerCase();
  const personality = pet.personality || 'WARM_FRIEND';

  if (/포만|배불|배가.*(꺼|부르)|소화/.test(q)) {
    const fullness = getPetSatiety(pet);
    return {
      reply: fullness >= 75 ? `아 배불러~ 그래도 맛은 있네… 지금 포만감은 ${Math.round(fullness)}%야. 천천히 쉬면서 배 토닥토닥할래! 대화나 쓰다듬기로 배가 꺼지진 않고 시간이 지나면 자연스럽게 편안해져.` : `지금은 편안한 배야! 포만감은 ${Math.round(fullness)}%이고, 시간에 따라 자연스럽게 내려가. 이야기하거나 쓰다듬어도 포만감은 바뀌지 않아.`,
      mood: fullness >= 95 ? 'SLEEPY' : 'SAVORING',
    };
  }

  if (/샐러드|가볍|속 편|부드러운/.test(q)) {
    return { reply: '산뜻하고 가벼운 메뉴를 같이 살펴보자! 등록된 알레르기와 식사 기록을 반영해서 골라줄게.',
      mood: 'HAPPY', suggestedAction: { type: 'RECOMMEND', param: q.includes('샐러드') ? '샐러드' : '가벼운식단' } };
  }

  if (q.includes('국밥') || q.includes('국물') || q.includes('찌개') || q.includes('탕')) {
    return {
      reply: '따뜻한 국물 요리 정말 좋지! 맑은 콩나물국밥이나 순두부찌개, 두부버섯전골 어때? 속도 편안하고 든든할 거야!',
      mood: 'HUNGRY',
      suggestedAction: { type: 'RECOMMEND', param: '국물' },
    };
  }

  if (q.includes('새로운') || q.includes('탐험') || q.includes('도감') || q.includes('이색')) {
    return {
      reply: `새로운 음식 탐험이라니 너무 신나! 지금 도감에 ${collectionCount}가지 음식이 기록되어 있어. 아직 안 먹어본 메뉴 도감에서 같이 찾아볼까?`,
      mood: 'CURIOUS',
      suggestedAction: { type: 'EXPLORE' },
    };
  }

  if (q.includes('단백질') || q.includes('근육') || q.includes('고단백') || q.includes('다이어트')) {
    return {
      reply: `단백질 충전 타임이구나! 닭가슴살 샐러드, 소고기 부채살 구이, 연어 스테이크처럼 영양 꽉 찬 메뉴들을 모아봤어!`,
      mood: 'PROUD',
      suggestedAction: { type: 'RECOMMEND', param: '고단백' },
    };
  }

  if (q.includes('기록') || q.includes('방금 먹었') || q.includes('먹었어')) {
    return {
      reply: '오, 맛있는 식사를 했구나! 너랑 같이 먹은 기분이야. 바로 식사 기록창을 열어줄게!',
      mood: 'HAPPY',
      suggestedAction: { type: 'LOG_MEAL' },
    };
  }

  if (q.includes('배고파') || q.includes('뭐 먹지') || q.includes('추천') || q.includes('점심') || q.includes('저녁')) {
    return {
      reply: `너의 입맛과 영양 목표를 꼼꼼히 살폈어! 오늘의 베스트 추천 식단을 바로 보여줄게. 같이 살펴보자!`,
      mood: 'EXCITED',
      suggestedAction: { type: 'RECOMMEND' },
    };
  }

  // General warm companion conversation
  return {
    reply: `언제나 너 곁에서 맛있는 식사를 함께하는 ${pet.petName}(이)가 될게! 오늘 식사도 기분 좋고 맛있게 챙기자.`,
    mood: 'HAPPY',
  };
}

/**
 * Synchronize and assemble Food Collection items from all FoodLogs, Verified Foods, and Custom Foods
 */
export function syncFoodCollection(
  foodLogs: FoodLog[],
  existingItems: FoodCollectionItem[] = []
): FoodCollectionItem[] {
  const existingMap = new Map(existingItems.map((item) => [item.normalizedName, item]));
  const collectionMap = new Map<string, FoodCollectionItem>();
  const grouped = new Map<string, FoodLog[]>();
  for (const log of foodLogs) {
    const name = normalizeFoodName(log.foodNameSnapshot);
    if (name) grouped.set(name, [...(grouped.get(name) || []), log]);
  }
  for (const [name, logs] of grouped) {
    const ordered = [...logs].sort((a, b) => a.consumedDate.localeCompare(b.consumedDate) || a.consumedAt.localeCompare(b.consumedAt));
    const first = ordered[0];
    const last = ordered[ordered.length - 1];
    const saved = existingMap.get(name);
    const known = VERIFIED_FOODS.find((food) => food.id === last.foodId);
    collectionMap.set(name, {
      id: saved?.id || `col-${name.replace(/\s+/g, '-')}`, foodId: last.foodId,
      normalizedName: name, foodName: last.foodNameSnapshot,
      firstRecordedAt: `${first.consumedDate}T00:00:00`, lastRecordedAt: `${last.consumedDate}T00:00:00`,
      recordCount: logs.length, personalRating: saved?.personalRating ?? last.satisfactionRating,
      isFavorite: saved?.isFavorite || false, calories: last.calories,
      carbohydrates: last.carbohydrates, protein: last.protein, fat: last.fat,
      servingWeightG: last.weightG, allergens: known?.allergens || last.detectedAllergens,
      mainCategory: known?.mainCategory, cookingMethod: known?.cookingMethod, flavorProfile: known?.flavorProfile,
      isDiscovered: true,
    });
  }
  for (const food of VERIFIED_FOODS) {
    const name = normalizeFoodName(food.name);
    if (collectionMap.has(name)) continue;
    const saved = existingMap.get(name);
    collectionMap.set(name, {
      id: saved?.id || `col-${food.id}`, foodId: food.id, normalizedName: name, foodName: food.name,
      firstRecordedAt: '', lastRecordedAt: '', recordCount: 0,
      personalRating: saved?.personalRating, isFavorite: saved?.isFavorite || false,
      calories: food.calories, carbohydrates: food.carbohydrates, protein: food.protein, fat: food.fat,
      servingWeightG: food.nutritionBasisGrams || 100,
      mainCategory: food.mainCategory, cookingMethod: food.cookingMethod, flavorProfile: food.flavorProfile,
      allergens: food.allergens, isDiscovered: false,
    });
  }
  // A removed custom food can still retain its explicitly saved favorite/rating.
  for (const [name, saved] of existingMap) {
    if (!collectionMap.has(name) && (saved.isFavorite || saved.personalRating)) {
      collectionMap.set(name, { ...saved, firstRecordedAt: '', lastRecordedAt: '', recordCount: 0, isDiscovered: false });
    }
  }
  return [...collectionMap.values()];
}
