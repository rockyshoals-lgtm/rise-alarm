import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../theme';

const REVIEW_KEY = '@rise_review_prompted_session';
const REVIEW_DISMISSED_KEY = '@rise_review_dismissed';
const MIN_WINS_TO_PROMPT = 3;

// App Store / Play Store URLs (update with real IDs when published)
const STORE_URL = Platform.select({
  ios: 'https://apps.apple.com/app/rise-rpg-alarm-clock/id0000000000',
  android: 'https://play.google.com/store/apps/details?id=com.rise.rpgalarm',
  default: 'https://rise-alarm.app',
});

interface ReviewPromptProps {
  totalWins: number;      // total dismissals + bosses defeated
  triggerEvent: 'streak' | 'boss_defeat' | 'level_up' | null;
}

export default function ReviewPrompt({ totalWins, triggerEvent }: ReviewPromptProps) {
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!triggerEvent || totalWins < MIN_WINS_TO_PROMPT) return;
    checkAndShow();
  }, [triggerEvent, totalWins]);

  const checkAndShow = async () => {
    try {
      // Check if already prompted this session
      const sessionKey = await AsyncStorage.getItem(REVIEW_KEY);
      const sessionId = new Date().toISOString().split('T')[0]; // 1x per day
      if (sessionKey === sessionId) return;

      // Check if user permanently dismissed
      const dismissed = await AsyncStorage.getItem(REVIEW_DISMISSED_KEY);
      if (dismissed === 'true') return;

      // Show prompt
      await AsyncStorage.setItem(REVIEW_KEY, sessionId);
      setVisible(true);

      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();

      // Auto-dismiss after 8 seconds
      setTimeout(() => handleDismiss(), 8000);
    } catch { }
  };

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -100, duration: 250, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  };

  const handleRate = async () => {
    await AsyncStorage.setItem(REVIEW_DISMISSED_KEY, 'true');
    Linking.openURL(STORE_URL);
    handleDismiss();
  };

  const handleNeverAsk = async () => {
    await AsyncStorage.setItem(REVIEW_DISMISSED_KEY, 'true');
    handleDismiss();
  };

  if (!visible) return null;

  return (
    <Animated.View style={[s.container, { transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
      <View style={s.banner}>
        <View style={s.textArea}>
          <Text style={s.title}>Loving the quests? Rate RISE!</Text>
          <Text style={s.subtitle}>
            {triggerEvent === 'boss_defeat' ? '💀 Boss slain! Share the glory!' :
             triggerEvent === 'streak' ? '🔥 Streak warrior! Help others find RISE!' :
             '🎉 Level up! Tell the world!'}
          </Text>
        </View>
        <View style={s.actions}>
          <TouchableOpacity style={s.rateBtn} onPress={handleRate}>
            <Text style={s.rateText}>⭐ Rate</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDismiss}>
            <Text style={s.laterText}>Later</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNeverAsk}>
            <Text style={s.neverText}>Don't ask</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute', top: 50, left: 16, right: 16, zIndex: 999,
  },
  banner: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gold + '40',
    flexDirection: 'column',
    gap: 12,
    // Shadow
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  textArea: { gap: 4 },
  title: { color: COLORS.gold, fontSize: 16, fontWeight: '800' },
  subtitle: { color: COLORS.textSecondary, fontSize: 13 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rateBtn: {
    backgroundColor: COLORS.gold, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 10,
  },
  rateText: { color: COLORS.bg, fontSize: 14, fontWeight: '800' },
  laterText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  neverText: { color: COLORS.textMuted, fontSize: 11 },
});
