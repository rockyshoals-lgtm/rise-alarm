import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, TouchableOpacity, Alert, Linking, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme';
import { usePlayerStore } from '../../stores/playerStore';
import { useProStore } from '../../stores/proStore';
import ProBadge from '../../components/Common/ProBadge';
import ProUpsellCard from '../../components/Common/ProUpsellCard';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [gradualVolume, setGradualVolume] = useState(true);
  const [wakeProofDefault, setWakeProofDefault] = useState(true);
  const [morningRoutineDefault, setMorningRoutineDefault] = useState(true);
  const [adaptiveDifficultyEnabled, setAdaptiveDifficultyEnabled] = useState(true);

  const {
    charStats, graceTokenAvailable, graceTokenUsedCount,
    recommendedDifficulty, stats, getWakeScore, currentStreak,
  } = usePlayerStore();

  const { isPro, isProActive, proStartDate, proExpiryDate, purchaseSource, deactivatePro } = useProStore();
  const proActive = isProActive();

  const wakeScore = getWakeScore();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on RISE — the RPG alarm clock that turns waking up into a quest! 🔥 ${currentStreak}-day streak and counting!\n\n#RISERPG #ConquerYourMorning`,
      });
    } catch { }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>⚙️ SETTINGS</Text>

        {/* Quick Stats Bar */}
        <View style={s.quickStats}>
          <View style={s.qStat}>
            <Text style={s.qVal}>{wakeScore.allTime}</Text>
            <Text style={s.qLabel}>Wake Score</Text>
          </View>
          <View style={s.qStat}>
            <Text style={s.qVal}>{charStats.discipline}</Text>
            <Text style={s.qLabel}>Discipline</Text>
          </View>
          <View style={s.qStat}>
            <Text style={s.qVal}>{charStats.energy}</Text>
            <Text style={s.qLabel}>Energy</Text>
          </View>
          <View style={s.qStat}>
            <Text style={s.qVal}>{charStats.consistency}</Text>
            <Text style={s.qLabel}>Consistency</Text>
          </View>
        </View>

        {/* Alarm Settings */}
        <Text style={s.section}>ALARM</Text>
        <View style={s.card}>
          <SettingRow label="Notifications" value={notifications} onToggle={setNotifications} />
          <SettingRow label="Vibration" value={vibration} onToggle={setVibration} />
          <SettingRow label="Gradual Volume" value={gradualVolume} onToggle={setGradualVolume} />
        </View>

        {/* Sound Settings */}
        <Text style={s.section}>SOUNDS</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.row}>
            <Text style={s.rowLabel}>Alarm Sound</Text>
            <Text style={s.rowValue}>Viking Horn 🎺</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.row}>
            <Text style={s.rowLabel}>Victory Sound</Text>
            <Text style={s.rowValue}>Sword Clash ⚔️</Text>
          </TouchableOpacity>
        </View>

        {/* Wake Proof Settings */}
        <Text style={s.section}>WAKE PROOF</Text>
        <View style={s.card}>
          <SettingRow
            label="Default Wake Proof On"
            value={wakeProofDefault}
            onToggle={setWakeProofDefault}
          />
          <View style={s.row}>
            <Text style={s.rowLabel}>Wake Proof Passes</Text>
            <Text style={[s.rowValue, { color: COLORS.emerald }]}>{stats.wakeProofPasses}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Wake Proof Fails</Text>
            <Text style={[s.rowValue, { color: COLORS.fire }]}>{stats.wakeProofFails}</Text>
          </View>
        </View>

        {/* Morning Routine */}
        <Text style={s.section}>MORNING ROUTINE</Text>
        <View style={s.card}>
          <SettingRow
            label="Show Routine After Alarm"
            value={morningRoutineDefault}
            onToggle={setMorningRoutineDefault}
          />
          <View style={s.row}>
            <Text style={s.rowLabel}>Routines Completed</Text>
            <Text style={s.rowValue}>{stats.routinesCompleted}</Text>
          </View>
        </View>

        {/* Game Settings */}
        <Text style={s.section}>GAME</Text>
        <View style={s.card}>
          <SettingRow
            label="Adaptive Difficulty"
            value={adaptiveDifficultyEnabled}
            onToggle={setAdaptiveDifficultyEnabled}
          />
          <View style={s.row}>
            <Text style={s.rowLabel}>Recommended Difficulty</Text>
            <Text style={[s.rowValue, { color: COLORS.gold }]}>
              {(recommendedDifficulty || 'medium').toUpperCase()}
            </Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Grace Token</Text>
            <Text style={[s.rowValue, { color: graceTokenAvailable ? COLORS.emerald : COLORS.textMuted }]}>
              {graceTokenAvailable ? '🛡️ Available' : `⏳ Used (${graceTokenUsedCount}× total)`}
            </Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Success Rate</Text>
            <Text style={s.rowValue}>
              {stats.recentSuccessRate.length > 0
                ? Math.round(stats.recentSuccessRate.reduce((a, b) => a + b, 0) / stats.recentSuccessRate.length * 100) + '%'
                : 'N/A'}
            </Text>
          </View>
        </View>

        {/* === RISE PRO === */}
        <View style={s.proSectionHeader}>
          <Text style={s.section}>RISE PRO</Text>
          <ProBadge />
        </View>
        {proActive ? (
          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.rowLabel}>Status</Text>
              <Text style={[s.rowValue, { color: COLORS.gold, fontWeight: '700' }]}>Active</Text>
            </View>
            <View style={s.row}>
              <Text style={s.rowLabel}>Plan</Text>
              <Text style={s.rowValue}>
                {purchaseSource === 'lifetime' ? 'Lifetime' : 'Monthly Subscription'}
              </Text>
            </View>
            {proStartDate && (
              <View style={s.row}>
                <Text style={s.rowLabel}>Member Since</Text>
                <Text style={s.rowValue}>{proStartDate}</Text>
              </View>
            )}
            {proExpiryDate && purchaseSource === 'subscription' && (
              <View style={s.row}>
                <Text style={s.rowLabel}>Renews</Text>
                <Text style={s.rowValue}>{proExpiryDate}</Text>
              </View>
            )}
            <TouchableOpacity
              style={s.row}
              onPress={() => Alert.alert(
                'Manage Subscription',
                'In-app purchase management coming soon. For now you can deactivate Pro locally.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Deactivate', style: 'destructive', onPress: deactivatePro },
                ]
              )}
            >
              <Text style={s.rowLabel}>Manage Subscription</Text>
              <Text style={s.ctaArrow}>→</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ProUpsellCard />
        )}

        {/* === SHARE === */}
        <Text style={s.section}>SHARE</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.row} onPress={handleShare}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>📤 Share Your Streak</Text>
              <Text style={s.ctaDesc}>Challenge your friends to conquer their mornings</Text>
            </View>
            <Text style={s.ctaArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <Text style={s.section}>ABOUT</Text>
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.rowLabel}>Version</Text>
            <Text style={s.rowValue}>1.3.0</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Built by</Text>
            <Text style={s.rowValue}>Rise Labs</Text>
          </View>
        </View>

        {/* Branding */}
        <View style={s.branding}>
          <Text style={s.brandEmoji}>⚔️</Text>
          <Text style={s.brandName}>RISE</Text>
          <Text style={s.brandTag}>Conquer Your Morning</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: COLORS.bgCardLight, true: COLORS.gold + '50' }}
        thumbColor={value ? COLORS.gold : COLORS.textMuted}
      />
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingBottom: 100 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '800', letterSpacing: 2, marginBottom: 16 },
  // Quick stats
  quickStats: {
    flexDirection: 'row', gap: 8, marginBottom: 16,
  },
  qStat: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: 12, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  qVal: { color: COLORS.text, fontSize: 20, fontWeight: '800', fontFamily: 'monospace' },
  qLabel: { color: COLORS.textMuted, fontSize: 9, marginTop: 2, letterSpacing: 0.5 },
  // Sections
  section: { color: COLORS.gold, fontSize: 12, fontWeight: '700', letterSpacing: 2, marginTop: 20, marginBottom: 10 },
  card: { backgroundColor: COLORS.bgCard, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  rowLabel: { color: COLORS.text, fontSize: 15 },
  rowValue: { color: COLORS.textSecondary, fontSize: 14 },
  branding: { alignItems: 'center', paddingVertical: 40 },
  brandEmoji: { fontSize: 40, marginBottom: 8 },
  brandName: { color: COLORS.gold, fontSize: 20, fontWeight: '800', letterSpacing: 2 },
  brandTag: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4, fontStyle: 'italic' },
  // Pro section header
  proSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 10 },
  // CTA styles
  ctaDesc: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  ctaArrow: { color: COLORS.frost, fontSize: 20, fontWeight: '700' },
});
