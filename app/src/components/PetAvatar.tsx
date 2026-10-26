/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useId, useState } from 'react';
import { PetEvolutionPath, PetMood, PetStage } from '../types/nutrition';
import { EVOLUTION_CONFIG } from '../utils/petEvolution';

interface PetAvatarProps {
  stage?: PetStage;
  mood?: PetMood;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isEating?: boolean;
  className?: string;
  onClick?: () => void;
  showHeartOnTap?: boolean;
  evolutionPath?: PetEvolutionPath;
  silhouette?: boolean;
  satiety?: number;
}

export const PetAvatar: React.FC<PetAvatarProps> = ({
  stage = 2,
  mood = 'HAPPY',
  size = 'md',
  isEating = false,
  className = '',
  onClick,
  showHeartOnTap = true,
  evolutionPath = 'BALANCED',
  silhouette = false,
  satiety = 0,
}) => {
  const [tapHeart, setTapHeart] = useState<boolean>(false);
  const gradientId = useId().replace(/:/g, '');
  const variant = EVOLUTION_CONFIG[evolutionPath] || EVOLUTION_CONFIG.BALANCED;
  const isPig = evolutionPath === 'PIG';
  const belly = Math.max(0, Math.min(100, satiety)) / 100;
  const bodyEdge = isPig ? 26 - stage * 2 - belly * 2 : 24 - belly * 3;

  const sizeMap = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
    xl: 'w-36 h-36',
  };

  const handleAvatarClick = () => {
    if (silhouette) return;
    if (showHeartOnTap) {
      setTapHeart(true);
      setTimeout(() => setTapHeart(false), 900);
    }
    if (onClick) onClick();
  };

  // Stage-specific idle animation
  const getStageAnimationClass = () => {
    if (isEating) return 'animate-bounce';
    if (satiety >= 95 && !silhouette) return 'rotate-6 translate-y-1 transition-transform duration-500';
    switch (stage) {
      case 1:
        return 'hover:scale-105 active:scale-95 transition-transform duration-300';
      case 2:
        return 'hover:scale-105 active:scale-95 transition-transform duration-300';
      case 3:
        return 'hover:scale-105 active:scale-95 transition-transform duration-300';
      case 4:
        return 'animate-pulse hover:scale-110 active:scale-95 transition-transform duration-300';
      default:
        return 'hover:scale-105 active:scale-95';
    }
  };

  return (
    <div
      onClick={handleAvatarClick}
      className={`relative flex items-center justify-center select-none ${sizeMap[size]} ${className} ${
        onClick ? 'cursor-pointer' : ''
      }`}
      role="img"
      aria-label={silhouette ? `미발견 성장 모습 (${stage}단계)` : `밥친구 (${stage}단계${stage > 1 ? `, ${variant.name}` : ''}, 표정: ${mood})`}
    >
      {/* Background Glow / Aura for Stage 3 & 4 */}
      {stage >= 3 && !silhouette && (
        <div className="absolute inset-0 bg-amber-100/70 rounded-full blur-md -z-10 animate-pulse" />
      )}
      {stage === 4 && !silhouette && (
        <div className="absolute -inset-2 bg-gradient-to-tr from-[#7E9F83]/30 via-amber-200/50 to-emerald-200/40 rounded-full blur-xl -z-10 animate-pulse opacity-90" />
      )}

      {/* Floating Heart Particle on Tap */}
      {tapHeart && (
        <div className="absolute -top-4 text-rose-500 font-bold text-sm animate-bounce z-20 pointer-events-none drop-shadow-xs">
          ❤️ +기쁨!
        </div>
      )}

      {/* SVG Pet Body */}
      <svg
        viewBox="0 0 120 120"
        style={silhouette ? { filter: 'brightness(0)', opacity: 0.23 } : undefined}
        className={`w-full h-full transition-transform duration-300 ${getStageAnimationClass()}`}
      >
        <defs>
          <linearGradient id={`${gradientId}-body`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor={stage > 1 || isPig ? variant.body : '#F5EFE6'} />
          </linearGradient>
          <linearGradient id={`${gradientId}-sage`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7E9F83" />
            <stop offset="100%" stopColor="#435746" />
          </linearGradient>
          <linearGradient id={`${gradientId}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FCD34D" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id={`${gradientId}-wood`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>
        </defs>

        {/* Shadow */}
        <ellipse cx="60" cy="110" rx="34" ry="7" fill="#E7E5E4" opacity="0.6" />

        {/* Back accessories by Stage */}
        {/* Stage 2: Cute Little Wooden Spoon on Back */}
        {stage === 2 && (
          <g transform="rotate(25 88 50)">
            <rect x="85" y="32" width="4.5" height="26" rx="2" fill={`url(#${gradientId}-wood)`} />
            <ellipse cx="87.2" cy="30" rx="6.5" ry="8.5" fill={`url(#${gradientId}-wood)`} />
          </g>
        )}

        {/* Stage 3 & 4: Culinary Ribbon or Wings */}
        {stage >= 3 && (
          <g opacity="0.75">
            {/* Little golden angel or chef wing accents */}
            <path d="M22 68 Q12 55 24 50 Q28 62 25 72 Z" fill={`url(#${gradientId}-gold)`} />
            <path d="M98 68 Q108 55 96 50 Q92 62 95 72 Z" fill={`url(#${gradientId}-gold)`} />
          </g>
        )}

        {/* Headwear Accessories by Stage */}
        {/* Stage 1: Baby Sprout */}
        {stage === 1 && (
          <g className="origin-bottom">
            <path
              d="M60 28 C60 16 50 14 52 8 C58 9 64 16 60 28 Z"
              fill={`url(#${gradientId}-sage)`}
            />
            <circle cx="53" cy="10" r="3" fill="#A3B899" />
          </g>
        )}

        {/* Stage 2: Twin Sage Leaves */}
        {stage === 2 && (
          <g>
            <path
              d="M58 26 C54 12 42 16 46 8 C54 7 60 17 58 26 Z"
              fill={`url(#${gradientId}-sage)`}
            />
            <path
              d="M62 26 C66 12 78 16 74 8 C66 7 60 17 62 26 Z"
              fill="#8FA894"
            />
            <circle cx="60" cy="24" r="2.5" fill="#435746" />
          </g>
        )}

        {/* Stage 3: Little Chef Band / Golden Laurel */}
        {stage === 3 && (
          <g>
            <path
              d="M45 22 L52 27 L60 16 L68 27 L75 22 L72 32 L48 32 Z"
              fill={`url(#${gradientId}-gold)`}
              stroke="#D97706"
              strokeWidth="0.8"
            />
            <circle cx="60" cy="18" r="3" fill="#EF4444" />
            <circle cx="50" cy="24" r="2" fill="#FBBF24" />
            <circle cx="70" cy="24" r="2" fill="#FBBF24" />
          </g>
        )}

        {/* Stage 4: Master Star Crown & Radiant Gems */}
        {stage === 4 && (
          <g>
            <path
              d="M40 22 L50 29 L60 13 L70 29 L80 22 L76 34 L44 34 Z"
              fill={`url(#${gradientId}-gold)`}
              stroke="#B45309"
              strokeWidth="1.2"
            />
            <circle cx="60" cy="16" r="3.5" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="0.8" />
            <circle cx="48" cy="24" r="2.5" fill="#10B981" />
            <circle cx="72" cy="24" r="2.5" fill="#EC4899" />
            {/* Twinkling star dust */}
            <path
              d="M26 24 L28 27 L26 30 L24 27 Z"
              fill="#F59E0B"
              className="animate-ping"
            />
            <path
              d="M94 28 L96 31 L94 34 L92 31 Z"
              fill="#F59E0B"
              className="animate-pulse"
            />
            <circle cx="34" cy="40" r="1.5" fill="#FBBF24" />
            <circle cx="86" cy="40" r="1.5" fill="#FBBF24" />
          </g>
        )}

        {/* Path-specific outlines remain recognizable in the locked silhouettes. */}
        {stage > 1 && evolutionPath === 'GARDEN' && <g fill={variant.color}>
          <path d="M30 49 Q7 33 18 18 Q38 26 35 45 Z" />
          <path d="M90 49 Q113 33 102 18 Q82 26 85 45 Z" />
          {stage >= 3 && <path d="M17 90 Q0 73 10 61 Q30 67 30 87 Z M103 90 Q120 73 110 61 Q90 67 90 87 Z" />}
        </g>}
        {stage > 1 && evolutionPath === 'PROTEIN' && <g fill={variant.color}>
          <path d="M27 54 L13 44 L16 26 L34 37 Z M93 54 L107 44 L104 26 L86 37 Z" />
          {stage >= 3 && <path d="M29 84 L9 93 L14 66 L31 67 Z M91 84 L111 93 L106 66 L89 67 Z" />}
        </g>}
        {stage > 1 && evolutionPath === 'GRAIN' && <g fill={variant.color}>
          <path d="M22 85 Q4 41 23 14 Q15 48 28 78 Z M98 85 Q116 41 97 14 Q105 48 92 78 Z" />
          {[31, 44, 57].map((y) => <g key={y}><ellipse cx="17" cy={y} rx="7" ry="4" transform={`rotate(-25 17 ${y})`} /><ellipse cx="103" cy={y} rx="7" ry="4" transform={`rotate(25 103 ${y})`} /></g>)}
        </g>}
        {stage > 1 && evolutionPath === 'BALANCED' && <g fill={variant.color}>
          <path d="M31 32 Q15 21 29 13 Q34 2 46 13 Q60 0 72 13 Q88 2 92 17 Q106 24 88 34 Z" />
          {stage >= 3 && <path d="M26 94 L8 109 L11 78 L28 74 Z M94 94 L112 109 L109 78 L92 74 Z" />}
        </g>}

        {isPig && <g fill="#EDB5C5" stroke="#CA8C9F" strokeWidth="1.3">
          <path d="M31 44 Q13 16 25 14 Q41 17 44 36 Z M89 44 Q107 16 95 14 Q79 17 76 36 Z" />
          <path d="M96 84 Q116 72 113 89 Q108 100 106 89 Q108 83 112 87" fill="none" strokeWidth="3" />
        </g>}
        {isPig && stage === 3 && <path d="M38 33 L38 23 Q24 17 34 10 Q40 2 49 10 Q60 -1 71 10 Q82 2 87 13 Q96 22 82 25 L82 33 Z" fill="#FFF9F4" stroke="#D9B7C1" strokeWidth="1.5" />}

        {/* Main Pet Body - Soft, Round Rice Grain Silhouette */}
        <path
          d={`M60 26 C36 26 ${bodyEdge} 45 ${bodyEdge} 72 C${bodyEdge} 96 38 108 60 108 C82 108 ${120 - bodyEdge} 96 ${120 - bodyEdge} 72 C${120 - bodyEdge} 45 84 26 60 26 Z`}
          fill={`url(#${gradientId}-body)`}
          stroke="#E2DDD5"
          strokeWidth="2.5"
        />

        {/* Soft Cheeks (Blush) */}
        <ellipse cx="38" cy="74" rx="6" ry="4" fill="#FECDD3" opacity="0.85" />
        <ellipse cx="82" cy="74" rx="6" ry="4" fill="#FECDD3" opacity="0.85" />

        {/* Arms / Hands */}
        {mood === 'CHEERING' || mood === 'EXCITED' ? (
          /* Cheering arms up! */
          <g fill="#F5EFE6" stroke="#E2DDD5" strokeWidth="1.8">
            <path d="M25 65 Q18 50 24 42 Q30 46 29 58 Z" />
            <path d="M95 65 Q102 50 96 42 Q90 46 91 58 Z" />
          </g>
        ) : (
          /* Rest hands on tummy */
          <g fill="#F5EFE6" stroke="#E2DDD5" strokeWidth="1.5">
            <ellipse cx="33" cy="80" rx="4.5" ry="3.5" />
            <ellipse cx="87" cy="80" rx="4.5" ry="3.5" />
          </g>
        )}

        {/* Eyes based on mood */}
        {mood === 'SLEEPY' ? (
          <g stroke="#44403C" strokeWidth="2.5" strokeLinecap="round" fill="none">
            <path d="M42 66 Q47 70 52 66" />
            <path d="M68 66 Q73 70 78 66" />
          </g>
        ) : mood === 'HAPPY' || mood === 'CHEERING' || isEating ? (
          <g stroke="#44403C" strokeWidth="3" strokeLinecap="round" fill="none">
            <path d="M42 66 Q47 59 52 66" />
            <path d="M68 66 Q73 59 78 66" />
          </g>
        ) : mood === 'EXCITED' ? (
          /* Sparkling star eyes */
          <g fill="#D97706">
            <path d="M47 58 L49 63 L54 64 L50 67 L51 72 L47 69 L43 72 L44 67 L40 64 L45 63 Z" />
            <path d="M73 58 L75 63 L80 64 L76 67 L77 72 L73 69 L69 72 L70 67 L66 64 L71 63 Z" />
          </g>
        ) : mood === 'SAVORING' ? (
          <g stroke="#44403C" strokeWidth="3" strokeLinecap="round" fill="none">
            <path d="M42 66 Q47 58 52 66" />
            <path d="M68 66 Q73 58 78 66" />
          </g>
        ) : mood === 'CURIOUS' ? (
          <g fill="#292524">
            <ellipse cx="47" cy="63" rx="4.5" ry="5.5" />
            <ellipse cx="73" cy="63" rx="5" ry="6" />
            <circle cx="49" cy="61" r="1.5" fill="#FFFFFF" />
            <circle cx="75" cy="61" r="2" fill="#FFFFFF" />
          </g>
        ) : mood === 'PROUD' ? (
          <g stroke="#292524" strokeWidth="2.8" strokeLinecap="round" fill="none">
            <path d="M41 65 Q47 60 53 65" />
            <path d="M67 65 Q73 60 79 65" />
          </g>
        ) : (
          /* Default Alert / Hungry / Thinking Eyes */
          <g fill="#292524">
            <ellipse cx="46" cy="64" rx="4" ry="5" />
            <ellipse cx="74" cy="64" rx="4" ry="5" />
            <circle cx="48" cy="62" r="1.5" fill="#FFFFFF" />
            <circle cx="76" cy="62" r="1.5" fill="#FFFFFF" />
          </g>
        )}

        {/* Mouth based on mood & eating */}
        {isEating ? (
          <ellipse cx="60" cy="78" rx="5.5" ry="4.5" fill="#F43F5E" />
        ) : mood === 'HUNGRY' || mood === 'SAVORING' ? (
          <g>
            <path
              d="M55 76 Q60 84 65 76 Z"
              fill="#F43F5E"
              stroke="#44403C"
              strokeWidth="1.5"
            />
            {/* Cute drool droplet */}
            <path d="M66 79 Q68 83 67 85 Q65 85 65 81 Z" fill="#60A5FA" />
          </g>
        ) : mood === 'HAPPY' || mood === 'EXCITED' || mood === 'CHEERING' ? (
          <path
            d="M54 75 Q60 83 66 75"
            stroke="#44403C"
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
          />
        ) : mood === 'THINKING' ? (
          <ellipse cx="63" cy="76" rx="2.5" ry="2.5" fill="#44403C" />
        ) : (
          <path
            d="M56 75 Q60 78 64 75"
            stroke="#44403C"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* Stage 2+ Little Chef Apron or Bowl / Heart Accents */}
        {isPig && <g>
          <ellipse cx="60" cy="80" rx={stage === 1 ? 10 : 13} ry="8" fill="#EFA6BA" stroke="#CF829A" strokeWidth="1" />
          <ellipse cx="56" cy="80" rx="1.5" ry="2.5" fill="#A9607A" />
          <ellipse cx="64" cy="80" rx="1.5" ry="2.5" fill="#A9607A" />
        </g>}
        {satiety >= 75 && !silhouette && <path d="M43 91 Q60 98 77 91" fill="none" stroke="#D1AAA5" strokeWidth="1.5" strokeLinecap="round" />}
        {stage >= 2 && (
          <g>
            <path
              d="M48 88 Q60 93 72 88 L70 98 Q60 102 50 98 Z"
              fill="#435746"
              opacity="0.88"
            />
            <circle cx="60" cy="94" r="2" fill="#FFFFFF" />
          </g>
        )}

        {/* Sleepy z Z floating bubble */}
        {mood === 'SLEEPY' && (
          <g fill="#A8A29E" className="animate-pulse">
            <text x="82" y="50" fontSize="10" fontWeight="bold">z</text>
            <text x="90" y="42" fontSize="12" fontWeight="bold">Z</text>
          </g>
        )}
      </svg>

      {/* Floating Heart / Sparkle on Eating */}
      {isEating && (
        <div className="absolute -top-3 right-0 text-rose-500 font-bold text-xs animate-ping">
          ❤️ 냠냠!
        </div>
      )}
    </div>
  );
};
