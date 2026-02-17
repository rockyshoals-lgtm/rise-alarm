import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { COLORS } from '../../theme';
import { useSocialStore } from '../../stores/socialStore';

interface SocialChallengeProps {
  onComplete: (success: boolean) => void;
}

export default function SocialChallenge({ onComplete }: SocialChallengeProps) {
  const { messages, defaultMessageId, getMessage } = useSocialStore();
  const message = defaultMessageId ? getMessage(defaultMessageId) : messages[0] ?? null;

  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [canAcknowledge, setCanAcknowledge] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // If no voice message available, auto-complete
  useEffect(() => {
    if (!message) {
      // No social messages — skip gracefully
      setTimeout(() => onComplete(true), 500);
    }
  }, [message]);

  // Pulse animation while playing
  useEffect(() => {
    if (!playing) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [playing]);

  // Timer
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        // Enable acknowledgment after 3 seconds
        if (next >= 3) setCanAcknowledge(true);
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [playing]);

  // Auto-complete safety timeout (60s)
  useEffect(() => {
    const timeout = setTimeout(() => onComplete(true), 60000);
    return () => clearTimeout(timeout);
  }, []);

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const handlePlay = async () => {
    if (!message) return;
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        { uri: message.fileUri },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlaying(false);
          setCanAcknowledge(true);
        }
      });
    } catch (err) {
      // If audio fails, allow acknowledgment anyway
      setCanAcknowledge(true);
    }
  };

  const handleAcknowledge = () => {
    if (soundRef.current) {
      soundRef.current.stopAsync();
    }
    onComplete(true);
  };

  if (!message) {
    return (
      <View style={s.container}>
        <Text style={s.noMessage}>No voice messages yet</Text>
        <Text style={s.noMessageSub}>Record one in the Arena tab!</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>👥 FRIEND'S MESSAGE</Text>
      <Text style={s.senderName}>From: {message.senderName}</Text>

      {/* Waveform placeholder */}
      <Animated.View style={[s.waveCard, { transform: [{ scale: playing ? pulseAnim : 1 }] }]}>
        <Text style={s.waveEmoji}>{playing ? '🔊' : '🔇'}</Text>
        <View style={s.waveBars}>
          {[0.4, 0.7, 1, 0.8, 0.5, 0.9, 0.6, 0.3, 0.7, 1].map((h, i) => (
            <View
              key={i}
              style={[
                s.waveBar,
                { height: h * 32, opacity: playing ? 0.8 : 0.3 },
              ]}
            />
          ))}
        </View>
        <Text style={s.duration}>
          {elapsed}s / {Math.round(message.duration)}s
        </Text>
      </Animated.View>

      {/* Play button */}
      {!playing && elapsed === 0 && (
        <TouchableOpacity style={s.playBtn} onPress={handlePlay}>
          <Text style={s.playText}>▶ PLAY MESSAGE</Text>
        </TouchableOpacity>
      )}

      {/* Acknowledge button */}
      <TouchableOpacity
        style={[s.ackBtn, !canAcknowledge && s.ackBtnDisabled]}
        onPress={handleAcknowledge}
        disabled={!canAcknowledge}
      >
        <Text style={[s.ackText, !canAcknowledge && { opacity: 0.4 }]}>
          {canAcknowledge ? "I'M AWAKE! 💪" : 'Listen first...'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: COLORS.bg },
  title: { color: COLORS.frost, fontSize: 20, fontWeight: '800', letterSpacing: 2, marginBottom: 8 },
  senderName: { color: COLORS.textSecondary, fontSize: 15, marginBottom: 24 },
  noMessage: { color: COLORS.textSecondary, fontSize: 18, fontWeight: '600' },
  noMessageSub: { color: COLORS.textMuted, fontSize: 13, marginTop: 4 },
  waveCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 20, width: '100%',
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.frost + '30', marginBottom: 24,
  },
  waveEmoji: { fontSize: 32, marginBottom: 12 },
  waveBars: { flexDirection: 'row', gap: 4, alignItems: 'flex-end', marginBottom: 8 },
  waveBar: { width: 6, backgroundColor: COLORS.frost, borderRadius: 3 },
  duration: { color: COLORS.textMuted, fontSize: 12 },
  playBtn: {
    backgroundColor: COLORS.frost, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, marginBottom: 16,
  },
  playText: { color: COLORS.bg, fontSize: 16, fontWeight: '800' },
  ackBtn: {
    backgroundColor: COLORS.gold, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16,
  },
  ackBtnDisabled: { backgroundColor: COLORS.bgCardLight },
  ackText: { color: COLORS.bg, fontSize: 16, fontWeight: '800' },
});
