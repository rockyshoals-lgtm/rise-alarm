import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme';
import { usePlayerStore } from '../../stores/playerStore';
import { getBossForWeek, getWeekNumber } from '../../data/bosses';
import BossWidget from '../../components/Common/BossWidget';
import MathChallenge from '../../components/challenges/MathChallenge';
import TriviaChallenge from '../../components/challenges/TriviaChallenge';
import ShakeChallenge from '../../components/challenges/ShakeChallenge';
import MemoryMatch from '../../components/challenges/MemoryMatch';
import TypingChallenge from '../../components/challenges/TypingChallenge';
import StepsChallenge from '../../components/challenges/StepsChallenge';
import type { ChallengeType } from '../../stores/alarmStore';
import AdBanner from '../../components/Common/AdBanner';

type Mode = 'menu' | 'practice';

const PRACTICE_OPTIONS: { type: ChallengeType; label: string; emoji: string; desc: string }[] = [
  { type: 'math', label: 'Rune Math', emoji: '⚡', desc: 'Solve arithmetic under pressure' },
  { type: 'trivia', label: 'Wisdom Test', emoji: '📚', desc: 'Answer trivia questions' },
  { type: 'shake', label: 'Shake Fury', emoji: '📳', desc: 'Shake your phone to fill the meter' },
  { type: 'memory', label: 'Memory Runes', emoji: '🧠', desc: 'Match pairs of Nordic runes' },
  { type: 'typing', label: 'Scribe Trial', emoji: '✍️', desc: 'Type motivational quotes exactly' },
  { type: 'steps', label: 'March of Dawn', emoji: '🏃', desc: 'March in place to wake up' },
];

export default function ArenaScreen() {
  const [mode, setMode] = useState<Mode>('menu');
  const [activeChallenge, setActiveChallenge] = useState<ChallengeType | null>(null);
  const { practiceChallenge, boss, stats, recommendedDifficulty } = usePlayerStore();
  const weekBoss = getBossForWeek(getWeekNumber());

  const startPractice = (type: ChallengeType) => {
    setActiveChallenge(type);
    setMode('practice');
  };

  const handleComplete = useCallback((success: boolean) => {
    if (activeChallenge) {
      practiceChallenge(activeChallenge, success);
    }
    setTimeout(() => {
      setMode('menu');
      setActiveChallenge(null);
    }, 1200);
  }, [activeChallenge, practiceChallenge]);

  if (mode === 'practice' && activeChallenge) {
    return (
      <SafeAreaView style={s.safe}>
        <TouchableOpacity style={s.backBtn} onPress={() => { setMode('menu'); setActiveChallenge(null); }}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        {activeChallenge === 'math' && <MathChallenge difficulty={(recommendedDifficulty as any) || 'medium'} onComplete={handleComplete} />}
        {activeChallenge === 'trivia' && <TriviaChallenge onComplete={handleComplete} />}
        {activeChallenge === 'shake' && <ShakeChallenge difficulty={(recommendedDifficulty as any) || 'medium'} onComplete={handleComplete} />}
        {activeChallenge === 'memory' && <MemoryMatch onComplete={handleComplete} />}
        {activeChallenge === 'typing' && <TypingChallenge onComplete={handleComplete} />}
        {activeChallenge === 'steps' && <StepsChallenge difficulty={(recommendedDifficulty as any) || 'medium'} onComplete={handleComplete} />}
      </SafeAreaView>
    );
  }

  // Challenge mastery totals
  const totalChallenges = stats.totalMathSolved + stats.totalTriviaCorrect +
    stats.totalShakesCompleted + stats.totalMemoryCompleted +
    stats.totalTypingCompleted + stats.totalStepsCompleted;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>⚔️ ARENA</Text>
        <Text style={s.subtitle}>Practice challenges & battle the weekly boss</Text>

        {/* Weekly Boss */}
        <Text style={s.sectionTitle}>WEEKLY BOSS</Text>
        <BossWidget />
        <Text style={s.bossHint}>
          {boss.defeated
            ? '✓ Boss defeated! Wait for next week\'s challenger.'
            : `Dismiss alarms to deal damage. ${weekBoss.weakTo} challenges deal 2× damage!`}
        </Text>

        {/* Combat Stats */}
        <View style={s.combatRow}>
          <View style={s.combatStat}>
            <Text style={s.combatValue}>{boss.playerDamageDealt}</Text>
            <Text style={s.combatLabel}>Damage Dealt</Text>
          </View>
          <View style={s.combatStat}>
            <Text style={[s.combatValue, { color: COLORS.fire }]}>{boss.snoozeDamageTaken}</Text>
            <Text style={s.combatLabel}>Snooze Damage</Text>
          </View>
          <View style={s.combatStat}>
            <Text style={s.combatValue}>{stats.bossesDefeated}</Text>
            <Text style={s.combatLabel}>Bosses Slain</Text>
          </View>
        </View>

        {/* Ad Banner */}
        <AdBanner />

        {/* Adaptive Difficulty Badge */}
        <View style={s.diffBadge}>
          <Text style={s.diffBadgeLabel}>🎯 RECOMMENDED DIFFICULTY</Text>
          <Text style={s.diffBadgeValue}>{(recommendedDifficulty || 'medium').toUpperCase()}</Text>
          <Text style={s.diffBadgeHint}>Based on your last 20 challenges</Text>
        </View>

        {/* Practice */}
        <Text style={s.sectionTitle}>PRACTICE ({totalChallenges} completed)</Text>
        <Text style={s.practiceHint}>Earn +5 XP and +2 coins per practice win</Text>

        {PRACTICE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.type}
            style={s.practiceCard}
            onPress={() => startPractice(opt.type)}
            activeOpacity={0.7}
          >
            <Text style={s.practiceEmoji}>{opt.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.practiceLabel}>{opt.label}</Text>
              <Text style={s.practiceDesc}>{opt.desc}</Text>
            </View>
            <Text style={s.playArrow}>▶</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingBottom: 100 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '800', letterSpacing: 2 },
  subtitle: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 20 },
  sectionTitle: { color: COLORS.gold, fontSize: 13, fontWeight: '700', letterSpacing: 2, marginTop: 24, marginBottom: 12 },
  bossHint: { color: COLORS.textMuted, fontSize: 12, marginTop: 8, fontStyle: 'italic' },
  combatRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  combatStat: { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  combatValue: { color: COLORS.text, fontSize: 22, fontWeight: '800', fontFamily: 'monospace' },
  combatLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 4 },
  // Adaptive Difficulty Badge
  diffBadge: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gold + '40',
  },
  diffBadgeLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  diffBadgeValue: { color: COLORS.gold, fontSize: 24, fontWeight: '800', marginTop: 4, letterSpacing: 2 },
  diffBadgeHint: { color: COLORS.textMuted, fontSize: 10, marginTop: 4 },
  // Practice
  practiceHint: { color: COLORS.textMuted, fontSize: 12, marginBottom: 12 },
  practiceCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  practiceEmoji: { fontSize: 28 },
  practiceLabel: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  practiceDesc: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  playArrow: { color: COLORS.frost, fontSize: 18 },
  backBtn: { paddingHorizontal: 20, paddingVertical: 12 },
  backText: { color: COLORS.frost, fontSize: 15, fontWeight: '600' },
});
