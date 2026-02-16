import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { COLORS } from '../../theme';
import type { Difficulty } from '../../stores/alarmStore';

interface Props {
  difficulty: Difficulty;
  onComplete: (success: boolean) => void;
}

const SHAKE_TARGETS: Record<string, number> = { easy: 15, medium: 25, hard: 40, viking: 60 };
const SHAKE_THRESHOLD = 1.8; // m/s² threshold for a "shake"

export default function ShakeChallenge({ difficulty, onComplete }: Props) {
  const target = SHAKE_TARGETS[difficulty] || 25;
  const [count, setCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [completed, setCompleted] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const lastShakeTime = useRef(0);

  // Shake detection via accelerometer (or tap fallback for web)
  useEffect(() => {
    let subscription: any;

    const setupAccelerometer = async () => {
      try {
        const { Accelerometer } = await import('expo-sensors');
        await Accelerometer.setUpdateInterval(100);
        subscription = Accelerometer.addListener(({ x, y, z }) => {
          const total = Math.sqrt(x * x + y * y + z * z);
          const now = Date.now();
          if (total > SHAKE_THRESHOLD && now - lastShakeTime.current > 200) {
            lastShakeTime.current = now;
            setCount((c) => c + 1);
            // Pulse animation
            Animated.sequence([
              Animated.spring(pulseAnim, { toValue: 1.2, useNativeDriver: true, speed: 50 }),
              Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true, speed: 50 }),
            ]).start();
          }
        });
      } catch {
        // Fallback: treat taps as shakes on web
      }
    };

    setupAccelerometer();
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

  // Check completion
  useEffect(() => {
    if (count >= target && !completed) {
      setCompleted(true);
      setTimeout(() => onComplete(true), 500);
    }
  }, [count, target, completed]);

  const progress = Math.min(count / target, 1);
  const timerColor = timeLeft <= 5 ? COLORS.fire : timeLeft <= 10 ? COLORS.gold : COLORS.frost;
  const barColor = progress >= 1 ? COLORS.emerald : COLORS.fireGlow;

  // Web fallback: tap to shake
  const handleTap = () => {
    if (Platform.OS === 'web' && !completed) {
      setCount((c) => c + 1);
      Animated.sequence([
        Animated.spring(pulseAnim, { toValue: 1.2, useNativeDriver: true, speed: 50 }),
        Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true, speed: 50 }),
      ]).start();
    }
  };

  return (
    <View style={s.container} onTouchStart={handleTap}>
      <View style={s.header}>
        <Text style={s.label}>📳 SHAKE FURY</Text>
        <Text style={[s.timer, { color: timerColor }]}>{timeLeft}s</Text>
      </View>

      <Animated.View style={[s.circle, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={s.count}>{count}</Text>
        <Text style={s.target}>/ {target}</Text>
      </Animated.View>

      <View style={s.barTrack}>
        <View style={[s.barFill, { width: `${progress * 100}%`, backgroundColor: barColor }]} />
      </View>

      <Text style={s.instruction}>
        {completed ? '✓ FURY UNLEASHED!' : Platform.OS === 'web' ? 'TAP RAPIDLY!' : 'SHAKE YOUR PHONE!'}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 40 },
  label: { color: COLORS.fireGlow, fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  timer: { fontSize: 24, fontWeight: '700', fontFamily: 'monospace' },
  circle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: COLORS.fireGlow,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    marginBottom: 32,
  },
  count: { color: COLORS.text, fontSize: 56, fontWeight: '800', fontFamily: 'monospace' },
  target: { color: COLORS.textSecondary, fontSize: 18, fontWeight: '600' },
  barTrack: { width: '100%', height: 8, backgroundColor: COLORS.xpTrack, borderRadius: 4, marginBottom: 24 },
  barFill: { height: '100%', borderRadius: 4 },
  instruction: { color: COLORS.textSecondary, fontSize: 16, fontWeight: '600', letterSpacing: 1 },
});
