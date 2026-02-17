import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Dimensions, Animated, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ONBOARDING_KEY = '@rise_onboarding_done';

interface OnboardingSlide {
  emoji: string;
  title: string;
  subtitle: string;
  features: string[];
  bgAccent: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    emoji: '⚔️',
    title: 'Wake Up Like a Viking',
    subtitle: 'RPG challenges to conquer every morning',
    features: ['6 unique challenge types', 'Math, trivia, shake, memory, typing & steps', 'Adaptive difficulty that grows with you'],
    bgAccent: COLORS.gold,
  },
  {
    emoji: '🔥',
    title: 'Build Unbreakable Streaks',
    subtitle: 'Track your wake discipline over time',
    features: ['Wake Score dashboard (0-100)', 'Character stats: Discipline, Energy, Consistency', 'Grace Token — 1 free save per month'],
    bgAccent: COLORS.fire,
  },
  {
    emoji: '💀',
    title: 'Battle Weekly Bosses',
    subtitle: 'Norse mythological enemies stand in your way',
    features: ['6 unique Norse-themed bosses', 'Exploit boss weaknesses for 2× damage', 'Earn XP, coins & rare loot'],
    bgAccent: COLORS.purple,
  },
  {
    emoji: '🛡️',
    title: 'Wake Proof Technology',
    subtitle: 'Makes sure you actually stay awake',
    features: ['Post-dismissal re-check timer', 'Morning routine quests for bonus XP', '20 levels from Thrall to All-Seer'],
    bgAccent: COLORS.frost,
  },
  {
    emoji: '🏆',
    title: 'Rise to Greatness',
    subtitle: 'Join thousands conquering their mornings',
    features: ['Share victories & earn bonus coins', 'Compete on the weekly leaderboard', 'Unlock Pro perks — no ads & 2× coins'],
    bgAccent: COLORS.emerald,
  },
];

interface Props {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: Props) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentSlide(slide);
  };

  const goNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (currentSlide + 1) * SCREEN_WIDTH, animated: true });
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    onComplete();
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={s.slide}>
            {/* Accent glow */}
            <View style={[s.glowCircle, { backgroundColor: slide.bgAccent + '15', borderColor: slide.bgAccent + '20' }]} />

            <Text style={s.emoji}>{slide.emoji}</Text>
            <Text style={[s.title, { color: slide.bgAccent }]}>{slide.title}</Text>
            <Text style={s.subtitle}>{slide.subtitle}</Text>

            <View style={s.featureList}>
              {slide.features.map((f, j) => (
                <View key={j} style={s.featureRow}>
                  <Text style={[s.featureBullet, { color: slide.bgAccent }]}>▸</Text>
                  <Text style={s.featureText}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Dots + CTA */}
      <View style={s.footer}>
        <View style={s.dots}>
          {SLIDES.map((slide, i) => (
            <View
              key={i}
              style={[
                s.dot,
                currentSlide === i && { backgroundColor: slide.bgAccent, width: 24 },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={s.nextBtn} onPress={goNext}>
          <Text style={s.nextText}>
            {currentSlide === SLIDES.length - 1 ? 'START YOUR QUEST →' : 'NEXT →'}
          </Text>
        </TouchableOpacity>

        {currentSlide < SLIDES.length - 1 && (
          <TouchableOpacity onPress={handleFinish}>
            <Text style={s.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// Check if onboarding was completed
export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(ONBOARDING_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  glowCircle: {
    position: 'absolute',
    width: 280, height: 280,
    borderRadius: 140,
    borderWidth: 2,
    top: '15%',
  },
  emoji: { fontSize: 72, marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: 1, textAlign: 'center', marginBottom: 8 },
  subtitle: { color: COLORS.textSecondary, fontSize: 15, textAlign: 'center', marginBottom: 28 },
  featureList: { gap: 12, width: '100%', paddingHorizontal: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  featureBullet: { fontSize: 16, fontWeight: '800', marginTop: 1 },
  featureText: { color: COLORS.text, fontSize: 15, flex: 1, lineHeight: 22 },
  footer: { alignItems: 'center', paddingBottom: 40, gap: 16 },
  dots: { flexDirection: 'row', gap: 8 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.textMuted,
  },
  nextBtn: {
    backgroundColor: COLORS.gold, paddingHorizontal: 36, paddingVertical: 14,
    borderRadius: 14,
  },
  nextText: { color: COLORS.bg, fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  skipText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
});
