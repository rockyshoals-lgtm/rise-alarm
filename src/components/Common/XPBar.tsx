import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../theme';
import { usePlayerStore, getXPProgress, getXPForNextLevel } from '../../stores/playerStore';

export default function XPBar({ compact = false }: { compact?: boolean }) {
  const { xp, level, title } = usePlayerStore();
  const progress = getXPProgress(xp, level);
  const nextXP = getXPForNextLevel(level);

  if (compact) {
    return (
      <View style={s.compactRow}>
        <Text style={s.levelBadge}>Lv.{level}</Text>
        <View style={s.compactTrack}>
          <View style={[s.compactFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
        </View>
        <Text style={s.compactXP}>{xp}/{nextXP}</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.row}>
        <Text style={s.levelText}>Lv.{level} {title}</Text>
        <Text style={s.xpText}>{xp} / {nextXP} XP</Text>
      </View>
      <View style={s.track}>
        <View style={[s.fill, { width: `${Math.min(progress * 100, 100)}%` }]} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { padding: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  levelText: { color: COLORS.gold, fontSize: 14, fontWeight: '700' },
  xpText: { color: COLORS.textSecondary, fontSize: 12, fontFamily: 'monospace' },
  track: { height: 6, backgroundColor: COLORS.xpTrack, borderRadius: 3 },
  fill: { height: '100%', backgroundColor: COLORS.xpFill, borderRadius: 3 },
  // Compact
  compactRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  levelBadge: { color: COLORS.gold, fontSize: 12, fontWeight: '700', fontFamily: 'monospace' },
  compactTrack: { flex: 1, height: 4, backgroundColor: COLORS.xpTrack, borderRadius: 2 },
  compactFill: { height: '100%', backgroundColor: COLORS.xpFill, borderRadius: 2 },
  compactXP: { color: COLORS.textMuted, fontSize: 10, fontFamily: 'monospace' },
});
