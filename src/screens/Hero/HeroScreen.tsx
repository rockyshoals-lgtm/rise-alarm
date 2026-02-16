import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, LEVEL_TITLES } from '../../theme';
import { usePlayerStore, getXPProgress, getXPForNextLevel } from '../../stores/playerStore';
import { ACHIEVEMENTS } from '../../data/achievements';

export default function HeroScreen() {
  const {
    xp, coins, level, title,
    currentStreak, longestStreak,
    stats, unlockedAchievements, sleepLog,
  } = usePlayerStore();

  const progress = getXPProgress(xp, level);
  const nextXP = getXPForNextLevel(level);

  // Streak multiplier
  const multiplier = currentStreak >= 7 ? '2.0×' : currentStreak >= 3 ? '1.5×' : '1.0×';

  // Sleep consistency (last 7 days)
  const last7 = sleepLog.slice(-7);
  const avgWake = last7.length > 0
    ? Math.round(last7.reduce((a, b) => a + b.wakeTime, 0) / last7.length)
    : 0;
  const avgWakeStr = avgWake > 0
    ? `${Math.floor(avgWake / 60)}:${(avgWake % 60).toString().padStart(2, '0')}`
    : '--:--';

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        {/* Avatar Section */}
        <View style={s.avatarSection}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarEmoji}>
              {level >= 15 ? '👁️' : level >= 10 ? '🗡️' : level >= 5 ? '⚔️' : '🛡️'}
            </Text>
          </View>
          <Text style={s.heroTitle}>{title}</Text>
          <Text style={s.heroLevel}>Level {level}</Text>
        </View>

        {/* XP Bar */}
        <View style={s.xpSection}>
          <View style={s.xpRow}>
            <Text style={s.xpLabel}>Experience</Text>
            <Text style={s.xpValue}>{xp} / {nextXP} XP</Text>
          </View>
          <View style={s.xpTrack}>
            <View style={[s.xpFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
          </View>
          <Text style={s.nextTitle}>
            Next: {LEVEL_TITLES[Math.min(level + 1, LEVEL_TITLES.length - 1)]}
          </Text>
        </View>

        {/* Stats Grid */}
        <Text style={s.sectionTitle}>BATTLE STATS</Text>
        <View style={s.statsGrid}>
          <StatCard emoji="🔥" label="Current Streak" value={`${currentStreak}d`} accent={COLORS.fireGlow} />
          <StatCard emoji="🏆" label="Best Streak" value={`${longestStreak}d`} accent={COLORS.gold} />
          <StatCard emoji="⚡" label="Multiplier" value={multiplier} accent={COLORS.frost} />
          <StatCard emoji="💰" label="Coins" value={coins.toLocaleString()} accent={COLORS.gold} />
          <StatCard emoji="⏰" label="Alarms Beaten" value={`${stats.totalDismissals}`} accent={COLORS.emerald} />
          <StatCard emoji="😴" label="Total Snoozes" value={`${stats.totalSnoozes}`} accent={COLORS.fire} />
          <StatCard emoji="💀" label="Bosses Slain" value={`${stats.bossesDefeated}`} accent={COLORS.purple} />
          <StatCard emoji="🌅" label="Earliest Wake" value={stats.earliestWake} accent={COLORS.frostGlow} />
        </View>

        {/* Challenge Stats */}
        <Text style={s.sectionTitle}>CHALLENGE MASTERY</Text>
        <View style={s.masteryRow}>
          <MasteryItem emoji="⚡" label="Math" count={stats.totalMathSolved} />
          <MasteryItem emoji="📚" label="Trivia" count={stats.totalTriviaCorrect} />
          <MasteryItem emoji="📳" label="Shake" count={stats.totalShakesCompleted} />
          <MasteryItem emoji="🧠" label="Memory" count={stats.totalMemoryCompleted} />
        </View>

        {/* Sleep Overview (last 7 days) */}
        <Text style={s.sectionTitle}>SLEEP OVERVIEW (7 DAYS)</Text>
        <View style={s.sleepCard}>
          <View style={s.sleepRow}>
            <Text style={s.sleepLabel}>Avg Wake Time</Text>
            <Text style={s.sleepValue}>{avgWakeStr}</Text>
          </View>
          <View style={s.sleepRow}>
            <Text style={s.sleepLabel}>Days Logged</Text>
            <Text style={s.sleepValue}>{last7.length} / 7</Text>
          </View>
          <View style={s.sleepRow}>
            <Text style={s.sleepLabel}>Snooze-Free Days</Text>
            <Text style={s.sleepValue}>
              {last7.filter((d) => d.snoozed === 0).length} / {last7.length}
            </Text>
          </View>
          {/* Mini bar chart */}
          <View style={s.chartRow}>
            {Array.from({ length: 7 }).map((_, i) => {
              const entry = last7[i];
              const height = entry ? Math.max(10, (entry.wakeTime / 720) * 60) : 5;
              const color = entry
                ? entry.snoozed === 0 ? COLORS.emerald : COLORS.gold
                : COLORS.bgCardLight;
              return (
                <View key={i} style={s.chartBar}>
                  <View style={[s.bar, { height, backgroundColor: color }]} />
                  <Text style={s.chartDay}>
                    {entry ? new Date(entry.date).toLocaleDateString('en', { weekday: 'narrow' }) : '-'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Achievements */}
        <Text style={s.sectionTitle}>
          ACHIEVEMENTS ({unlockedAchievements.length}/{ACHIEVEMENTS.length})
        </Text>
        <View style={s.achievementGrid}>
          {ACHIEVEMENTS.map((ach) => {
            const unlocked = unlockedAchievements.includes(ach.id);
            return (
              <View key={ach.id} style={[s.achCard, unlocked && s.achCardUnlocked]}>
                <Text style={[s.achEmoji, !unlocked && { opacity: 0.3 }]}>{ach.emoji}</Text>
                <Text style={[s.achName, !unlocked && { color: COLORS.textMuted }]}>{ach.name}</Text>
                <Text style={s.achDesc}>{ach.description}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ emoji, label, value, accent }: { emoji: string; label: string; value: string; accent: string }) {
  return (
    <View style={ss.statCard}>
      <Text style={ss.statEmoji}>{emoji}</Text>
      <Text style={[ss.statValue, { color: accent }]}>{value}</Text>
      <Text style={ss.statLabel}>{label}</Text>
    </View>
  );
}

function MasteryItem({ emoji, label, count }: { emoji: string; label: string; count: number }) {
  return (
    <View style={ss.masteryItem}>
      <Text style={ss.masteryEmoji}>{emoji}</Text>
      <Text style={ss.masteryCount}>{count}</Text>
      <Text style={ss.masteryLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingBottom: 100 },
  // Avatar
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatarCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.bgCard, borderWidth: 3, borderColor: COLORS.gold,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarEmoji: { fontSize: 44 },
  heroTitle: { color: COLORS.gold, fontSize: 22, fontWeight: '800', letterSpacing: 1 },
  heroLevel: { color: COLORS.textSecondary, fontSize: 14, marginTop: 2 },
  // XP
  xpSection: { marginBottom: 24 },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  xpLabel: { color: COLORS.textSecondary, fontSize: 13 },
  xpValue: { color: COLORS.text, fontSize: 13, fontFamily: 'monospace' },
  xpTrack: { height: 8, backgroundColor: COLORS.xpTrack, borderRadius: 4 },
  xpFill: { height: '100%', backgroundColor: COLORS.xpFill, borderRadius: 4 },
  nextTitle: { color: COLORS.textMuted, fontSize: 11, marginTop: 6, textAlign: 'right', fontStyle: 'italic' },
  // Section
  sectionTitle: { color: COLORS.gold, fontSize: 13, fontWeight: '700', letterSpacing: 2, marginBottom: 12, marginTop: 8 },
  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  // Sleep
  sleepCard: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  sleepRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  sleepLabel: { color: COLORS.textSecondary, fontSize: 13 },
  sleepValue: { color: COLORS.text, fontSize: 14, fontWeight: '600', fontFamily: 'monospace' },
  chartRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, alignItems: 'flex-end', height: 80 },
  chartBar: { alignItems: 'center', gap: 4 },
  bar: { width: 20, borderRadius: 4 },
  chartDay: { color: COLORS.textMuted, fontSize: 10 },
  // Mastery
  masteryRow: { flexDirection: 'row', gap: 10 },
  // Achievements
  achievementGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  achCard: { width: '47%', backgroundColor: COLORS.bgCard, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  achCardUnlocked: { borderColor: COLORS.gold + '60' },
  achEmoji: { fontSize: 24, marginBottom: 6 },
  achName: { color: COLORS.text, fontSize: 13, fontWeight: '700' },
  achDesc: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
});

const ss = StyleSheet.create({
  statCard: {
    width: '47%', backgroundColor: COLORS.bgCard, borderRadius: 14,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  statEmoji: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800', fontFamily: 'monospace' },
  statLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 4 },
  masteryItem: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: 12,
    padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  masteryEmoji: { fontSize: 20, marginBottom: 4 },
  masteryCount: { color: COLORS.text, fontSize: 18, fontWeight: '700', fontFamily: 'monospace' },
  masteryLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
});
