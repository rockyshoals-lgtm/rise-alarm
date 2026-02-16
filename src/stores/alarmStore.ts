import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ChallengeType = 'math' | 'trivia' | 'shake' | 'memory' | 'typing' | 'steps';
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
  // Wake Proof — post-dismissal re-check
  wakeProofEnabled: boolean;
  wakeProofDelayMin: number; // minutes after dismissal to re-check (default 5)
  // Morning Routine
  morningRoutine: string[]; // list of routine task ids
}

// Wake Proof state
export type WakeProofStatus = 'idle' | 'pending' | 'checking' | 'passed' | 'failed';

interface AlarmState {
  alarms: Alarm[];
  activeAlarmId: string | null;
  // Wake Proof
  wakeProofStatus: WakeProofStatus;
  wakeProofDeadline: number | null; // timestamp when wake proof check fires
  wakeProofAlarmId: string | null;

  addAlarm: (alarm: Omit<Alarm, 'id'>) => string;
  updateAlarm: (id: string, updates: Partial<Alarm>) => void;
  deleteAlarm: (id: string) => void;
  toggleAlarm: (id: string) => void;
  setActiveAlarm: (id: string | null) => void;
  getAlarm: (id: string) => Alarm | undefined;
  // Wake Proof actions
  startWakeProof: (alarmId: string, delayMin: number) => void;
  triggerWakeProofCheck: () => void;
  passWakeProof: () => void;
  failWakeProof: () => void;
  resetWakeProof: () => void;
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const useAlarmStore = create<AlarmState>()(
  persist(
    (set, get) => ({
      alarms: [],
      activeAlarmId: null,
      wakeProofStatus: 'idle' as WakeProofStatus,
      wakeProofDeadline: null,
      wakeProofAlarmId: null,

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

      // Wake Proof
      startWakeProof: (alarmId, delayMin) => {
        const deadline = Date.now() + delayMin * 60 * 1000;
        set({
          wakeProofStatus: 'pending',
          wakeProofDeadline: deadline,
          wakeProofAlarmId: alarmId,
        });
      },

      triggerWakeProofCheck: () => {
        set({ wakeProofStatus: 'checking' });
      },

      passWakeProof: () => {
        set({
          wakeProofStatus: 'passed',
          wakeProofDeadline: null,
          wakeProofAlarmId: null,
        });
      },

      failWakeProof: () => {
        // Re-trigger the alarm
        const state = get();
        set({
          wakeProofStatus: 'failed',
          activeAlarmId: state.wakeProofAlarmId, // re-activate alarm!
          wakeProofDeadline: null,
          wakeProofAlarmId: null,
        });
      },

      resetWakeProof: () => {
        set({
          wakeProofStatus: 'idle',
          wakeProofDeadline: null,
          wakeProofAlarmId: null,
        });
      },
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
    days: [false, true, true, true, true, true, false],
    challenges: ['math', 'trivia'],
    challengeCount: 2,
    difficulty: 'medium',
    snoozeLimit: 2,
    vibrate: true,
    sound: 'viking_horn',
    wakeProofEnabled: true,
    wakeProofDelayMin: 5,
    morningRoutine: ['water', 'stretch'],
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

// Morning Routine definitions
export interface RoutineTask {
  id: string;
  label: string;
  emoji: string;
  durationMin: number;
}

export const ROUTINE_TASKS: RoutineTask[] = [
  { id: 'water', label: 'Drink water', emoji: '💧', durationMin: 1 },
  { id: 'stretch', label: '5-min stretch', emoji: '🧘', durationMin: 5 },
  { id: 'journal', label: 'Journal 1 line', emoji: '📝', durationMin: 2 },
  { id: 'meditate', label: 'Meditate 3 min', emoji: '🧠', durationMin: 3 },
  { id: 'cold_water', label: 'Splash cold water', emoji: '🥶', durationMin: 1 },
  { id: 'no_phone', label: 'No phone 10 min', emoji: '📵', durationMin: 10 },
  { id: 'sunlight', label: 'Get sunlight', emoji: '☀️', durationMin: 5 },
  { id: 'make_bed', label: 'Make your bed', emoji: '🛏️', durationMin: 2 },
];
