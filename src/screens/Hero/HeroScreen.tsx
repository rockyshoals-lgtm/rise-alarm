import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, LEVEL_TITLES } from '../../theme';
import { usePlayerStore, getXPProgress, getXPForNextLevel } from '../../stores/playerStore';
import { ACHIEVEMENTS } from '../../data/achievements';
import AdBanner from '../../components/Common/AdBanner';

export default function HeroScreen() {
  const {
    xp, coins, level, title,
    currentStreak, longestStreak,
    stats, unlockedAchievements, sleepLog,
    charStats, wakeScores,
    graceTokenAvailable, graceTokenUsedCount,
    recommendedDifficulty, todayRoutineComplete,
    getWakeScore, useGraceToken,
  } = usePlayerStore();

  const progress = getXPProgress(xp, level);
  const nextXP = getXPForNextLevel(level);
  const wakeScore = getWakeScore();

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

        {/* === WAKE SCORE === */}
        <Text style={s.sectionTitle}>WAKE SCORE</Text>
        <View style={s.wakeScoreCard}>
          <View style={s.wakeScoreMain}>
            <Text style={s.wakeScoreNumber}>{wakeScore.today}</Text>
            <Text style={s.wakeScoreLabel}>TODAY</Text>
          </View>
          <View style={s.wakeScoreSide}>
            <View style={s.wakeScoreMini}>
              <Text style={s.wakeScoreMiniVal}>{wakeScore.weekAvg}</Text>
              <Text style={s.wakeScoreMiniLabel}>7-Day Avg</Text>
            </View>
            <View style={s.wakeScoreMini}>
              <Text style={s.wakeScoreMiniVal}>{wakeScore.allTime}</Text>
              <Text style={s.wakeScoreMiniLabel}>All-Time</Text>
            </View>
          </View>
        </View>
        <Text style={s.wakeScoreHint}>
          {wakeScore.today >= 90 ? '🔥 Legendary wake!' :
           wakeScore.today >= 70 ? '⚡ Strong morning!' :
           wakeScore.today >= 50 ? '🌅 Decent start' :
           wakeScore.today > 0 ? '😴 Room to improve' : 'Dismiss an alarm to score'}
        </Text>

        {/* === CHARACTER STATS === */}
        <Text style={s.sectionTitle}>CHARACTER STATS</Text>
        <View style={s.charStatsCard}>
          <CharStatBar label="⚔️ Discipline" value={charStats.discipline} color={COLORS.fire} />
          <CharStatBar label="⚡ Energy" value={charStats.energy} color={COLORS.gold} />
          <CharStatBar label="🎯 Consistency" value={charStats.consistency} color={COLORS.frost} />
        </View>
        <Text style={s.charStatsHint}>
          Built from your wake habits over the last 14 days
        </Text>

        {/* === GRACE TOKEN === */}
        <Text style={s.sectionTitle}>GRACE TOKEN</Text>
        <View style={s.graceCard}>
          <View style={s.graceRow}>
            <Text style={s.graceEmoji}>{graceTokenAvailable ? '🛡️' : '⏳'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.graceTitle}>
                {graceTokenAvailable ? 'Token Available!' : 'Token Used This Month'}
              </Text>
              <Text style={s.graceDesc}>
                {graceTokenAvailable
                  ? 'Save your streak once if you miss a day'
                  : 'Refreshes next month • Used ' + graceTokenUsedCount + '× total'}
              </Text>
            </View>
          </View>
        </View>

        {/* Ad Banner */}
        <AdBanner />

        {/* === ADAPTIVE DIFFICULTY === */}
        <Text style={s.sectionTitle}>ADAPTIVE DIFFICULTY</Text>
        <View style={s.adaptiveCard}>
          <Text style={s.adaptiveLabel}>🎯 Recommended</Text>
          <Text style={s.adaptiveValue}>{(recommendedDifficulty || 'medium').toUpperCase()}</Text>
          <Text style={s.adaptiveHint}>
            Based on {stats.recentSuccessRate.length} recent challenges
            ({stats.recentSuccessRate.length > 0
              ? Math.round(stats.recentSuccessRate.reduce((a, b) => a + b, 0) / stats.recentSuccessRate.length * 100)
              : 0}% success rate)
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

        {/* Challenge Mastery — now 6 types */}
        <Text style={s.sectionTitle}>CHALLENGE MASTERY</Text>
        <View style={s.masteryRow}>
          <MasteryItem emoji="⚡" label="Math" count={stats.totalMathSolved} />
          <MasteryItem emoji="📚" label="Trivia" count={stats.totalTriviaCorrect} />
          <MasteryItem emoji="📳" label="Shake" count={stats.totalShakesCompleted} />
        </View>
        <View style={[s.masteryRow, { marginTop: 10 }]}>
          <MasteryItem emoji="🧠" label="Memory" count={stats.totalMemoryCompleted} />
          <MasteryItem emoji="✍️" label="Typing" count={stats.totalTypingCompleted} />
          <MasteryItem emoji="🏃" label="Steps" count={stats.totalStepsCompleted} />
        </View>

        {/* Wake Proof Stats */}
        <Text style={s.sectionTitle}>WAKE PROOF</Text>
        <View style={s.wakeProofRow}>
          <View style={s.wakeProofStat}>
            <Text style={[s.wakeProofVal, { color: COLORS.emerald }]}>{stats.wakeProofPasses}</Text>
            <Text style={s.wakeProofLabel}>Passed ✓</Text>
          </View>
          <View style={s.wakeProofStat}>
            <Text style={[s.wakeProofVal, { color: COLORS.fire }]}>{stats.wakeProofFails}</Text>
            <Text style={s.wakeProofLabel}>Failed ✗</Text>
          </View>
          <View style={s.wakeProofStat}>
            <Text style={[s.wakeProofVal, { color: COLORS.gold }]}>{stats.routinesCompleted}</Text>
            <Text style={s.wakeProofLabel}>Routines</Text>
          </View>
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
          <View style={s.sleepRow}>
            <Text style={s.sleepLabel}>Avg Wake Score</Text>
            <Text style={s.sleepValue}>
              {last7.length > 0
                ? Math.round(last7.reduce((a, d) => a + d.wakeScore, 0) / last7.length)
                : '--'}
            </Text>
          </View>
          {/* Mini bar chart */}
          <View style={s.chartRow}>
            {Array.from({ length: 7 }).map((_, i) => {
              const entry = last7[i];
              const height = entry ? Math.max(10, (entry.wakeScore / 100) * 60) : 5;
              const color = entry
                ? entry.wakeScore >= 80 ? COLORS.emerald
                : entry.wakeScore >= 50 ? COLORS.gold
                : COLORS.fire
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

// === Sub-components ===

function CharStatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={cs.row}>
      <Text style={cs.label}>{label}</Text>
      <View style={cs.barTrack}>
        <View style={[cs.barFill, { width: `${Math.min(value, 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={[cs.value, { color }]}>{value}</Text>
    </View>
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

// === Styles ===

const cs = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  label: { color: COLORS.text, fontSize: 13, fontWeight: '600', width: 110 },
  barTrack: { flex: 1, height: 10, backgroundColor: COLORS.xpTrack, borderRadius: 5 },
  barFill: { height: '100%', borderRadius: 5 },
  value: { fontSize: 14, fontWeight: '800', fontFamily: 'monospace', width: 32, textAlign: 'right' },
});

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
  // Wake Score
  wakeScoreCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center',
  },
  wakeScoreMain: { alignItems: 'center', marginRight: 24 },
  wakeScoreNumber: { color: COLORS.text, fontSize: 56, fontWeight: '800', fontFamily: 'monospace' },
  wakeScoreLabel: { color: COLORS.gold, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginTop: 4 },
  wakeScoreSide: { flex: 1, gap: 12 },
  wakeScoreMini: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wakeScoreMiniVal: { color: COLORS.text, fontSize: 24, fontWeight: '700', fontFamily: 'monospace' },
  wakeScoreMiniLabel: { color: COLORS.textMuted, fontSize: 11 },
  wakeScoreHint: { color: COLORS.textMuted, fontSize: 12, marginTop: 8, fontStyle: 'italic', textAlign: 'center' },
  // Character Stats
  charStatsCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: COLORS.border,
  },
  charStatsHint: { color: COLORS.textMuted, fontSize: 11, marginTop: 6, fontStyle: 'italic' },
  // Grace Token
  graceCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  graceRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  graceEmoji: { fontSize: 36 },
  graceTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  graceDesc: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  // Adaptive Difficulty
  adaptiveCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.gold + '40',
  },
  adaptiveLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  adaptiveValue: { color: COLORS.gold, fontSize: 28, fontWeight: '800', marginTop: 4, letterSpacing: 2 },
  adaptiveHint: { color: COLORS.textMuted, fontSize: 11, marginTop: 6 },
  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  // Wake Proof
  wakeProofRow: { flexDirection: 'row', gap: 10 },
  wakeProofStat: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: 12, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  wakeProofVal: { fontSize: 24, fontWeight: '800', fontFamily: 'monospace' },
  wakeProofLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 4 },
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
