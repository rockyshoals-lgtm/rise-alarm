import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [volume, setVolume] = useState(80);
  const [gradualVolume, setGradualVolume] = useState(true);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>⚙️ SETTINGS</Text>

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

        {/* Game Settings */}
        <Text style={s.section}>GAME</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.row}>
            <Text style={s.rowLabel}>Default Difficulty</Text>
            <Text style={s.rowValue}>Medium</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.row}>
            <Text style={s.rowLabel}>Default Challenges</Text>
            <Text style={s.rowValue}>2</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <Text style={s.section}>ABOUT</Text>
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.rowLabel}>Version</Text>
            <Text style={s.rowValue}>1.0.0</Text>
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
});
