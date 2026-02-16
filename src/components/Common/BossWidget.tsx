import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../theme';
import { usePlayerStore } from '../../stores/playerStore';
import { getBossForWeek, getWeekNumber } from '../../data/bosses';

export default function BossWidget() {
  const { boss } = usePlayerStore();
  const weekBoss = getBossForWeek(getWeekNumber());
  const hpPercent = boss.currentHp / boss.maxHp;
  const hpColor = hpPercent > 0.5 ? COLORS.hpGreen : hpPercent > 0.25 ? COLORS.hpYellow : COLORS.hpRed;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.emoji}>{weekBoss.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{weekBoss.name}</Text>
          <Text style={s.title}>{weekBoss.title}</Text>
        </View>
        {boss.defeated && <Text style={s.defeated}>SLAIN ⚔️</Text>}
      </View>

      {!boss.defeated && (
        <View style={s.hpContainer}>
          <View style={s.hpTrack}>
            <View style={[s.hpFill, { width: `${hpPercent * 100}%`, backgroundColor: hpColor }]} />
          </View>
          <Text style={s.hpText}>{boss.currentHp} / {boss.maxHp} HP</Text>
        </View>
      )}

      <Text style={s.loot}>
        Loot: {weekBoss.loot.coins} coins + {weekBoss.loot.xp} XP · Weak to: {weekBoss.weakTo}
      </Text>

      {/* PDUFA-themed lore */}
      <Text style={s.lore}>{weekBoss.lore}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  emoji: { fontSize: 36 },
  name: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  title: { color: COLORS.textSecondary, fontSize: 12, fontStyle: 'italic' },
  defeated: { color: COLORS.emerald, fontSize: 12, fontWeight: '700' },
  hpContainer: { marginBottom: 8 },
  hpTrack: { height: 10, backgroundColor: COLORS.hpTrack, borderRadius: 5 },
  hpFill: { height: '100%', borderRadius: 5 },
  hpText: { color: COLORS.textSecondary, fontSize: 11, fontFamily: 'monospace', textAlign: 'right', marginTop: 4 },
  loot: { color: COLORS.textMuted, fontSize: 11 },
  lore: { color: COLORS.textSecondary, fontSize: 11, fontStyle: 'italic', marginTop: 8, lineHeight: 16 },
});
