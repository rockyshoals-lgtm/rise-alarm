import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LEVEL_XP, LEVEL_TITLES } from '../theme';
import { ACHIEVEMENTS, Achievement } from '../data/achievements';
import { getBossForWeek, getWeekNumber, Boss } from '../data/bosses';

export interface PlayerStats {
  totalDismissals: number;
  totalSnoozes: number;
  totalMathSolved: number;
  totalTriviaCorrect: number;
  totalShakesCompleted: number;
  totalMemoryCompleted: number;
  bossesDefeated: number;
  totalCoinsEarned: number;
  earliestWake: string; // "HH:MM"
  avgWakeTime: string;
  wakeTimes: number[]; // last 30 wake times in minutes from midnight
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
  lastWakeDate: string; // YYYY-MM-DD

  // Stats
  stats: PlayerStats;

  // Boss
  boss: BossState;

  // Achievements
  unlockedAchievements: string[];
  newAchievements: string[]; // unseen achievements

  // Sleep log
  sleepLog: { date: string; wakeTime: number; snoozed: number; dismissed: boolean }[];

  // Actions
  dismissAlarm: (challengeType: string, snoozesUsed: number) => {
    xpEarned: number;
    coinsEarned: number;
    streakCount: number;
    newAchievements: Achievement[];
    bossDefeated: boolean;
    leveledUp: boolean;
  };
  snoozeAlarm: () => void;
  practiceChallenge: (type: string, success: boolean) => void;
  clearNewAchievements: () => void;
  resetBossIfNewWeek: () => void;
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
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

      stats: {
        totalDismissals: 0,
        totalSnoozes: 0,
        totalMathSolved: 0,
        totalTriviaCorrect: 0,
        totalShakesCompleted: 0,
        totalMemoryCompleted: 0,
        bossesDefeated: 0,
        totalCoinsEarned: 0,
        earliestWake: '23:59',
        avgWakeTime: '--:--',
        wakeTimes: [],
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

      dismissAlarm: (challengeType, snoozesUsed) => {
        const state = get();
        const today = getToday();
        const now = new Date();
        const wakeMinutes = now.getHours() * 60 + now.getMinutes();

        // Streak calculation
        let newStreak = state.currentStreak;
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (state.lastWakeDate === today) {
          // Already woke today, keep streak
        } else if (state.lastWakeDate === yesterdayStr || state.lastWakeDate === '') {
          newStreak += 1;
        } else {
          newStreak = 1; // Streak broken
        }

        const longestStreak = Math.max(state.longestStreak, newStreak);

        // XP & Coins calculation
        const streakMultiplier = newStreak >= 7 ? 2.0 : newStreak >= 3 ? 1.5 : 1.0;
        const snoozePenalty = Math.max(0.5, 1 - snoozesUsed * 0.2);
        const baseXP = 25;
        const baseCoin = 10;
        const xpEarned = Math.round(baseXP * streakMultiplier * snoozePenalty);
        const coinsEarned = Math.round(baseCoin * streakMultiplier * snoozePenalty);

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
        if (bossDefeated) newStats.bossesDefeated += 1;

        // Wake time tracking
        const wakeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        if (wakeStr < newStats.earliestWake) newStats.earliestWake = wakeStr;
        newStats.wakeTimes = [...newStats.wakeTimes.slice(-29), wakeMinutes];
        const avgMin = Math.round(newStats.wakeTimes.reduce((a, b) => a + b, 0) / newStats.wakeTimes.length);
        newStats.avgWakeTime = `${Math.floor(avgMin / 60).toString().padStart(2, '0')}:${(avgMin % 60).toString().padStart(2, '0')}`;

        // Sleep log
        const newLog = [...state.sleepLog.slice(-59), { date: today, wakeTime: wakeMinutes, snoozed: snoozesUsed, dismissed: true }];

        // Check achievements
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
              const total = newStats.totalMathSolved + newStats.totalTriviaCorrect + newStats.totalShakesCompleted + newStats.totalMemoryCompleted;
              met = total >= ach.requirement;
              break;
          }
          if (met) {
            newlyUnlocked.push(ach);
            allUnlocked.push(ach.id);
          }
        }

        // Apply achievement rewards
        let bonusXP = 0;
        let bonusCoins = 0;
        for (const ach of newlyUnlocked) {
          bonusXP += ach.reward.xp;
          bonusCoins += ach.reward.coins;
        }

        // Boss defeat loot
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
          stats: newStats,
          boss: bossCopy,
          unlockedAchievements: allUnlocked,
          newAchievements: [...state.newAchievements, ...newlyUnlocked.map((a) => a.id)],
          sleepLog: newLog,
        });

        return {
          xpEarned: xpEarned + bonusXP,
          coinsEarned: coinsEarned + bonusCoins,
          streakCount: newStreak,
          newAchievements: newlyUnlocked,
          bossDefeated,
          leveledUp: finalLevel > state.level,
        };
      },

      snoozeAlarm: () => {
        const state = get();
        const weekBoss = getBossForWeek(getWeekNumber());
        const newStats = { ...state.stats, totalSnoozes: state.stats.totalSnoozes + 1 };

        let bossCopy = { ...state.boss };
        if (bossCopy.weekNumber === getWeekNumber() && !bossCopy.defeated) {
          bossCopy.snoozeDamageTaken += weekBoss.attackPower;
        }

        set({ stats: newStats, boss: bossCopy });
      },

      practiceChallenge: (type, success) => {
        if (!success) return;
        const state = get();
        const xpGain = 5;
        const coinGain = 2;
        const newXP = state.xp + xpGain;
        const newCoins = state.coins + coinGain;
        const newLevel = getLevel(newXP);

        const newStats = { ...state.stats };
        if (type === 'math') newStats.totalMathSolved += 1;
        if (type === 'trivia') newStats.totalTriviaCorrect += 1;
        if (type === 'shake') newStats.totalShakesCompleted += 1;
        if (type === 'memory') newStats.totalMemoryCompleted += 1;
        newStats.totalCoinsEarned += coinGain;

        set({
          xp: newXP,
          coins: newCoins,
          level: newLevel,
          title: LEVEL_TITLES[Math.min(newLevel, LEVEL_TITLES.length - 1)],
          stats: newStats,
        });
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
