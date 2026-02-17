import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VoiceMessage {
  id: string;
  senderName: string;
  recordedAt: string;      // ISO date
  duration: number;        // seconds
  fileUri: string;         // local file path
  transcript?: string;     // optional text note
}

interface SocialState {
  messages: VoiceMessage[];
  defaultMessageId: string | null;

  addMessage: (msg: Omit<VoiceMessage, 'id'>) => string;
  deleteMessage: (id: string) => void;
  setDefaultMessage: (id: string | null) => void;
  getMessage: (id: string) => VoiceMessage | undefined;
}

const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const useSocialStore = create<SocialState>()(
  persist(
    (set, get) => ({
      messages: [],
      defaultMessageId: null,

      addMessage: (msg) => {
        const id = generateId();
        const fullMsg: VoiceMessage = { ...msg, id };
        set((s) => {
          const messages = [...s.messages, fullMsg];
          // Auto-set default if first message
          const defaultMessageId = s.defaultMessageId || id;
          return { messages, defaultMessageId };
        });
        return id;
      },

      deleteMessage: (id) => {
        set((s) => {
          const messages = s.messages.filter((m) => m.id !== id);
          const defaultMessageId = s.defaultMessageId === id
            ? (messages[0]?.id || null)
            : s.defaultMessageId;
          return { messages, defaultMessageId };
        });
      },

      setDefaultMessage: (id) => {
        set({ defaultMessageId: id });
      },

      getMessage: (id) => {
        return get().messages.find((m) => m.id === id);
      },
    }),
    {
      name: 'rise-social',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
