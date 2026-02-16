import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform, TouchableOpacity } from 'react-native';
import { COLORS } from '../../theme';
import type { Difficulty } from '../../stores/alarmStore';

interface Props {
  difficulty: Difficulty;
  onComplete: (success: boolean) => void;
}

const STEP_TARGETS: Record<string, number> = { easy: 20, medium: 40, hard: 60, viking: 100 };

export default function StepsChallenge({ difficulty, onComplete }: Props) {
  const target = STEP_TARGETS[difficulty] || 40;
  const [count, setCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [completed, setCompleted] = useState(false);
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const lastStepTime = useRef(0);

  // Pedometer via accelerometer — detect "bounce" pattern
  useEffect(() => {
    let subscription: any;
    let lastMag = 0;
    let rising = false;

    const setup = async () => {
      try {
        const { Accelerometer } = await import('expo-sensors');
        await Accelerometer.setUpdateInterval(50);
        subscription = Accelerometer.addListener(({ x, y, z }) => {
          const mag = Math.sqrt(x * x + y * y + z * z);
          const now = Date.now();

          // Detect step: magnitude crosses threshold on rising edge
          if (mag > 1.3 && !rising && now - lastStepTime.current > 300) {
            rising = true;
            lastStepTime.current = now;
            setCount((c) => c + 1);
            // Bounce animation
            Animated.sequence([
              Animated.timing(bounceAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
              Animated.timing(bounceAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
            ]).start();
          }
          if (mag < 1.1) rising = false;
          lastMag = mag;
        });
      } catch {
        // Web fallback handled by tap
      }
    };

    setup();
    return () => subscription?.remove?.();
  }, []);

  // Timer
  useEffect(() => {
    if (completed) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          onComplete(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [completed]);

  // Completion check
  useEffect(() => {
    if (count >= target && !completed) {
      setCompleted(true);
      setTimeout(() => onComplete(true), 500);
    }
  }, [count, target, completed]);

  // Web fallback: tap = step
  const handleTap = () => {
    if (Platform.OS === 'web' && !completed) {
      setCount((c) => c + 1);
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]).start();
    }
  };

  const progress = Math.min(count / target, 1);
  const timerColor = timeLeft <= 10 ? COLORS.fire : timeLeft <= 20 ? COLORS.gold : COLORS.frost;

  // Milestones
  const milestones = [0.25, 0.5, 0.75, 1];
  const milestonePassed = milestones.filter((m) => progress >= m).length;

  return (
    <TouchableOpacity style={s.container} activeOpacity={1} onPress={handleTap}>
      <View style={s.header}>
        <Text style={s.label}>🏃 MARCH OF DAWN</Text>
        <Text style={[s.timer, { color: timerColor }]}>{timeLeft}s</Text>
      </View>

      <Animated.View style={[s.stepCircle, { transform: [{ translateY: bounceAnim }] }]}>
        <Text style={s.stepCount}>{count}</Text>
        <Text style={s.stepTarget}>/ {target} steps</Text>
      </Animated.View>

      {/* Progress ring approximation */}
      <View style={s.progressRow}>
        {milestones.map((m, i) => (
          <View key={i} style={s.milestone}>
            <View style={[s.milestoneDot, progress >= m && { backgroundColor: COLORS.emerald }]} />
            <Text style={s.milestoneLabel}>{Math.round(m * 100)}%</Text>
          </View>
        ))}
      </View>

      <View style={s.barTrack}>
        <View style={[s.barFill, { width: `${progress * 100}%` }]} />
      </View>

      <Text style={s.instruction}>
        {completed
          ? '✓ MARCH COMPLETE!'
          : Platform.OS === 'web'
            ? 'TAP TO MARCH IN PLACE!'
            : 'WALK OR MARCH IN PLACE!'}
      </Text>

      <Text style={s.hint}>
        {milestonePassed >= 3 ? '🔥 Almost there!' : milestonePassed >= 2 ? '⚡ Halfway!' : '🏃 Keep moving!'}
      </Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 32 },
  label: { color: COLORS.emerald, fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  timer: { fontSize: 24, fontWeight: '700', fontFamily: 'monospace' },
  stepCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: COLORS.emerald,
    backgroundColor: COLORS.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepCount: { color: COLORS.text, fontSize: 52, fontWeight: '800', fontFamily: 'monospace' },
  stepTarget: { color: COLORS.textSecondary, fontSize: 14 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-around', width: '80%', marginBottom: 16 },
  milestone: { alignItems: 'center', gap: 4 },
  milestoneDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.bgCardLight, borderWidth: 1, borderColor: COLORS.border },
  milestoneLabel: { color: COLORS.textMuted, fontSize: 10 },
  barTrack: { width: '100%', height: 8, backgroundColor: COLORS.xpTrack, borderRadius: 4, marginBottom: 20 },
  barFill: { height: '100%', backgroundColor: COLORS.emerald, borderRadius: 4 },
  instruction: { color: COLORS.textSecondary, fontSize: 16, fontWeight: '600', letterSpacing: 1 },
  hint: { color: COLORS.textMuted, fontSize: 14, marginTop: 8 },
});
