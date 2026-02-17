import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LEVEL_XP, LEVEL_TITLES } from '../theme';
import { ACHIEVEMENTS, Achievement } from '../data/achievements';
import { getBossForWeek, getWeekNumber, Boss } from '../data/bosses';
import { useProStore } from './proStore';

export interface PlayerStats {
  totalDismissals: number;
  totalSnoozes: number;
  totalMathSolved: number;
  totalTriviaCorrect: number;
  totalShakesCompleted: number;
  totalMemoryCompleted: number;
  totalTypingCompleted: number;
  totalStepsCompleted: number;
  bossesDefeated: number;
  totalCoinsEarned: number;
  earliestWake: string;
  avgWakeTime: string;
  wakeTimes: number[];
  // Adaptive difficulty tracking
  recentSuccessRate: number[]; // last 20 challenge results (1=pass, 0=fail)
  wakeProofPasses: number;
  wakeProofFails: number;
  // Morning routine
  routinesCompleted: number;
}

// Character Stats — the "identity" system from the brief
export interface CharacterStats {
  discipline: number;  // 0-100, builds from no-snooze + wake proof + routine completion
  energy: number;      // 0-100, builds from streak + early wake + steps challenges
  consistency: number; // 0-100, builds from regular wake times + streak maintenance
}

// Wake Score — composite metric
export interface WakeScore {
  today: number;    // 0-100 score for today
  weekAvg: number;  // rolling 7-day average
  allTime: number;  // all-time average
}

export interface BossState {
  weekNumber: number;
  bossId: string;
  currentHp: number;
  maxHp: number;
  playerDamageDealt: number;
  snoozeDamageTaken: number;
  defeated: boolean;
}

interface PlayerState {
  // Core RPG
  xp: number;
  coins: number;
  level: number;
  title: string;

  // Streaks
  currentStreak: number;
  longestStreak: number;
  lastWakeDate: string;
  // Grace Token — 1x/month streak save
  graceTokenAvailable: boolean;
  graceTokenLastUsed: string; // YYYY-MM
  graceTokenUsedCount: number;

  // Character Stats
  charStats: CharacterStats;

  // Wake Score
  wakeScores: number[]; // last 30 daily wake scores

  // Stats
  stats: PlayerStats;

  // Boss
  boss: BossState;

  // Achievements
  unlockedAchievements: string[];
  newAchievements: string[];

  // Sleep log
  sleepLog: { date: string; wakeTime: number; snoozed: number; dismissed: boolean; wakeScore: number; routinesDone: number }[];

  // Morning routine tracking for today
  todayRoutineComplete: string[]; // routine task ids completed today
  todayRoutineDate: string;

  // Adaptive difficulty recommendation
  recommendedDifficulty: string;

  // Actions
  dismissAlarm: (challengeType: string, snoozesUsed: number) => {
    xpEarned: number;
    coinsEarned: number;
    streakCount: number;
    newAchievements: Achievement[];
    bossDefeated: boolean;
    leveledUp: boolean;
    wakeScore: number;
  };
  snoozeAlarm: () => void;
  practiceChallenge: (type: string, success: boolean) => void;
  useGraceToken: () => boolean;
  completeRoutineTask: (taskId: string) => void;
  recordWakeProofResult: (passed: boolean) => void;
  clearNewAchievements: () => void;
  resetBossIfNewWeek: () => void;
  getWakeScore: () => WakeScore;
  getAdaptiveDifficulty: () => string;
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getThisMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
}

function getLevel(xp: number): number {
  for (let i = LEVEL_XP.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_XP[i]) return i;
  }
  return 0;
}

function calcBaseDamage(challengeType: string, boss: Boss): number {
  const base = 50;
  return challengeType === boss.weakTo ? base * 2 : base;
}

