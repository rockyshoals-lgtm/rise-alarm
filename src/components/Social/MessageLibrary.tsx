import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { COLORS } from '../../theme';
import { useSocialStore, type VoiceMessage } from '../../stores/socialStore';

interface MessageLibraryProps {
  onRecordNew: () => void;
}

export default function MessageLibrary({ onRecordNew }: MessageLibraryProps) {
  const { messages, defaultMessageId, deleteMessage, setDefaultMessage } = useSocialStore();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const playMessage = async (msg: VoiceMessage) => {
    // Stop current if playing
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }

    if (playingId === msg.id) {
      setPlayingId(null);
      return;
    }

    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        { uri: msg.fileUri },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setPlayingId(msg.id);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (err) {
      console.error('Playback error:', err);
    }
  };

  const renderMessage = ({ item }: { item: VoiceMessage }) => {
    const isDefault = defaultMessageId === item.id;
    const isPlaying = playingId === item.id;
    const date = new Date(item.recordedAt).toLocaleDateString();

    return (
      <View style={[s.messageCard, isDefault && s.messageCardDefault]}>
        <View style={s.messageInfo}>
          <Text style={s.senderName}>
            {item.senderName} {isDefault && <Text style={s.defaultBadge}>★ DEFAULT</Text>}
          </Text>
          <Text style={s.messageMeta}>{date} · {Math.round(item.duration)}s</Text>
        </View>

        <View style={s.messageActions}>
          {/* Play */}
          <TouchableOpacity style={s.actionBtn} onPress={() => playMessage(item)}>
            <Text style={s.actionEmoji}>{isPlaying ? '⏸' : '▶'}</Text>
          </TouchableOpacity>

          {/* Set as default */}
          {!isDefault && (
            <TouchableOpacity style={s.actionBtn} onPress={() => setDefaultMessage(item.id)}>
              <Text style={s.actionEmoji}>⭐</Text>
            </TouchableOpacity>
          )}

          {/* Delete */}
          <TouchableOpacity style={s.actionBtn} onPress={() => deleteMessage(item.id)}>
            <Text style={s.actionEmoji}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (messages.length === 0) {
    return (
      <View style={s.emptyContainer}>
        <Text style={s.emptyEmoji}>👥</Text>
        <Text style={s.emptyTitle}>No Voice Messages Yet</Text>
        <Text style={s.emptyDesc}>
          Record a wake-up message from a friend or family member.{'\n'}
          It'll play as a challenge during your alarm!
        </Text>
        <TouchableOpacity style={s.recordBtn} onPress={onRecordNew}>
          <Text style={s.recordBtnText}>🎙️ RECORD FIRST MESSAGE</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Voice Messages ({messages.length})</Text>
        <TouchableOpacity style={s.newBtn} onPress={onRecordNew}>
          <Text style={s.newBtnText}>+ NEW</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderMessage}
        contentContainerStyle={s.list}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  newBtn: { backgroundColor: COLORS.frost, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  newBtnText: { color: COLORS.bg, fontSize: 12, fontWeight: '700' },
  list: { gap: 8 },

  // Message card
  messageCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  messageCardDefault: { borderColor: COLORS.gold + '50' },
  messageInfo: { flex: 1 },
  senderName: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  defaultBadge: { color: COLORS.gold, fontSize: 11, fontWeight: '800' },
  messageMeta: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  messageActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.bgCardLight, justifyContent: 'center', alignItems: 'center' },
  actionEmoji: { fontSize: 16 },

  // Empty
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { color: COLORS.text, fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptyDesc: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  recordBtn: { backgroundColor: COLORS.frost, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  recordBtnText: { color: COLORS.bg, fontSize: 14, fontWeight: '800' },
});
