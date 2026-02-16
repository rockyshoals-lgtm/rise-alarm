import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme';
import { useAlarmStore, formatTime, type ChallengeType } from '../../stores/alarmStore';
import { usePlayerStore } from '../../stores/playerStore';
import MathChallenge from '../../components/challenges/MathChallenge';
import TriviaChallenge from '../../components/challenges/TriviaChallenge';
import ShakeChallenge from '../../components/challenges/ShakeChallenge';
import MemoryMatch from '../../components/challenges/MemoryMatch';
import type { Achievement } from '../../data/achievements';

export default function ChallengeScreen() {
  const { activeAlarmId, setActiveAlarm, getAlarm } = useAlarmStore();
  const { dismissAlarm, snoozeAlarm } = usePlayerStore();
  const alarm = activeAlarmId ? getAlarm(activeAlarmId) : null;

  const [snoozesUsed, setSnoozesUsed] = useState(0);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [currentChallenge, setCurrentChallenge] = useState<ChallengeType | null>(null);
  const [phase, setPhase] = useState<'ringing' | 'challenge' | 'victory'>('ringing');
  const [result, setResult] = useState<{
    xpEarned: number;
    coinsEarned: number;
    streakCount: number;
    newAchievements: Achievement[];
    bossDefeated: boolean;
    leveledUp: boolean;
  } | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation while ringing
  useEffect(() => {
    if (phase !== 'ringing') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [phase]);

  if (!alarm || !activeAlarmId) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.noAlarm}>No active alarm</Text>
          <Text style={s.noAlarmSub}>Set an alarm and tap TEST to try challenges</Text>
        </View>
      </SafeAreaView>
    );
  }

  const startChallenge = () => {
    const challengeTypes = alarm.challenges;
    const type = challengeTypes[challengeIndex % challengeTypes.length];
    setCurrentChallenge(type);
    setPhase('challenge');
  };

  const handleSnooze = () => {
    if (snoozesUsed >= alarm.snoozeLimit) return;
    snoozeAlarm();
    setSnoozesUsed((n) => n + 1);
  };

  const handleChallengeComplete = (success: boolean) => {
    if (success) {
      const nextIndex = challengeIndex + 1;
      if (nextIndex >= alarm.challengeCount) {
        // All challenges complete — dismiss!
        const res = dismissAlarm(currentChallenge || 'math', snoozesUsed);
        setResult(res);
        setPhase('victory');
      } else {
        // Next challenge
        setChallengeIndex(nextIndex);
        const nextType = alarm.challenges[nextIndex % alarm.challenges.length];
        setCurrentChallenge(nextType);
      }
    } else {
      // Failed — go back to ringing
      setPhase('ringing');
      setCurrentChallenge(null);
    }
  };

  const handleDismissVictory = () => {
    setActiveAlarm(null);
    setPhase('ringing');
    setChallengeIndex(0);
    setSnoozesUsed(0);
    setResult(null);
    setCurrentChallenge(null);
  };

  // RINGING PHASE
  if (phase === 'ringing') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Animated.Text style={[s.alarmEmoji, { transform: [{ scale: pulseAnim }] }]}>⏰</Animated.Text>
          <Text style={s.alarmTime}>{formatTime(alarm.hour, alarm.minute)}</Text>
          {alarm.label ? <Text style={s.alarmLabel}>{alarm.label}</Text> : null}

          <TouchableOpacity style={s.dismissBtn} onPress={startChallenge}>
            <Text style={s.dismissText}>⚔️ FACE THE CHALLENGE</Text>
          </TouchableOpacity>

          {alarm.snoozeLimit > 0 && snoozesUsed < alarm.snoozeLimit && (
            <TouchableOpacity style={s.snoozeBtn} onPress={handleSnooze}>
              <Text style={s.snoozeText}>
                😴 Snooze ({alarm.snoozeLimit - snoozesUsed} left) — Boss attacks!
              </Text>
            </TouchableOpacity>
          )}

          <Text style={s.challengeInfo}>
            {alarm.challengeCount} challenge{alarm.challengeCount > 1 ? 's' : ''} to dismiss · {alarm.difficulty}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // CHALLENGE PHASE
  if (phase === 'challenge' && currentChallenge) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.progressHeader}>
          <Text style={s.progressText}>
            Challenge {challengeIndex + 1} / {alarm.challengeCount}
          </Text>
          <View style={s.progressDots}>
            {Array.from({ length: alarm.challengeCount }).map((_, i) => (
              <View
                key={i}
                style={[
                  s.dot,
                  i < challengeIndex && { backgroundColor: COLORS.emerald },
                  i === challengeIndex && { backgroundColor: COLORS.gold },
                ]}
              />
            ))}
          </View>
        </View>

        {currentChallenge === 'math' && (
          <MathChallenge difficulty={alarm.difficulty} onComplete={handleChallengeComplete} />
        )}
        {currentChallenge === 'trivia' && (
          <TriviaChallenge onComplete={handleChallengeComplete} />
        )}
        {currentChallenge === 'shake' && (
          <ShakeChallenge difficulty={alarm.difficulty} onComplete={handleChallengeComplete} />
        )}
        {currentChallenge === 'memory' && (
          <MemoryMatch onComplete={handleChallengeComplete} />
        )}
      </SafeAreaView>
    );
  }

  // VICTORY PHASE
  if (phase === 'victory' && result) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.victoryEmoji}>⚔️</Text>
          <Text style={s.victoryTitle}>MORNING CONQUERED!</Text>

          <View style={s.rewardCard}>
            <View style={s.rewardRow}>
              <Text style={s.rewardLabel}>XP Earned</Text>
              <Text style={s.rewardValue}>+{result.xpEarned} ⚡</Text>
            </View>
            <View style={s.rewardRow}>
              <Text style={s.rewardLabel}>Coins Earned</Text>
              <Text style={s.rewardValue}>+{result.coinsEarned} 💰</Text>
            </View>
            <View style={s.rewardRow}>
              <Text style={s.rewardLabel}>Streak</Text>
              <Text style={s.rewardValue}>{result.streakCount} 🔥</Text>
            </View>
          </View>

          {result.leveledUp && (
            <Text style={s.levelUp}>🎉 LEVEL UP!</Text>
          )}

          {result.bossDefeated && (
            <Text style={s.bossDefeat}>💀 BOSS DEFEATED! Loot claimed!</Text>
          )}

          {result.newAchievements.length > 0 && (
            <View style={s.achievementList}>
              {result.newAchievements.map((ach) => (
                <Text key={ach.id} style={s.achievementItem}>
                  {ach.emoji} {ach.name} — {ach.description}
                </Text>
              ))}
            </View>
          )}

          <TouchableOpacity style={s.continueBtn} onPress={handleDismissVictory}>
            <Text style={s.continueText}>CONTINUE</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  noAlarm: { color: COLORS.textSecondary, fontSize: 20, fontWeight: '600' },
  noAlarmSub: { color: COLORS.textMuted, fontSize: 13, marginTop: 8, textAlign: 'center' },
  // Ringing
  alarmEmoji: { fontSize: 72, marginBottom: 16 },
  alarmTime: { color: COLORS.text, fontSize: 56, fontWeight: '800', fontFamily: 'monospace' },
  alarmLabel: { color: COLORS.textSecondary, fontSize: 16, marginTop: 4 },
  dismissBtn: { backgroundColor: COLORS.gold, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, marginTop: 40 },
  dismissText: { color: COLORS.bg, fontSize: 18, fontWeight: '800' },
  snoozeBtn: { borderWidth: 1, borderColor: COLORS.fire + '60', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 16 },
  snoozeText: { color: COLORS.fire, fontSize: 14, fontWeight: '600' },
  challengeInfo: { color: COLORS.textMuted, fontSize: 12, marginTop: 20 },
  // Progress
  progressHeader: { paddingHorizontal: 24, paddingTop: 16 },
  progressText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  progressDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.bgCardLight },
  // Victory
  victoryEmoji: { fontSize: 64, marginBottom: 12 },
  victoryTitle: { color: COLORS.gold, fontSize: 28, fontWeight: '800', letterSpacing: 3, marginBottom: 24 },
  rewardCard: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 20, width: '100%', borderWidth: 1, borderColor: COLORS.gold + '30' },
  rewardRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  rewardLabel: { color: COLORS.textSecondary, fontSize: 15 },
  rewardValue: { color: COLORS.text, fontSize: 17, fontWeight: '700' },
  levelUp: { color: COLORS.gold, fontSize: 22, fontWeight: '800', marginTop: 16 },
  bossDefeat: { color: COLORS.emerald, fontSize: 16, fontWeight: '700', marginTop: 8 },
  achievementList: { marginTop: 16, gap: 6 },
  achievementItem: { color: COLORS.purple, fontSize: 14, fontWeight: '600' },
  continueBtn: { backgroundColor: COLORS.frost, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, marginTop: 32 },
  continueText: { color: COLORS.bg, fontSize: 16, fontWeight: '800' },
});
