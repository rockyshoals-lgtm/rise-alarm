import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { COLORS } from '../../theme';
import { useSocialStore } from '../../stores/socialStore';

interface VoiceRecorderProps {
  onDone: () => void;
  onCancel: () => void;
}

type RecordPhase = 'ready' | 'recording' | 'preview' | 'naming';

const MAX_DURATION = 30; // seconds

export default function VoiceRecorder({ onDone, onCancel }: VoiceRecorderProps) {
  const { addMessage } = useSocialStore();
  const [phase, setPhase] = useState<RecordPhase>('ready');
  const [elapsed, setElapsed] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [senderName, setSenderName] = useState('');
  const [playing, setPlaying] = useState(false);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation while recording
  useEffect(() => {
    if (phase !== 'recording') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [phase]);

  // Timer while recording
  useEffect(() => {
    if (phase !== 'recording') return;
    const timer = setInterval(() => {
      setElapsed((e) => {
        if (e >= MAX_DURATION) {
          stopRecording();
          return e;
        }
        return e + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setElapsed(0);
      setPhase('recording');
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      const status = await recordingRef.current.getStatusAsync();
      recordingRef.current = null;

      if (uri) {
        setRecordingUri(uri);
        setDuration(Math.round((status.durationMillis || 0) / 1000));
        setPhase('preview');
      }

      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    } catch (err) {
      console.error('Failed to stop recording:', err);
    }
  };

  const playPreview = async () => {
    if (!recordingUri) return;
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setPlaying(true);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlaying(false);
        }
      });
    } catch (err) {
      console.error('Playback error:', err);
    }
  };

  const stopPreview = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      setPlaying(false);
    }
  };

  const handleSave = () => {
    if (!recordingUri || !senderName.trim()) return;
    addMessage({
      senderName: senderName.trim(),
      recordedAt: new Date().toISOString(),
      duration,
      fileUri: recordingUri,
    });
    onDone();
  };

  const handleDiscard = () => {
    setRecordingUri(null);
    setPhase('ready');
    setElapsed(0);
    setDuration(0);
    setSenderName('');
  };

  // READY
  if (phase === 'ready') {
    return (
      <View style={s.container}>
        <Text style={s.title}>🎙️ RECORD MESSAGE</Text>
        <Text style={s.desc}>Record a wake-up message (max {MAX_DURATION}s)</Text>
        <TouchableOpacity style={s.recordBtn} onPress={startRecording}>
          <Text style={s.recordBtnText}>🔴 START RECORDING</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
          <Text style={s.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // RECORDING
  if (phase === 'recording') {
    return (
      <View style={s.container}>
        <Animated.View style={[s.recordIndicator, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={s.recordDot}>🔴</Text>
        </Animated.View>
        <Text style={s.timerText}>{elapsed}s / {MAX_DURATION}s</Text>
        <Text style={s.recordingHint}>Recording...</Text>
        <TouchableOpacity style={s.stopBtn} onPress={stopRecording}>
          <Text style={s.stopBtnText}>⏹ STOP</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // PREVIEW
  if (phase === 'preview') {
    return (
      <View style={s.container}>
        <Text style={s.title}>🎧 PREVIEW</Text>
        <Text style={s.desc}>Duration: {duration}s</Text>

        <TouchableOpacity style={s.playBtn} onPress={playing ? stopPreview : playPreview}>
          <Text style={s.playBtnText}>{playing ? '⏸ Pause' : '▶ Play'}</Text>
        </TouchableOpacity>

        <View style={s.previewActions}>
          <TouchableOpacity style={s.discardBtn} onPress={handleDiscard}>
            <Text style={s.discardText}>🗑️ Discard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.keepBtn} onPress={() => setPhase('naming')}>
            <Text style={s.keepText}>✓ Keep</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // NAMING
  return (
    <View style={s.container}>
      <Text style={s.title}>👤 WHO IS THIS FROM?</Text>
      <Text style={s.desc}>Enter the sender's name</Text>

      <TextInput
        style={s.nameInput}
        value={senderName}
        onChangeText={setSenderName}
        placeholder="e.g., Mom, Jake, Coach"
        placeholderTextColor={COLORS.textMuted}
        autoFocus
        maxLength={30}
      />

      <TouchableOpacity
        style={[s.saveBtn, !senderName.trim() && { opacity: 0.4 }]}
        onPress={handleSave}
        disabled={!senderName.trim()}
      >
        <Text style={s.saveBtnText}>💾 SAVE MESSAGE</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.cancelBtn} onPress={() => setPhase('preview')}>
        <Text style={s.cancelText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { color: COLORS.frost, fontSize: 20, fontWeight: '800', letterSpacing: 2, marginBottom: 8 },
  desc: { color: COLORS.textSecondary, fontSize: 14, marginBottom: 24 },
  recordBtn: { backgroundColor: COLORS.fire, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 },
  recordBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  cancelBtn: { marginTop: 16, paddingVertical: 12 },
  cancelText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  recordIndicator: { marginBottom: 16 },
  recordDot: { fontSize: 48 },
  timerText: { color: COLORS.text, fontSize: 48, fontWeight: '200', fontFamily: 'monospace' },
  recordingHint: { color: COLORS.fire, fontSize: 14, fontWeight: '600', marginTop: 8 },
  stopBtn: { backgroundColor: COLORS.bgCard, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, marginTop: 24, borderWidth: 1, borderColor: COLORS.fire },
  stopBtnText: { color: COLORS.fire, fontSize: 16, fontWeight: '800' },
  playBtn: { backgroundColor: COLORS.frost, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, marginBottom: 24 },
  playBtnText: { color: COLORS.bg, fontSize: 16, fontWeight: '800' },
  previewActions: { flexDirection: 'row', gap: 16 },
  discardBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.fire },
  discardText: { color: COLORS.fire, fontSize: 14, fontWeight: '700' },
  keepBtn: { backgroundColor: COLORS.emerald, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  keepText: { color: COLORS.bg, fontSize: 14, fontWeight: '700' },
  nameInput: {
    backgroundColor: COLORS.bgCard, color: COLORS.text, fontSize: 18, fontWeight: '600',
    borderRadius: 12, padding: 16, width: '100%', textAlign: 'center',
    borderWidth: 1, borderColor: COLORS.frost + '40', marginBottom: 24,
  },
  saveBtn: { backgroundColor: COLORS.gold, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 },
  saveBtnText: { color: COLORS.bg, fontSize: 16, fontWeight: '800' },
});
