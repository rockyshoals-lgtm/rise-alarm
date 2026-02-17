import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import * as Speech from 'expo-speech';
import { COLORS } from '../../theme';
import type { BriefingPersona } from '../../stores/alarmStore';

interface MorningBriefingProps {
  streak: number;
  xpEarned: number;
  coinsEarned: number;
  wakeScore: number;
  leveledUp: boolean;
  bossDefeated: boolean;
  bossName?: string;
  persona: BriefingPersona;
  onComplete: () => void;
}

// Persona configs
const PERSONA_CONFIG: Record<BriefingPersona, {
  emoji: string;
  label: string;
  rate: number;
  pitch: number;
}> = {
  drill_sergeant: { emoji: '🎖️', label: 'Drill Sergeant', rate: 1.1, pitch: 0.8 },
  wise_elder: { emoji: '🧙', label: 'Wise Elder', rate: 0.9, pitch: 1.0 },
  cheerful_coach: { emoji: '🏋️', label: 'Cheerful Coach', rate: 1.0, pitch: 1.1 },
};

function generateMessage(props: MorningBriefingProps): string {
  const { streak, xpEarned, coinsEarned, wakeScore, leveledUp, bossDefeated, bossName, persona } = props;

  const levelUpLine = leveledUp ? ' Level up achieved!' : '';
  const bossLine = bossDefeated && bossName ? ` ${bossName} has been defeated!` : bossDefeated ? ' Boss defeated!' : '';

  switch (persona) {
    case 'drill_sergeant':
      return `Soldier! Your streak stands at ${streak} days. ${xpEarned} XP earned. ${coinsEarned} coins secured. Wake score: ${wakeScore} out of 100.${levelUpLine}${bossLine} Now move out, warrior!`;

    case 'wise_elder':
      return `Another dawn conquered, warrior. Your streak endures at ${streak} days. The runes grant you ${xpEarned} experience and ${coinsEarned} coins. Your wake score reads ${wakeScore}.${levelUpLine ? ' A new level has been attained.' : ''}${bossLine ? ` ${bossName || 'The boss'} falls before your discipline.` : ''} Walk with wisdom today.`;

    case 'cheerful_coach':
      return `Yes! ${streak}-day streak, let's go! You earned ${xpEarned} XP and ${coinsEarned} coins! Wake score: ${wakeScore}!${levelUpLine ? ' And you leveled up!' : ''}${bossLine ? ` ${bossName || 'Boss'} is down!` : ''} Today is going to be amazing!`;

    default:
      return `Good morning! ${streak}-day streak. ${xpEarned} XP earned. Wake score: ${wakeScore}.`;
  }
}

export default function MorningBriefing(props: MorningBriefingProps) {
  const { persona, onComplete } = props;
  const config = PERSONA_CONFIG[persona];
  const message = generateMessage(props);

  const [speaking, setSpeaking] = useState(false);
  const [progress, setProgress] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 12 }),
    ]).start();
  }, []);

  // Start speaking on mount
  useEffect(() => {
    startSpeaking();

    // Safety timeout — max 30 seconds
    timeoutRef.current = setTimeout(() => {
      handleSkip();
    }, 30000);

    return () => {
      Speech.stop();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Simulate progress based on word count
  useEffect(() => {
    if (!speaking) return;
    const words = message.split(' ').length;
    const estimatedDuration = (words / 2.5) * 1000; // ~2.5 words/sec
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 1) {
          clearInterval(interval);
          return 1;
        }
        return Math.min(1, p + (100 / estimatedDuration));
      });
    }, 100);
    return () => clearInterval(interval);
  }, [speaking]);

  const startSpeaking = async () => {
    setSpeaking(true);
    Speech.speak(message, {
      rate: config.rate,
      pitch: config.pitch,
      language: 'en-US',
      onDone: () => {
        setSpeaking(false);
        setProgress(1);
        // Short pause then complete
        setTimeout(() => onComplete(), 1500);
      },
      onError: () => {
        setSpeaking(false);
        onComplete();
      },
    });
  };

  const handleSkip = () => {
    Speech.stop();
    setSpeaking(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    onComplete();
  };

  return (
    <Animated.View style={[s.container, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      {/* Persona Header */}
      <Text style={s.personaEmoji}>{config.emoji}</Text>
      <Text style={s.personaLabel}>{config.label}</Text>
      <Text style={s.title}>MORNING BRIEFING</Text>

      {/* Message Card */}
      <View style={s.messageCard}>
        <Text style={s.messageText}>{message}</Text>

        {/* Progress bar */}
        <View style={s.progressBg}>
          <View style={[s.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>

        <Text style={s.speakingIndicator}>
          {speaking ? '🔊 Speaking...' : '✓ Complete'}
        </Text>
      </View>

      {/* Skip Button */}
      <TouchableOpacity style={s.skipBtn} onPress={handleSkip}>
        <Text style={s.skipText}>SKIP →</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24,
    backgroundColor: COLORS.bg,
  },
  personaEmoji: { fontSize: 56, marginBottom: 8 },
  personaLabel: { color: COLORS.emerald, fontSize: 14, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  title: { color: COLORS.text, fontSize: 20, fontWeight: '800', letterSpacing: 3, marginBottom: 24 },
  messageCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 20, width: '100%',
    borderWidth: 1, borderColor: COLORS.emerald + '30',
  },
  messageText: { color: COLORS.text, fontSize: 16, lineHeight: 26, fontWeight: '500' },
  progressBg: {
    height: 3, backgroundColor: COLORS.bgCardLight, borderRadius: 2, marginTop: 16, overflow: 'hidden',
  },
  progressFill: { height: 3, backgroundColor: COLORS.emerald, borderRadius: 2 },
  speakingIndicator: { color: COLORS.textMuted, fontSize: 12, marginTop: 8, textAlign: 'center' },
  skipBtn: {
    marginTop: 24, paddingHorizontal: 24, paddingVertical: 12,
    borderWidth: 1, borderColor: COLORS.textMuted + '40', borderRadius: 10,
  },
  skipText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
});
