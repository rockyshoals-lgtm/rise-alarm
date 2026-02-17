import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Accelerometer } from 'expo-sensors';
import { COLORS } from '../../theme';
import { useAlarmStore, formatTime } from '../../stores/alarmStore';
import { SleepEpochTracker, shouldTriggerSmartWake, type SleepState, type EpochResult } from '../../utils/sleepDetection';

type SleepPhase = 'setup' | 'monitoring' | 'triggered';

export default function SleepModeScreen() {
  const { sleepModeAlarmId, getAlarm, stopSleepMode, setActiveAlarm } = useAlarmStore();
  const alarm = sleepModeAlarmId ? getAlarm(sleepModeAlarmId) : null;

  const [phase, setPhase] = useState<SleepPhase>('setup');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sleepState, setSleepState] = useState<SleepState>('unknown');
  const [lastEpoch, setLastEpoch] = useState<EpochResult | null>(null);
  const [epochCount, setEpochCount] = useState(0);
  const [minutesUntilAlarm, setMinutesUntilAlarm] = useState<number>(0);

  const trackerRef = useRef(new SleepEpochTracker());
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const dotAnims = useRef([
    new Animated.Value(0.2),
    new Animated.Value(0.2),
    new Animated.Value(0.2),
    new Animated.Value(0.2),
    new Animated.Value(0.2),
  ]).current;

  // Clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate minutes until alarm
  useEffect(() => {
    if (!alarm) return;
    const now = currentTime;
    const target = new Date(now);
    target.setHours(alarm.hour, alarm.minute, 0, 0);
    // If target is in the past, it's tomorrow
    if (target <= now) target.setDate(target.getDate() + 1);
    const diff = (target.getTime() - now.getTime()) / 60000;
    setMinutesUntilAlarm(Math.round(diff));
  }, [currentTime, alarm]);

  // Subtle pulse animation
  useEffect(() => {
    if (phase !== 'monitoring') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [phase]);

  // Movement dot animation based on sleep state
  useEffect(() => {
    const intensity = sleepState === 'deep' ? 0.15 : sleepState === 'light' ? 0.5 : sleepState === 'awake' ? 0.9 : 0.2;
    dotAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: intensity * (0.5 + Math.random() * 0.5),
        duration: 800 + i * 200,
        useNativeDriver: true,
      }).start();
    });
  }, [sleepState, epochCount]);

  // Accelerometer monitoring
  useEffect(() => {
    if (phase !== 'monitoring' || !alarm) return;

    const tracker = trackerRef.current;
    tracker.reset();

    Accelerometer.setUpdateInterval(100); // 10Hz
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      tracker.addSample(x, y, z);

      if (tracker.isEpochComplete()) {
        const result = tracker.evaluateEpoch();
        setSleepState(result.state);
        setLastEpoch(result);
        setEpochCount(c => c + 1);

        // Check if we should trigger the alarm
        if (alarm.smartWakeEnabled) {
          const now = new Date();
          const target = new Date(now);
          target.setHours(alarm.hour, alarm.minute, 0, 0);
          if (target <= now) target.setDate(target.getDate() + 1);
          const minsUntil = (target.getTime() - now.getTime()) / 60000;

          if (shouldTriggerSmartWake(result.state, minsUntil, alarm.smartWakeWindowMin)) {
            handleTrigger();
          }
        }
      }
    });

    return () => sub.remove();
  }, [phase, alarm]);

  const handleStartMonitoring = useCallback(() => {
    setPhase('monitoring');
  }, []);

  const handleTrigger = useCallback(() => {
    setPhase('triggered');
    // Set the active alarm → ChallengeScreen picks it up
    if (sleepModeAlarmId) {
      setActiveAlarm(sleepModeAlarmId);
    }
    stopSleepMode();
  }, [sleepModeAlarmId]);

  const handleCancel = useCallback(() => {
    stopSleepMode();
  }, []);

  if (!alarm) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.noAlarm}>No alarm selected for Sleep Mode</Text>
          <TouchableOpacity style={s.cancelBtn} onPress={handleCancel}>
            <Text style={s.cancelText}>EXIT</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const stateEmoji = sleepState === 'deep' ? '🌙' : sleepState === 'light' ? '💤' : sleepState === 'awake' ? '☀️' : '🔮';
  const stateLabel = sleepState === 'deep' ? 'Deep Sleep' : sleepState === 'light' ? 'Light Sleep' : sleepState === 'awake' ? 'Awake' : 'Detecting...';
  const stateColor = sleepState === 'deep' ? COLORS.purple : sleepState === 'light' ? COLORS.frost : sleepState === 'awake' ? COLORS.gold : COLORS.textMuted;

  // SETUP PHASE
  if (phase === 'setup') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Text style={s.setupEmoji}>😴</Text>
          <Text style={s.setupTitle}>SLEEP MODE</Text>
          <Text style={s.setupAlarm}>Alarm: {formatTime(alarm.hour, alarm.minute)}</Text>
          <Text style={s.setupWindow}>
            Smart Wake: {alarm.smartWakeWindowMin} min window
          </Text>

          <View style={s.instructionCard}>
            <Text style={s.instructionTitle}>How it works</Text>
            <Text style={s.instructionText}>
              1. Place your phone on the bed near your pillow{'\n'}
              2. Keep the app open (screen will dim){'\n'}
              3. RISE detects light sleep via motion sensors{'\n'}
              4. Alarm triggers during your lightest sleep phase
            </Text>
          </View>

          <TouchableOpacity style={s.startBtn} onPress={handleStartMonitoring}>
            <Text style={s.startText}>🌙 START SLEEP MODE</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.cancelBtn} onPress={handleCancel}>
            <Text style={s.cancelText}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // MONITORING PHASE (dimmed UI)
  if (phase === 'monitoring') {
    const hrs = currentTime.getHours() % 12 || 12;
    const mins = currentTime.getMinutes().toString().padStart(2, '0');
    const ampm = currentTime.getHours() < 12 ? 'AM' : 'PM';

    return (
      <SafeAreaView style={s.safeDim}>
        <Animated.View style={[s.dimContainer, { opacity: pulseAnim }]}>
          {/* Movement visualization dots */}
          <View style={s.dotsRow}>
            {dotAnims.map((anim, i) => (
              <Animated.View
                key={i}
                style={[
                  s.moveDot,
                  { opacity: anim, backgroundColor: stateColor },
                ]}
              />
            ))}
          </View>
        </Animated.View>

        <View style={s.dimCenter}>
          <Text style={s.dimTime}>{hrs}:{mins} <Text style={s.dimAmPm}>{ampm}</Text></Text>
          <Text style={[s.dimState, { color: stateColor }]}>{stateEmoji} {stateLabel}</Text>

          <View style={s.dimInfoRow}>
            <View style={s.dimInfoBlock}>
              <Text style={s.dimInfoLabel}>Alarm</Text>
              <Text style={s.dimInfoValue}>{formatTime(alarm.hour, alarm.minute)}</Text>
            </View>
            <View style={s.dimInfoBlock}>
              <Text style={s.dimInfoLabel}>Window</Text>
              <Text style={s.dimInfoValue}>{alarm.smartWakeWindowMin}m</Text>
            </View>
            <View style={s.dimInfoBlock}>
              <Text style={s.dimInfoLabel}>Until</Text>
              <Text style={s.dimInfoValue}>{minutesUntilAlarm}m</Text>
            </View>
          </View>

          {minutesUntilAlarm <= alarm.smartWakeWindowMin && (
            <Text style={s.windowActive}>⚡ Smart-Wake Window Active</Text>
          )}

          {lastEpoch && (
            <Text style={s.dimVariance}>
              Variance: {lastEpoch.variance} · Epochs: {epochCount}
            </Text>
          )}
        </View>

        <View style={s.dimFooter}>
          <TouchableOpacity style={s.cancelBtnDim} onPress={handleCancel}>
            <Text style={s.cancelTextDim}>CANCEL SLEEP MODE</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // TRIGGERED — brief flash before ChallengeScreen takes over
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        <Text style={s.triggerEmoji}>☀️</Text>
        <Text style={s.triggerTitle}>LIGHT SLEEP DETECTED</Text>
        <Text style={s.triggerSub}>Waking you up gently...</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  safeDim: { flex: 1, backgroundColor: '#010310' }, // Extra dark for sleep
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  noAlarm: { color: COLORS.textMuted, fontSize: 16 },

  // Setup
  setupEmoji: { fontSize: 64, marginBottom: 12 },
  setupTitle: { color: COLORS.frost, fontSize: 28, fontWeight: '800', letterSpacing: 3, marginBottom: 8 },
  setupAlarm: { color: COLORS.text, fontSize: 20, fontWeight: '600', marginBottom: 4 },
  setupWindow: { color: COLORS.textSecondary, fontSize: 14, marginBottom: 24 },
  instructionCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 20, width: '100%',
    borderWidth: 1, borderColor: COLORS.frost + '30', marginBottom: 32,
  },
  instructionTitle: { color: COLORS.frost, fontSize: 15, fontWeight: '700', marginBottom: 10 },
  instructionText: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 22 },
  startBtn: { backgroundColor: COLORS.frost, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 },
  startText: { color: COLORS.bg, fontSize: 16, fontWeight: '800' },

  // Cancel
  cancelBtn: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 24 },
  cancelText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },

  // Monitoring (dim)
  dimContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  dimCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, zIndex: 2 },
  dimTime: { color: COLORS.text + '40', fontSize: 56, fontWeight: '200', fontFamily: 'monospace', letterSpacing: 2 },
  dimAmPm: { fontSize: 20, color: COLORS.textMuted + '40' },
  dimState: { fontSize: 16, fontWeight: '600', marginTop: 12, letterSpacing: 1 },
  dimInfoRow: { flexDirection: 'row', gap: 24, marginTop: 32 },
  dimInfoBlock: { alignItems: 'center' },
  dimInfoLabel: { color: COLORS.textMuted + '60', fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  dimInfoValue: { color: COLORS.text + '50', fontSize: 16, fontWeight: '700', marginTop: 4 },
  windowActive: { color: COLORS.frost, fontSize: 13, fontWeight: '700', marginTop: 20, letterSpacing: 1 },
  dimVariance: { color: COLORS.textMuted + '30', fontSize: 10, marginTop: 16 },
  dimFooter: { paddingBottom: 40, alignItems: 'center' },
  cancelBtnDim: { paddingVertical: 12, paddingHorizontal: 24 },
  cancelTextDim: { color: COLORS.textMuted + '50', fontSize: 12, fontWeight: '600', letterSpacing: 1 },

  // Movement dots
  dotsRow: { flexDirection: 'row', gap: 16 },
  moveDot: { width: 8, height: 8, borderRadius: 4 },

  // Triggered
  triggerEmoji: { fontSize: 72, marginBottom: 16 },
  triggerTitle: { color: COLORS.gold, fontSize: 22, fontWeight: '800', letterSpacing: 2 },
  triggerSub: { color: COLORS.textSecondary, fontSize: 15, marginTop: 8 },
});
