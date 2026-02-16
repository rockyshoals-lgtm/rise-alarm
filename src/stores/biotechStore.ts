import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BiotechState {
  // Biotech Mode toggle
  biotechModeEnabled: boolean;
  toggleBiotechMode: () => void;

  // Referral tracking
  referralCode: string;
  referralShareCount: number;
  odinBetaUnlocked: boolean;

  // Biotech trivia stats
  biotechTriviaCorrect: number;
  biotechHintsUnlocked: number;
  pdufaFactsSeen: number;

  // Actions
  recordBiotechTrivia: (correct: boolean) => void;
  recordPdufaFact: () => void;
  recordReferralShare: () => void;
  generateReferralCode: () => string;
}

function makeReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'RISE-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const useBiotechStore = create<BiotechState>()(
  persist(
    (set, get) => ({
      biotechModeEnabled: false,
      referralCode: '',
      referralShareCount: 0,
      odinBetaUnlocked: false,
      biotechTriviaCorrect: 0,
      biotechHintsUnlocked: 0,
      pdufaFactsSeen: 0,

      toggleBiotechMode: () => {
        const state = get();
        set({ biotechModeEnabled: !state.biotechModeEnabled });
      },

      recordBiotechTrivia: (correct) => {
        if (!correct) return;
        const state = get();
        const newCorrect = state.biotechTriviaCorrect + 1;
        // Every 5 correct biotech answers unlocks a PDUFA hint
        const newHints = Math.floor(newCorrect / 5);
        set({
          biotechTriviaCorrect: newCorrect,
          biotechHintsUnlocked: newHints,
        });
      },

      recordPdufaFact: () => {
        set({ pdufaFactsSeen: get().pdufaFactsSeen + 1 });
      },

      recordReferralShare: () => {
        const state = get();
        const newCount = state.referralShareCount + 1;
        // 3 referral shares = ODIN beta access
        set({
          referralShareCount: newCount,
          odinBetaUnlocked: newCount >= 3,
        });
      },

      generateReferralCode: () => {
        const state = get();
        if (state.referralCode) return state.referralCode;
        const code = makeReferralCode();
        set({ referralCode: code });
        return code;
      },
    }),
    {
      name: 'rise-biotech',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
