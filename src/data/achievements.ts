export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  requirement: number; // threshold to unlock
  type: 'streak' | 'dismiss' | 'boss' | 'level' | 'coins' | 'challenge';
  reward: { coins: number; xp: number };
}

export const ACHIEVEMENTS: Achievement[] = [
  // Streak achievements
  { id: 'streak_3', name: 'First Light', description: '3-day wake-up streak', emoji: '🌅', requirement: 3, type: 'streak', reward: { coins: 50, xp: 100 } },
  { id: 'streak_7', name: 'Week Warrior', description: '7-day wake-up streak', emoji: '⚔️', requirement: 7, type: 'streak', reward: { coins: 150, xp: 300 } },
  { id: 'streak_14', name: 'Fortnight\'s Fury', description: '14-day wake-up streak', emoji: '🔥', requirement: 14, type: 'streak', reward: { coins: 300, xp: 500 } },
  { id: 'streak_30', name: 'Moon Cycle Master', description: '30-day wake-up streak', emoji: '🌙', requirement: 30, type: 'streak', reward: { coins: 500, xp: 1000 } },
  { id: 'streak_100', name: 'Eternal Vigil', description: '100-day wake-up streak', emoji: '👁️', requirement: 100, type: 'streak', reward: { coins: 2000, xp: 5000 } },
  // Dismiss achievements
  { id: 'dismiss_10', name: 'Rising Tide', description: 'Dismiss 10 alarms', emoji: '🌊', requirement: 10, type: 'dismiss', reward: { coins: 30, xp: 50 } },
  { id: 'dismiss_50', name: 'Dawn Breaker', description: 'Dismiss 50 alarms', emoji: '🌄', requirement: 50, type: 'dismiss', reward: { coins: 100, xp: 200 } },
  { id: 'dismiss_100', name: 'Sentinel', description: 'Dismiss 100 alarms', emoji: '🛡️', requirement: 100, type: 'dismiss', reward: { coins: 250, xp: 500 } },
  { id: 'dismiss_500', name: 'Immortal Rise', description: 'Dismiss 500 alarms', emoji: '⚡', requirement: 500, type: 'dismiss', reward: { coins: 1000, xp: 2000 } },
  // Boss achievements
  { id: 'boss_1', name: 'Giant Slayer', description: 'Defeat your first boss', emoji: '💀', requirement: 1, type: 'boss', reward: { coins: 100, xp: 200 } },
  { id: 'boss_5', name: 'Monster Hunter', description: 'Defeat 5 bosses', emoji: '🗡️', requirement: 5, type: 'boss', reward: { coins: 300, xp: 600 } },
  { id: 'boss_10', name: 'Ragnarök Survivor', description: 'Defeat 10 bosses', emoji: '🐉', requirement: 10, type: 'boss', reward: { coins: 500, xp: 1000 } },
  // Level achievements
  { id: 'level_5', name: 'Huskarl', description: 'Reach level 5', emoji: '🪖', requirement: 5, type: 'level', reward: { coins: 100, xp: 0 } },
  { id: 'level_10', name: 'Rune Master', description: 'Reach level 10', emoji: '🔮', requirement: 10, type: 'level', reward: { coins: 300, xp: 0 } },
  { id: 'level_15', name: 'Asgardian', description: 'Reach level 15', emoji: '✨', requirement: 15, type: 'level', reward: { coins: 500, xp: 0 } },
  // Coin achievements
  { id: 'coins_500', name: 'Hoarder', description: 'Earn 500 total coins', emoji: '💰', requirement: 500, type: 'coins', reward: { coins: 50, xp: 100 } },
  { id: 'coins_5000', name: 'Dragon\'s Treasure', description: 'Earn 5,000 total coins', emoji: '💎', requirement: 5000, type: 'coins', reward: { coins: 200, xp: 500 } },
  // Challenge achievements
  { id: 'math_50', name: 'Rune Calculator', description: 'Solve 50 math problems', emoji: '🧮', requirement: 50, type: 'challenge', reward: { coins: 100, xp: 200 } },
  { id: 'trivia_50', name: 'Sage of Midgard', description: 'Answer 50 trivia correctly', emoji: '📚', requirement: 50, type: 'challenge', reward: { coins: 100, xp: 200 } },
];
