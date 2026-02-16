import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme';
import { useAlarmStore, formatTime, ROUTINE_TASKS, type ChallengeType } from '../../stores/alarmStore';
import { usePlayerStore } from '../../stores/playerStore';
import MathChallenge from '../../components/challenges/MathChallenge';
import TriviaChallenge from '../../components/challenges/TriviaChallenge';
import ShakeChallenge from '../../components/challenges/ShakeChallenge';
import MemoryMatch from '../../components/challenges/MemoryMatch';
import TypingChallenge from '../../components/challenges/TypingChallenge';
import StepsChallenge from '../../components/challenges/StepsChallenge';
import ReviewPrompt from '../../components/Common/ReviewPrompt';
import { shareResult, type ShareEvent } from '../../utils/share';
import { getBossForWeek, getWeekNumber } from '../../data/bosses';
import type { Achievement } from '../../data/achievements';

type Phase = 'ringing' | 'challenge' | 'victory' | 'wakeproof_pending' | 'wakeproof_check' | 'routine';

export default function ChallengeScreen() {
  const { activeAlarmId, setActiveAlarm, getAlarm, startWakeProof, wakeProofStatus, triggerWakeProofCheck, passWakeProof, failWakeProof, resetWakeProof, wakeProofDeadline } = useAlarmStore();
  const { dismissAlarm, snoozeAlarm, recordWakeProofResult, completeRoutineTask, todayRoutineComplete, todayRoutineDate } = usePlayerStore();
  const alarm = activeAlarmId ? getAlarm(activeAlarmId) : null;

  const [snoozesUsed, setSnoozesUsed] = useState(0);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [currentChallenge, setCurrentChallenge] = useState<ChallengeType | null>(null);
  const [phase, setPhase] = useState<Phase>('ringing');
  const [result, setResult] = useState<any>(null);
  const [wakeProofCountdown, setWakeProofCountdown] = useState(0);
  const [routineComplete, setRoutineComplete] = useState<string[]>([]);
  const [reviewTrigger, setReviewTrigger] = useState<'streak' | 'boss_defeat' | 'level_up' | null>(null);
  const [shareLoading, setShareLoading] = useState(false);

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

  // Wake Proof countdown timer
  useEffect(() => {
    if (phase !== 'wakeproof_pending' || !wakeProofDeadline) return;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((wakeProofDeadline - Date.now()) / 1000));
      setWakeProofCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        setPhase('wakeproof_check');
        triggerWakeProofCheck();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, wakeProofDeadline]);

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
    const type = alarm.challenges[challengeIndex % alarm.challenges.length];
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

        // Trigger review prompt based on event type
        if (res.bossDefeated) setReviewTrigger('boss_defeat');
        else if (res.leveledUp) setReviewTrigger('level_up');
        else if (res.streakCount >= 3 && res.streakCount % 3 === 0) setReviewTrigger('streak');

        // Start wake proof if enabled
        if (alarm.wakeProofEnabled) {
          startWakeProof(alarm.id, alarm.wakeProofDelayMin);
          setPhase('victory'); // show victory first, then transition
        } else {
          setPhase('victory');
        }
      } else {
        setChallengeIndex(nextIndex);
        const nextType = alarm.challenges[nextIndex % alarm.challenges.length];
        setCurrentChallenge(nextType);
      }
    } else {
      setPhase('ringing');
      setCurrentChallenge(null);
    }
  };

  const handleDismissVictory = () => {
    if (alarm.wakeProofEnabled && wakeProofStatus === 'pending') {
      setPhase('wakeproof_pending');
    } else if (alarm.morningRoutine.length > 0) {
      setPhase('routine');
    } else {
      finishAll();
    }
  };

  const handleWakeProofConfirm = () => {
    passWakeProof();
    recordWakeProofResult(true);
    if (alarm.morningRoutine.length > 0) {
      setPhase('routine');
    } else {
      finishAll();
    }
  };

  const handleWakeProofFail = () => {
    failWakeProof();
    recordWakeProofResult(false);
    // Alarm re-triggers via store
    setPhase('ringing');
    setChallengeIndex(0);
    setSnoozesUsed(0);
  };

  const handleRoutineToggle = (taskId: string) => {
    completeRoutineTask(taskId);
    if (!routineComplete.includes(taskId)) {
      setRoutineComplete((prev) => [...prev, taskId]);
    }
  };

  const finishAll = () => {
    setActiveAlarm(null);
    resetWakeProof();
    setPhase('ringing');
    setChallengeIndex(0);
    setSnoozesUsed(0);
    setResult(null);
    setCurrentChallenge(null);
    setRoutineComplete([]);
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
            {alarm.challengeCount} challenge{alarm.challengeCount > 1 ? 's' : ''} · {alarm.difficulty}
            {alarm.wakeProofEnabled ? ' · Wake Proof ON' : ''}
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
          <Text style={s.progressText}>Challenge {challengeIndex + 1} / {alarm.challengeCount}</Text>
          <View style={s.progressDots}>
            {Array.from({ length: alarm.challengeCount }).map((_, i) => (
              <View key={i} style={[s.dot, i < challengeIndex && { backgroundColor: COLORS.emerald }, i === challengeIndex && { backgroundColor: COLORS.gold }]} />
            ))}
          </View>
        </View>
        {currentChallenge === 'math' && <MathChallenge difficulty={alarm.difficulty} onComplete={handleChallengeComplete} />}
        {currentChallenge === 'trivia' && <TriviaChallenge onComplete={handleChallengeComplete} />}
        {currentChallenge === 'shake' && <ShakeChallenge difficulty={alarm.difficulty} onComplete={handleChallengeComplete} />}
        {currentChallenge === 'memory' && <MemoryMatch onComplete={handleChallengeComplete} />}
        {currentChallenge === 'typing' && <TypingChallenge onComplete={handleChallengeComplete} />}
        {currentChallenge === 'steps' && <StepsChallenge difficulty={alarm.difficulty} onComplete={handleChallengeComplete} />}
      </SafeAreaView>
    );
  }

  // VICTORY PHASE
  if (phase === 'victory' && result) {
    const handleShare = async () => {
      setShareLoading(true);
      const boss = getBossForWeek(getWeekNumber());
      const shared = await shareResult({
        event: result.bossDefeated ? 'boss_defeat' : 'victory',
        streak: result.streakCount,
        wakeScore: result.wakeScore,
        bossName: result.bossDefeated ? boss.name : undefined,
        xp: result.xpEarned,
        coins: result.coinsEarned,
      });
      setShareLoading(false);
      // Bonus coins for sharing
      if (shared) {
        // Small reward tracked locally — coins handled via playerStore in future
      }
    };

    return (
      <SafeAreaView style={s.safe}>
        {/* Review Prompt Overlay */}
        <ReviewPrompt
          totalWins={result.streakCount + (result.bossDefeated ? 1 : 0)}
          triggerEvent={reviewTrigger}
        />

        <View style={s.center}>
          <Text style={s.victoryEmoji}>⚔️</Text>
          <Text style={s.victoryTitle}>MORNING CONQUERED!</Text>

          <View style={s.rewardCard}>
            <View style={s.rewardRow}>
              <Text style={s.rewardLabel}>Wake Score</Text>
              <Text style={[s.rewardValue, { color: COLORS.frost }]}>{result.wakeScore}/100 🎯</Text>
            </View>
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

          {result.leveledUp && <Text style={s.levelUp}>🎉 LEVEL UP!</Text>}
          {result.bossDefeated && <Text style={s.bossDefeat}>💀 BOSS DEFEATED!</Text>}

          {result.newAchievements.length > 0 && (
            <View style={s.achievementList}>
              {result.newAchievements.map((ach: Achievement) => (
                <Text key={ach.id} style={s.achievementItem}>{ach.emoji} {ach.name}</Text>
              ))}
            </View>
          )}

          {/* Share Button */}
          <TouchableOpacity style={s.shareBtn} onPress={handleShare} disabled={shareLoading}>
            <Text style={s.shareText}>{shareLoading ? '...' : '📤 Share Victory'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.continueBtn} onPress={handleDismissVictory}>
            <Text style={s.continueText}>
              {alarm.wakeProofEnabled ? 'CONTINUE → WAKE PROOF' : alarm.morningRoutine.length > 0 ? 'CONTINUE → ROUTINE' : 'DONE'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // WAKE PROOF PENDING (countdown)
  if (phase === 'wakeproof_pending') {
    const minutes = Math.floor(wakeProofCountdown / 60);
    const seconds = wakeProofCountdown % 60;
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.wpEmoji}>🛡️</Text>
          <Text style={s.wpTitle}>WAKE PROOF ACTIVE</Text>
          <Text style={s.wpDesc}>Stay awake! You'll need to confirm you're still up.</Text>
          <Text style={s.wpTimer}>{minutes}:{seconds.toString().padStart(2, '0')}</Text>
          <Text style={s.wpHint}>If you don't confirm, the alarm comes back!</Text>
        </View>
      </SafeAreaView>
    );
  }

  // WAKE PROOF CHECK
  if (phase === 'wakeproof_check') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.wpEmoji}>⚡</Text>
          <Text style={s.wpTitle}>WAKE CHECK!</Text>
          <Text style={s.wpDesc}>Are you still awake, warrior?</Text>
          <TouchableOpacity style={s.dismissBtn} onPress={handleWakeProofConfirm}>
            <Text style={s.dismissText}>✓ I'M AWAKE!</Text>
          </TouchableOpacity>
          <Text style={s.wpAutoFail}>No response in 60s = alarm restarts</Text>
        </View>
      </SafeAreaView>
    );
  }

  // MORNING ROUTINE PHASE
  if (phase === 'routine') {
    const routineTasks = alarm.morningRoutine
      .map((id) => ROUTINE_TASKS.find((t) => t.id === id))
      .filter(Boolean);
    const today = new Date().toISOString().split('T')[0];
    const todayDone = todayRoutineDate === today ? todayRoutineComplete : [];
    const allDone = routineTasks.every((t) => todayDone.includes(t!.id) || routineComplete.includes(t!.id));

    return (
      <SafeAreaView style={s.safe}>
        <View style={s.routineContainer}>
          <Text style={s.routineTitle}>☀️ MORNING QUEST</Text>
          <Text style={s.routineDesc}>Complete your routine for bonus XP</Text>

          {routineTasks.map((task) => {
            if (!task) return null;
            const done = todayDone.includes(task.id) || routineComplete.includes(task.id);
            return (
              <TouchableOpacity
                key={task.id}
                style={[s.routineItem, done && s.routineItemDone]}
                onPress={() => !done && handleRoutineToggle(task.id)}
                disabled={done}
              >
                <Text style={s.routineEmoji}>{task.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.routineLabel, done && { textDecorationLine: 'line-through', color: COLORS.textMuted }]}>
                    {task.label}
                  </Text>
                  <Text style={s.routineDuration}>{task.durationMin} min</Text>
                </View>
                <Text style={s.routineCheck}>{done ? '✓' : '○'}</Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity style={[s.continueBtn, { marginTop: 24 }]} onPress={finishAll}>
            <Text style={s.continueText}>{allDone ? '🎉 ALL DONE!' : 'SKIP / FINISH'}</Text>
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
  alarmEmoji: { fontSize: 72, marginBottom: 16 },
  alarmTime: { color: COLORS.text, fontSize: 56, fontWeight: '800', fontFamily: 'monospace' },
  alarmLabel: { color: COLORS.textSecondary, fontSize: 16, marginTop: 4 },
  dismissBtn: { backgroundColor: COLORS.gold, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, marginTop: 40 },
  dismissText: { color: COLORS.bg, fontSize: 18, fontWeight: '800' },
  snoozeBtn: { borderWidth: 1, borderColor: COLORS.fire + '60', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 16 },
  snoozeText: { color: COLORS.fire, fontSize: 14, fontWeight: '600' },
  challengeInfo: { color: COLORS.textMuted, fontSize: 12, marginTop: 20 },
  progressHeader: { paddingHorizontal: 24, paddingTop: 16 },
  progressText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  progressDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.bgCardLight },
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
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.purple + '60', paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 12, marginTop: 16, backgroundColor: COLORS.purple + '15',
  },
  shareText: { color: COLORS.purple, fontSize: 14, fontWeight: '700' },
  continueBtn: { backgroundColor: COLORS.frost, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, marginTop: 16 },
  continueText: { color: COLORS.bg, fontSize: 14, fontWeight: '800' },
  // Wake Proof
  wpEmoji: { fontSize: 64, marginBottom: 12 },
  wpTitle: { color: COLORS.frost, fontSize: 24, fontWeight: '800', letterSpacing: 2, marginBottom: 8 },
  wpDesc: { color: COLORS.textSecondary, fontSize: 15, textAlign: 'center', marginBottom: 24 },
  wpTimer: { color: COLORS.text, fontSize: 64, fontWeight: '800', fontFamily: 'monospace', marginBottom: 16 },
  wpHint: { color: COLORS.fire, fontSize: 13, fontStyle: 'italic' },
  wpAutoFail: { color: COLORS.textMuted, fontSize: 12, marginTop: 16 },
  // Routine
  routineContainer: { flex: 1, padding: 24, paddingTop: 40 },
  routineTitle: { color: COLORS.gold, fontSize: 22, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  routineDesc: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 20 },
  routineItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  routineItemDone: { borderColor: COLORS.emerald + '50', backgroundColor: COLORS.emerald + '10' },
  routineEmoji: { fontSize: 24 },
  routineLabel: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  routineDuration: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  routineCheck: { color: COLORS.emerald, fontSize: 20, fontWeight: '700' },
});
