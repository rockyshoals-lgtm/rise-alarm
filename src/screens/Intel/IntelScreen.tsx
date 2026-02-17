import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme';
import { usePlayerStore, getXPProgress, getXPForNextLevel } from '../../stores/playerStore';
import { getBossForWeek, getWeekNumber } from '../../data/bosses';
import AdBanner from '../../components/Common/AdBanner';

const WAKE_TIPS = [
  'Place your phone across the room so you have to physically get up to dismiss the alarm.',
  'Drinking water immediately after waking jumpstarts your metabolism and alertness.',
  'Exposure to bright light within 30 minutes of waking resets your circadian clock.',
  'A consistent wake time (even on weekends) is more important than sleep duration.',
  'The "5-second rule": count 5-4-3-2-1 then physically move before your brain resists.',
  'Cold water on your face activates your dive reflex and increases alertness.',
  'Avoid hitting snooze — fragmented sleep in 9-minute chunks makes you groggier.',
  'A morning routine gives your brain a reason to get up beyond just the alarm.',
  'Exercise within 1 hour of waking boosts cortisol (the healthy wake-up hormone).',
  'Going to bed and waking at the same time trains your body to feel tired and alert naturally.',
];

export default function IntelScreen() {
  const {
    level, title, xp, coins, currentStreak, longestStreak,
    stats, charStats, getWakeScore,
  } = usePlayerStore();
  const boss = getBossForWeek(getWeekNumber());
  const [tipIndex, setTipIndex] = useState(0);
  const wakeScore = getWakeScore();
  const progress = getXPProgress(xp, level);
  const nextXP = getXPForNextLevel(level);

  // Rotate tips
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % WAKE_TIPS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const streakMultiplier = currentStreak >= 7 ? '2.0×' : currentStreak >= 3 ? '1.5×' : '1.0×';

  const handleShare = async () => {
    try {
      await Share.share({
        message: `⚔️ I'm on a ${currentStreak}-day wake streak in RISE! Level ${level} "${title}" with a ${wakeScore.allTime} all-time Wake Score. Can you beat that?\n\n#RISERPG #ConquerYourMorning`,
      });
    } catch { }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerEmoji}>📊</Text>
          <Text style={s.title}>INTEL</Text>
          <Text style={s.subtitle}>Wake Strategy & Insights</Text>
        </View>

        {/* Rotating Tip */}
        <View style={s.tipCard}>
          <Text style={s.tipIcon}>💡</Text>
          <Text style={s.tipText}>{WAKE_TIPS[tipIndex]}</Text>
        </View>

        {/* Ad Banner */}
        <AdBanner />

        {/* Quick Stats Summary */}
        <Text style={s.sectionTitle}>YOUR PERFORMANCE</Text>
        <View style={s.statsGrid}>
          <View style={s.statBox}>
            <Text style={s.statVal}>{wakeScore.allTime}</Text>
            <Text style={s.statLabel}>All-Time Score</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statVal}>{wakeScore.weekAvg}</Text>
            <Text style={s.statLabel}>7-Day Avg</Text>
          </View>
          <View style={s.statBox}>
            <Text style={[s.statVal, { color: COLORS.fire }]}>{currentStreak}d</Text>
            <Text style={s.statLabel}>Current Streak</Text>
          </View>
          <View style={s.statBox}>
            <Text style={s.statVal}>{longestStreak}d</Text>
            <Text style={s.statLabel}>Best Streak</Text>
          </View>
        </View>

        {/* Discipline Breakdown */}
        <Text style={s.sectionTitle}>DISCIPLINE BREAKDOWN</Text>
        <View style={s.breakdownCard}>
          <BreakdownRow label="⚔️ Discipline" value={charStats.discipline} color={COLORS.fire} />
          <BreakdownRow label="⚡ Energy" value={charStats.energy} color={COLORS.gold} />
          <BreakdownRow label="🎯 Consistency" value={charStats.consistency} color={COLORS.frost} />
        </View>

        {/* Challenge Mastery */}
        <Text style={s.sectionTitle}>CHALLENGE MASTERY</Text>
        <View style={s.masteryGrid}>
          <MasteryCard emoji="⚡" label="Math" count={stats.totalMathSolved} />
          <MasteryCard emoji="📚" label="Trivia" count={stats.totalTriviaCorrect} />
          <MasteryCard emoji="📳" label="Shake" count={stats.totalShakesCompleted} />
          <MasteryCard emoji="🧠" label="Memory" count={stats.totalMemoryCompleted} />
          <MasteryCard emoji="✍️" label="Typing" count={stats.totalTypingCompleted} />
          <MasteryCard emoji="🏃" label="Steps" count={stats.totalStepsCompleted} />
        </View>

        {/* Key Metrics */}
        <Text style={s.sectionTitle}>KEY METRICS</Text>
        <View style={s.metricsCard}>
          <MetricRow label="Total Alarms Beaten" value={`${stats.totalDismissals}`} />
          <MetricRow label="Total Snoozes" value={`${stats.totalSnoozes}`} color={COLORS.fire} />
          <MetricRow label="Bosses Defeated" value={`${stats.bossesDefeated}`} />
          <MetricRow label="Streak Multiplier" value={streakMultiplier} color={COLORS.gold} />
          <MetricRow label="Earliest Wake" value={stats.earliestWake} />
          <MetricRow label="Wake Proof Passes" value={`${stats.wakeProofPasses}`} color={COLORS.emerald} />
          <MetricRow label="Routines Completed" value={`${stats.routinesCompleted}`} />
          <MetricRow label="Total Coins Earned" value={coins.toLocaleString()} color={COLORS.gold} />
        </View>

        {/* This Week's Boss */}
        <Text style={s.sectionTitle}>THIS WEEK'S BOSS</Text>
        <View style={s.bossCard}>
          <Text style={s.bossEmoji}>{boss.emoji}</Text>
          <Text style={s.bossName}>{boss.name} — {boss.title}</Text>
          <Text style={s.bossLore}>{boss.lore}</Text>
          <Text style={s.bossWeak}>Weak to: {boss.weakTo} challenges</Text>
        </View>

        {/* Share CTA */}
        <TouchableOpacity style={s.shareBtn} onPress={handleShare} activeOpacity={0.7}>
          <Text style={s.shareBtnText}>📤 Share Your Stats</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerLogo}>⚔️ RISE</Text>
          <Text style={s.footerText}>Conquer Your Morning</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Sub-components

function BreakdownRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={br.row}>
      <Text style={br.label}>{label}</Text>
      <View style={br.track}>
        <View style={[br.fill, { width: `${Math.min(value, 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={[br.val, { color }]}>{value}</Text>
    </View>
  );
}

function MasteryCard({ emoji, label, count }: { emoji: string; label: string; count: number }) {
  return (
    <View style={mc.card}>
      <Text style={mc.emoji}>{emoji}</Text>
      <Text style={mc.count}>{count}</Text>
      <Text style={mc.label}>{label}</Text>
    </View>
  );
}

function MetricRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={mr.row}>
      <Text style={mr.label}>{label}</Text>
      <Text style={[mr.value, color ? { color } : {}]}>{value}</Text>
    </View>
  );
}

// Styles

const br = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  label: { color: COLORS.text, fontSize: 13, fontWeight: '600', width: 110 },
  track: { flex: 1, height: 10, backgroundColor: COLORS.xpTrack, borderRadius: 5 },
  fill: { height: '100%', borderRadius: 5 },
  val: { fontSize: 14, fontWeight: '800', fontFamily: 'monospace', width: 32, textAlign: 'right' },
});

const mc = StyleSheet.create({
  card: {
    width: '30%', backgroundColor: COLORS.bgCard, borderRadius: 12,
    padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  emoji: { fontSize: 20, marginBottom: 4 },
  count: { color: COLORS.text, fontSize: 18, fontWeight: '700', fontFamily: 'monospace' },
  label: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
});

const mr = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  label: { color: COLORS.textSecondary, fontSize: 13 },
  value: { color: COLORS.text, fontSize: 14, fontWeight: '700', fontFamily: 'monospace' },
});

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingBottom: 100 },
  header: { alignItems: 'center', paddingVertical: 20 },
  headerEmoji: { fontSize: 40, marginBottom: 8 },
  title: { color: COLORS.gold, fontSize: 26, fontWeight: '800', letterSpacing: 3 },
  subtitle: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4, letterSpacing: 1 },
  tipCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: COLORS.gold + '30', marginBottom: 20,
  },
  tipIcon: { fontSize: 20 },
  tipText: { color: COLORS.textSecondary, fontSize: 12, flex: 1, lineHeight: 18 },
  sectionTitle: { color: COLORS.gold, fontSize: 13, fontWeight: '700', letterSpacing: 2, marginTop: 8, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statBox: {
    width: '47%', backgroundColor: COLORS.bgCard, borderRadius: 14,
    padding: 16, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  statVal: { color: COLORS.text, fontSize: 28, fontWeight: '800', fontFamily: 'monospace' },
  statLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 4 },
  breakdownCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 16,
  },
  masteryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 16 },
  metricsCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 16,
  },
  bossCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', marginBottom: 24,
  },
  bossEmoji: { fontSize: 40, marginBottom: 10 },
  bossName: { color: COLORS.text, fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  bossLore: { color: COLORS.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 20, fontStyle: 'italic' },
  bossWeak: { color: COLORS.gold, fontSize: 11, fontWeight: '600', marginTop: 10, letterSpacing: 1 },
  shareBtn: {
    backgroundColor: COLORS.gold + '15', borderRadius: 12, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.gold + '30',
    marginBottom: 24,
  },
  shareBtnText: { color: COLORS.gold, fontSize: 14, fontWeight: '700' },
  footer: { alignItems: 'center', paddingVertical: 24 },
  footerLogo: { color: COLORS.gold, fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  footerText: { color: COLORS.textMuted, fontSize: 11, marginTop: 4 },
});
