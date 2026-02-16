import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, TouchableOpacity, Alert, Linking, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme';
import { usePlayerStore } from '../../stores/playerStore';
import { useBiotechStore } from '../../stores/biotechStore';

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

  const {
    biotechModeEnabled, toggleBiotechMode,
    referralCode, referralShareCount, odinBetaUnlocked,
    biotechTriviaCorrect, biotechHintsUnlocked,
    generateReferralCode, recordReferralShare,
  } = useBiotechStore();

  const wakeScore = getWakeScore();

  const handleReferralShare = async () => {
    const code = generateReferralCode();
    try {
      const result = await Share.share({
        message: `Join me on RISE — the RPG alarm clock! Use my code ${code} for bonus quests. 🔥 ${currentStreak}-day streak and counting!\n\npdufa.bio/rise`,
      });
      if (result.action === Share.sharedAction) {
        recordReferralShare();
      }
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

        {/* === BIOTECH MODE === */}
        <Text style={s.section}>BIOTECH MODE</Text>
        <View style={s.card}>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>🧬 Biotech Mode</Text>
              <Text style={s.ctaDesc}>PDUFA bosses, biotech trivia, FDA hints</Text>
            </View>
            <Switch
              value={biotechModeEnabled}
              onValueChange={toggleBiotechMode}
              trackColor={{ false: COLORS.bgCardLight, true: COLORS.frost + '50' }}
              thumbColor={biotechModeEnabled ? COLORS.frost : COLORS.textMuted}
            />
          </View>
          {biotechModeEnabled && (
            <>
              <View style={s.row}>
                <Text style={s.rowLabel}>Biotech Trivia Correct</Text>
                <Text style={[s.rowValue, { color: COLORS.frost }]}>{biotechTriviaCorrect}</Text>
              </View>
              <View style={s.row}>
                <Text style={s.rowLabel}>PDUFA Hints Unlocked</Text>
                <Text style={[s.rowValue, { color: COLORS.emerald }]}>{biotechHintsUnlocked}</Text>
              </View>
            </>
          )}
        </View>

        {/* === REFERRAL / SHARE === */}
        <Text style={s.section}>SHARE & EARN</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.row} onPress={handleReferralShare}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>📤 Share Your Streak</Text>
              <Text style={s.ctaDesc}>
                {odinBetaUnlocked
                  ? '✅ ODIN Beta Access Unlocked!'
                  : `Share ${3 - referralShareCount} more times for ODIN beta access`}
              </Text>
            </View>
            <Text style={s.ctaArrow}>→</Text>
          </TouchableOpacity>
          {referralCode ? (
            <View style={s.row}>
              <Text style={s.rowLabel}>Your Referral Code</Text>
              <Text style={[s.rowValue, { color: COLORS.gold, fontWeight: '800', fontFamily: 'monospace' }]}>
                {referralCode}
              </Text>
            </View>
          ) : null}
          <View style={s.row}>
            <Text style={s.rowLabel}>Referral Shares</Text>
            <Text style={s.rowValue}>{referralShareCount}</Text>
          </View>
        </View>

        {/* About */}
        <Text style={s.section}>ABOUT</Text>
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.rowLabel}>Version</Text>
            <Text style={s.rowValue}>1.2.0</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Built by</Text>
            <Text style={s.rowValue}>ODIN Labs</Text>
          </View>
          <View style={s.row}>
            <Text style={s.rowLabel}>Platform</Text>
            <Text style={[s.rowValue, { color: COLORS.frost }]}>pdufa.bio</Text>
          </View>
        </View>

        {/* ODIN Platform CTAs */}
        <Text style={s.section}>ODIN PLATFORM</Text>
        <View style={s.card}>
          <TouchableOpacity
            style={s.row}
            onPress={() => Linking.openURL('https://pdufa.bio')}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>👁️ Visit pdufa.bio</Text>
              <Text style={s.ctaDesc}>FDA catalyst intelligence · 96% accuracy</Text>
            </View>
            <Text style={s.ctaArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.row}
            onPress={() => Linking.openURL('https://pdufa.bio/#waitlist')}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>📧 Join the Waitlist</Text>
              <Text style={s.ctaDesc}>Early access to ODIN scoring alerts</Text>
            </View>
            <Text style={s.ctaArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.row}
            onPress={() => Linking.openURL('https://pdufa.bio/mobile')}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>📱 Download ODIN Mobile</Text>
              <Text style={s.ctaDesc}>PDUFA dates + push alerts on the go</Text>
            </View>
            <Text style={s.ctaArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Branding */}
        <View style={s.branding}>
          <Text style={s.brandEmoji}>👁️</Text>
          <Text style={s.brandName}>RISE by ODIN</Text>
          <Text style={s.brandTag}>Conquer Your Morning</Text>
          <Text style={s.brandSub}>Part of the ODIN Intelligence Platform</Text>
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
  brandSub: { color: COLORS.textMuted, fontSize: 11, marginTop: 8 },
  // CTA styles
  ctaDesc: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  ctaArrow: { color: COLORS.frost, fontSize: 20, fontWeight: '700' },
});