// Calculate Wake Score (0-100)
function calcWakeScore(
  snoozesUsed: number,
  snoozeLimit: number,
  challengesPassed: boolean,
  wakeProofPassed: boolean | null,
  routineCompletion: number, // 0-1
  streakDays: number,
): number {
  let score = 0;
  // Punctuality (40 pts) — no snooze = full, each snooze costs proportionally
  const snoozePenalty = snoozeLimit > 0 ? (snoozesUsed / Math.max(snoozeLimit, 1)) : 0;
  score += 40 * (1 - snoozePenalty);
  // Challenge completion (25 pts)
  score += challengesPassed ? 25 : 0;
  // Wake Proof (20 pts)
  if (wakeProofPassed === true) score += 20;
  else if (wakeProofPassed === null) score += 10; // no wake proof configured
  // Morning routine (10 pts)
  score += 10 * routineCompletion;
  // Streak bonus (5 pts for 7+ days)
  score += Math.min(5, streakDays * 0.7);
  return Math.round(Math.min(100, score));
}

// Calculate character stats from history
function calcCharStats(sleepLog: any[], stats: PlayerStats, currentStreak: number): CharacterStats {
  const last14 = sleepLog.slice(-14);

  // Discipline: no-snooze rate + wake proof + routine
  const noSnoozeRate = last14.length > 0
    ? last14.filter((d: any) => d.snoozed === 0).length / last14.length
    : 0;
  const wakeProofRate = (stats.wakeProofPasses + stats.wakeProofFails) > 0
    ? stats.wakeProofPasses / (stats.wakeProofPasses + stats.wakeProofFails)
    : 0;
  const routineRate = last14.length > 0
    ? last14.reduce((acc: number, d: any) => acc + (d.routinesDone > 0 ? 1 : 0), 0) / last14.length
    : 0;
  const discipline = Math.round((noSnoozeRate * 40 + wakeProofRate * 30 + routineRate * 30));

  // Energy: streak + early wake + physical challenges
  const streakFactor = Math.min(30, currentStreak * 3);
  const physicalFactor = Math.min(30, (stats.totalShakesCompleted + stats.totalStepsCompleted) * 0.5);
  const earlyFactor = last14.length > 0
    ? Math.min(40, last14.filter((d: any) => d.wakeTime < 420).length / last14.length * 40) // before 7am
    : 0;
  const energy = Math.round(streakFactor + physicalFactor + earlyFactor);

  // Consistency: wake time variance + streak
  const wakeTimes = last14.map((d: any) => d.wakeTime).filter((t: number) => t > 0);
  let consistency = 0;
  if (wakeTimes.length >= 3) {
    const avg = wakeTimes.reduce((a: number, b: number) => a + b, 0) / wakeTimes.length;
    const variance = wakeTimes.reduce((a: number, t: number) => a + Math.pow(t - avg, 2), 0) / wakeTimes.length;
    const stdDev = Math.sqrt(variance);
    // Lower stdDev = more consistent. 0 min stdDev = 100, 60+ min stdDev = 0
    consistency = Math.round(Math.max(0, 100 - stdDev * 1.67));
  }
  consistency = Math.round(consistency * 0.7 + Math.min(30, currentStreak * 2));

  return {
    discipline: Math.min(100, discipline),
    energy: Math.min(100, energy),
    consistency: Math.min(100, consistency),
  };
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      xp: 0,
      coins: 0,
      level: 0,
      title: LEVEL_TITLES[0],

      currentStreak: 0,
      longestStreak: 0,
      lastWakeDate: '',
      graceTokenAvailable: true,
      graceTokenLastUsed: '',
      graceTokenUsedCount: 0,

      charStats: { discipline: 0, energy: 0, consistency: 0 },
      wakeScores: [],

      stats: {
        totalDismissals: 0,
        totalSnoozes: 0,
        totalMathSolved: 0,
        totalTriviaCorrect: 0,
        totalShakesCompleted: 0,
        totalMemoryCompleted: 0,
        totalTypingCompleted: 0,
        totalStepsCompleted: 0,
        bossesDefeated: 0,
        totalCoinsEarned: 0,
        earliestWake: '23:59',
        avgWakeTime: '--:--',
        wakeTimes: [],
        recentSuccessRate: [],
        wakeProofPasses: 0,
        wakeProofFails: 0,
        routinesCompleted: 0,
      },

      boss: {
        weekNumber: getWeekNumber(),
        bossId: getBossForWeek(getWeekNumber()).id,
        currentHp: getBossForWeek(getWeekNumber()).maxHp,
        maxHp: getBossForWeek(getWeekNumber()).maxHp,
        playerDamageDealt: 0,
        snoozeDamageTaken: 0,
        defeated: false,
      },

      unlockedAchievements: [],
      newAchievements: [],
      sleepLog: [],
      todayRoutineComplete: [],
      todayRoutineDate: '',
      recommendedDifficulty: 'medium',

      dismissAlarm: (challengeType, snoozesUsed) => {
        const state = get();
        const today = getToday();
        const now = new Date();
        const wakeMinutes = now.getHours() * 60 + now.getMinutes();

        // Streak calculation with grace token logic
        let newStreak = state.currentStreak;
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (state.lastWakeDate === today) {
          // Already woke today
        } else if (state.lastWakeDate === yesterdayStr || state.lastWakeDate === '') {
          newStreak += 1;
        } else {
          newStreak = 1; // Streak broken
        }

        const longestStreak = Math.max(state.longestStreak, newStreak);

        // XP & Coins
        const streakMultiplier = newStreak >= 7 ? 2.0 : newStreak >= 3 ? 1.5 : 1.0;
        const snoozePenalty = Math.max(0.5, 1 - snoozesUsed * 0.2);
        const proMultiplier = useProStore.getState().getCoinMultiplier();
        const baseXP = 25;
        const baseCoin = 10;
        const xpEarned = Math.round(baseXP * streakMultiplier * snoozePenalty);
        const coinsEarned = Math.round(baseCoin * streakMultiplier * snoozePenalty * proMultiplier);

        const newXP = state.xp + xpEarned;
        const newCoins = state.coins + coinsEarned;
        const newLevel = getLevel(newXP);
        const leveledUp = newLevel > state.level;

        // Boss damage
        const weekBoss = getBossForWeek(getWeekNumber());
        const damage = calcBaseDamage(challengeType, weekBoss);
        let bossCopy = { ...state.boss };
        let bossDefeated = false;

        if (bossCopy.weekNumber === getWeekNumber() && !bossCopy.defeated) {
          bossCopy.currentHp = Math.max(0, bossCopy.currentHp - damage);
          bossCopy.playerDamageDealt += damage;
          if (bossCopy.currentHp <= 0) {
            bossCopy.defeated = true;
            bossDefeated = true;
          }
        }

        // Stats update
        const newStats = { ...state.stats };
        newStats.totalDismissals += 1;
        newStats.totalCoinsEarned += coinsEarned;
        if (challengeType === 'math') newStats.totalMathSolved += 1;
        if (challengeType === 'trivia') newStats.totalTriviaCorrect += 1;
        if (challengeType === 'shake') newStats.totalShakesCompleted += 1;
        if (challengeType === 'memory') newStats.totalMemoryCompleted += 1;
        if (challengeType === 'typing') newStats.totalTypingCompleted += 1;
        if (challengeType === 'steps') newStats.totalStepsCompleted += 1;
        if (bossDefeated) newStats.bossesDefeated += 1;
        // Track success for adaptive difficulty
        newStats.recentSuccessRate = [...newStats.recentSuccessRate.slice(-19), 1];

        // Wake time tracking
        const wakeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        if (wakeStr < newStats.earliestWake) newStats.earliestWake = wakeStr;
        newStats.wakeTimes = [...newStats.wakeTimes.slice(-29), wakeMinutes];
        const avgMin = Math.round(newStats.wakeTimes.reduce((a, b) => a + b, 0) / newStats.wakeTimes.length);
        newStats.avgWakeTime = `${Math.floor(avgMin / 60).toString().padStart(2, '0')}:${(avgMin % 60).toString().padStart(2, '0')}`;

        // Wake Score
        const wakeScore = calcWakeScore(snoozesUsed, 3, true, null, 0, newStreak);
        const newWakeScores = [...state.wakeScores.slice(-29), wakeScore];

        // Sleep log
        const newLog = [...state.sleepLog.slice(-59), {
          date: today, wakeTime: wakeMinutes, snoozed: snoozesUsed,
          dismissed: true, wakeScore, routinesDone: 0,
        }];

        // Character Stats
        const charStats = calcCharStats(newLog, newStats, newStreak);

        // Adaptive difficulty
        const successRate = newStats.recentSuccessRate.length >= 5
          ? newStats.recentSuccessRate.reduce((a, b) => a + b, 0) / newStats.recentSuccessRate.length
          : 0.5;
        const recommendedDifficulty = successRate > 0.85 ? 'hard'
          : successRate > 0.7 ? 'medium'
          : successRate < 0.4 ? 'easy'
          : state.recommendedDifficulty;

        // Grace token refresh (monthly)
        let graceAvail = state.graceTokenAvailable;
        const thisMonth = getThisMonth();
        if (state.graceTokenLastUsed !== thisMonth) {
          graceAvail = true;
        }

        // Achievements
        const newlyUnlocked: Achievement[] = [];
        const allUnlocked = [...state.unlockedAchievements];

        for (const ach of ACHIEVEMENTS) {
          if (allUnlocked.includes(ach.id)) continue;
          let met = false;
          switch (ach.type) {
            case 'streak': met = newStreak >= ach.requirement; break;
            case 'dismiss': met = newStats.totalDismissals >= ach.requirement; break;
            case 'boss': met = newStats.bossesDefeated >= ach.requirement; break;
            case 'level': met = newLevel >= ach.requirement; break;
            case 'coins': met = newStats.totalCoinsEarned >= ach.requirement; break;
            case 'challenge':
              const total = newStats.totalMathSolved + newStats.totalTriviaCorrect +
                newStats.totalShakesCompleted + newStats.totalMemoryCompleted +
                newStats.totalTypingCompleted + newStats.totalStepsCompleted;
              met = total >= ach.requirement;
              break;
          }
          if (met) {
            newlyUnlocked.push(ach);
            allUnlocked.push(ach.id);
          }
        }

        let bonusXP = 0;
        let bonusCoins = 0;
        for (const ach of newlyUnlocked) {
          bonusXP += ach.reward.xp;
          bonusCoins += ach.reward.coins;
        }
        if (bossDefeated) {
          bonusCoins += weekBoss.loot.coins;
          bonusXP += weekBoss.loot.xp;
        }

        const finalXP = newXP + bonusXP;
        const finalCoins = newCoins + bonusCoins;
        const finalLevel = getLevel(finalXP);

        set({
          xp: finalXP,
          coins: finalCoins,
          level: finalLevel,
          title: LEVEL_TITLES[Math.min(finalLevel, LEVEL_TITLES.length - 1)],
          currentStreak: newStreak,
          longestStreak,
          lastWakeDate: today,
          graceTokenAvailable: graceAvail,
          charStats,
          wakeScores: newWakeScores,
          stats: newStats,
          boss: bossCopy,
          unlockedAchievements: allUnlocked,
          newAchievements: [...state.newAchievements, ...newlyUnlocked.map((a) => a.id)],
          sleepLog: newLog,
          recommendedDifficulty,
        });

        return {
          xpEarned: xpEarned + bonusXP,
          coinsEarned: coinsEarned + bonusCoins,
          streakCount: newStreak,
          newAchievements: newlyUnlocked,
          bossDefeated,
          leveledUp: finalLevel > state.level,
          wakeScore,
        };
      },

      snoozeAlarm: () => {
        const state = get();
        const weekBoss = getBossForWeek(getWeekNumber());
        const newStats = { ...state.stats, totalSnoozes: state.stats.totalSnoozes + 1 };
        // Track failure for adaptive difficulty
        newStats.recentSuccessRate = [...newStats.recentSuccessRate.slice(-19), 0];

        let bossCopy = { ...state.boss };
        if (bossCopy.weekNumber === getWeekNumber() && !bossCopy.defeated) {
          bossCopy.snoozeDamageTaken += weekBoss.attackPower;
        }

        set({ stats: newStats, boss: bossCopy });
      },

      practiceChallenge: (type, success) => {
        const state = get();
        const proMultiplier = useProStore.getState().getCoinMultiplier();
        const xpGain = success ? 5 : 0;
        const coinGain = success ? Math.round(2 * proMultiplier) : 0;
        const newXP = state.xp + xpGain;
        const newCoins = state.coins + coinGain;
        const newLevel = getLevel(newXP);

        const newStats = { ...state.stats };
        if (success) {
          if (type === 'math') newStats.totalMathSolved += 1;
          if (type === 'trivia') newStats.totalTriviaCorrect += 1;
          if (type === 'shake') newStats.totalShakesCompleted += 1;
          if (type === 'memory') newStats.totalMemoryCompleted += 1;
          if (type === 'typing') newStats.totalTypingCompleted += 1;
          if (type === 'steps') newStats.totalStepsCompleted += 1;
          newStats.totalCoinsEarned += coinGain;
        }
        newStats.recentSuccessRate = [...newStats.recentSuccessRate.slice(-19), success ? 1 : 0];

        set({
          xp: newXP,
          coins: newCoins,
          level: newLevel,
          title: LEVEL_TITLES[Math.min(newLevel, LEVEL_TITLES.length - 1)],
          stats: newStats,
        });
      },

      useGraceToken: () => {
        const state = get();
        if (!state.graceTokenAvailable) return false;
        const thisMonth = getThisMonth();
        // Restore streak to at least 1 (prevents total reset)
        set({
          graceTokenAvailable: false,
          graceTokenLastUsed: thisMonth,
          graceTokenUsedCount: state.graceTokenUsedCount + 1,
          currentStreak: Math.max(state.currentStreak, 1),
        });
        return true;
      },

      completeRoutineTask: (taskId) => {
        const state = get();
        const today = getToday();
        let completed = state.todayRoutineDate === today ? [...state.todayRoutineComplete] : [];
        if (!completed.includes(taskId)) {
          completed.push(taskId);
          // Award small XP/coins for routine completion
          const proMult = useProStore.getState().getCoinMultiplier();
          const routineCoins = Math.round(1 * proMult);
          const newXP = state.xp + 3;
          const newCoins = state.coins + routineCoins;
          const newStats = { ...state.stats, routinesCompleted: state.stats.routinesCompleted + 1, totalCoinsEarned: state.stats.totalCoinsEarned + routineCoins };

          // Update today's sleep log entry with routine count
          const newLog = [...state.sleepLog];
          const todayEntry = newLog.find((e) => e.date === today);
          if (todayEntry) todayEntry.routinesDone = completed.length;

          set({
            todayRoutineComplete: completed,
            todayRoutineDate: today,
            xp: newXP,
            coins: newCoins,
            stats: newStats,
            sleepLog: newLog,
          });
        }
      },

      recordWakeProofResult: (passed) => {
        const state = get();
        const newStats = { ...state.stats };
        if (passed) {
          newStats.wakeProofPasses += 1;
        } else {
          newStats.wakeProofFails += 1;
        }
        set({ stats: newStats });
      },

      clearNewAchievements: () => set({ newAchievements: [] }),

      resetBossIfNewWeek: () => {
        const state = get();
        const currentWeek = getWeekNumber();
        if (state.boss.weekNumber !== currentWeek) {
          const newBoss = getBossForWeek(currentWeek);
          set({
            boss: {
              weekNumber: currentWeek,
              bossId: newBoss.id,
              currentHp: newBoss.maxHp,
              maxHp: newBoss.maxHp,
              playerDamageDealt: 0,
              snoozeDamageTaken: 0,
              defeated: false,
            },
          });
        }
      },

      getWakeScore: () => {
        const state = get();
        const scores = state.wakeScores;
        const today = scores.length > 0 ? scores[scores.length - 1] : 0;
        const last7 = scores.slice(-7);
        const weekAvg = last7.length > 0 ? Math.round(last7.reduce((a, b) => a + b, 0) / last7.length) : 0;
        const allTime = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        return { today, weekAvg, allTime };
      },

      getAdaptiveDifficulty: () => {
        const state = get();
        return state.recommendedDifficulty;
      },
    }),
    {
      name: 'rise-player',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helpers
export function getXPForNextLevel(level: number): number {
  if (level >= LEVEL_XP.length - 1) return LEVEL_XP[LEVEL_XP.length - 1];
  return LEVEL_XP[level + 1];
}

export function getXPProgress(xp: number, level: number): number {
  const currentLevelXP = LEVEL_XP[level] || 0;
  const nextLevelXP = LEVEL_XP[Math.min(level + 1, LEVEL_XP.length - 1)];
  if (nextLevelXP === currentLevelXP) return 1;
  return (xp - currentLevelXP) / (nextLevelXP - currentLevelXP);
}
