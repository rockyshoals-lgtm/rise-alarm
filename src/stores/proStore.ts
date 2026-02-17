/**
 * Pro Tier Store — manages Rise Pro subscription state.
 * Controls: ad visibility, coin multiplier, grace token rate, exclusive content.
 * Swap activatePro() to real IAP receipt validation later.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProState {
  isPro: boolean;
  proStartDate: string | null;
  proExpiryDate: string | null; // null = lifetime
  purchaseSource: 'none' | 'subscription' | 'lifetime';

  // Actions
  activatePro: (source: 'subscription' | 'lifetime', expiryDate?: string) => void;
  deactivatePro: () => void;
  isProActive: () => boolean;
  getCoinMultiplier: () => number;
  getGraceTokensPerMonth: () => number;
}

export const useProStore = create<ProState>()(
  persist(
    (set, get) => ({
      isPro: false,
      proStartDate: null,
      proExpiryDate: null,
      purchaseSource: 'none',

      activatePro: (source, expiryDate?) => {
        set({
          isPro: true,
          proStartDate: new Date().toISOString().split('T')[0],
          proExpiryDate: expiryDate || null,
          purchaseSource: source,
        });
      },

      deactivatePro: () => {
        set({
          isPro: false,
          proStartDate: null,
          proExpiryDate: null,
          purchaseSource: 'none',
        });
      },

      isProActive: () => {
        const state = get();
        if (!state.isPro) return false;
        if (!state.proExpiryDate) return true; // lifetime
        return new Date(state.proExpiryDate) >= new Date();
      },

      getCoinMultiplier: () => {
        return get().isProActive() ? 2.0 : 1.0;
      },

      getGraceTokensPerMonth: () => {
        return get().isProActive() ? 2 : 1;
      },
    }),
    {
      name: 'rise-pro',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isPro: state.isPro,
        proStartDate: state.proStartDate,
        proExpiryDate: state.proExpiryDate,
        purchaseSource: state.purchaseSource,
      }),
    }
  )
);
