import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ChallengeType = 'math' | 'trivia' | 'shake' | 'memory';
export type Difficulty = 'easy' | 'medium' | 'hard' | 'viking';

export interface Alarm {
  id: string;
  hour: number;
  minute: number;
  label: string;
  enabled: boolean;
  days: boolean[]; // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
  challenges: ChallengeType[];
  challengeCount: number; // how many challenges to solve
  difficulty: Difficulty;
  snoozeLimit: number; // max snoozes allowed (0 = none)
  vibrate: boolean;
  sound: string;
}

interface AlarmState {
  alarms: Alarm[];
  activeAlarmId: string | null; // currently ringing alarm
  addAlarm: (alarm: Omit<Alarm, 'id'>) => string;
  updateAlarm: (id: string, updates: Partial<Alarm>) => void;
  deleteAlarm: (id: string) => void;
  toggleAlarm: (id: string) => void;
  setActiveAlarm: (id: string | null) => void;
  getAlarm: (id: string) => Alarm | undefined;
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const useAlarmStore = create<AlarmState>()(
  persist(
    (set, get) => ({
      alarms: [],
      activeAlarmId: null,

      addAlarm: (alarm) => {
        const id = generateId();
        set((s) => ({ alarms: [...s.alarms, { ...alarm, id }] }));
        return id;
      },

      updateAlarm: (id, updates) => {
        set((s) => ({
          alarms: s.alarms.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        }));
      },

      deleteAlarm: (id) => {
        set((s) => ({ alarms: s.alarms.filter((a) => a.id !== id) }));
      },

      toggleAlarm: (id) => {
        set((s) => ({
          alarms: s.alarms.map((a) =>
            a.id === id ? { ...a, enabled: !a.enabled } : a
          ),
        }));
      },

      setActiveAlarm: (id) => set({ activeAlarmId: id }),

      getAlarm: (id) => get().alarms.find((a) => a.id === id),
    }),
    {
      name: 'rise-alarms',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper: create a default alarm
export function createDefaultAlarm(hour: number = 7, minute: number = 0): Omit<Alarm, 'id'> {
  return {
    hour,
    minute,
    label: '',
    enabled: true,
    days: [false, true, true, true, true, true, false], // Mon-Fri
    challenges: ['math', 'trivia'],
    challengeCount: 2,
    difficulty: 'medium',
    snoozeLimit: 2,
    vibrate: true,
    sound: 'viking_horn',
  };
}

// Helper: format time
export function formatTime(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h}:${minute.toString().padStart(2, '0')} ${ampm}`;
}

export const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
