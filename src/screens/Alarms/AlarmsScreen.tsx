import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet, Switch, Modal,
  ScrollView, Platform, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme';
import {
  useAlarmStore, formatTime, DAY_LABELS, createDefaultAlarm,
  ROUTINE_TASKS,
  type Alarm, type ChallengeType, type Difficulty, type BriefingPersona
} from '../../stores/alarmStore';
import { usePlayerStore } from '../../stores/playerStore';
import XPBar from '../../components/Common/XPBar';
import BossWidget from '../../components/Common/BossWidget';
import AdBanner from '../../components/Common/AdBanner';

const CHALLENGE_OPTIONS: { type: ChallengeType; label: string; emoji: string }[] = [
  { type: 'math', label: 'Rune Math', emoji: '⚡' },
  { type: 'trivia', label: 'Wisdom Test', emoji: '📚' },
  { type: 'shake', label: 'Shake Fury', emoji: '📳' },
  { type: 'memory', label: 'Memory Runes', emoji: '🧠' },
  { type: 'typing', label: 'Scribe Trial', emoji: '✍️' },
  { type: 'steps', label: 'March of Dawn', emoji: '🏃' },
  { type: 'social', label: 'Friend\'s Voice', emoji: '👥' },
];

const DIFFICULTY_OPTIONS: Difficulty[] = ['easy', 'medium', 'hard', 'viking'];
const WAKE_PROOF_DELAYS = [3, 5, 10, 15]; // minutes
const SMART_WAKE_WINDOWS = [15, 20, 30, 45]; // minutes
const PERSONA_OPTIONS: { id: BriefingPersona; label: string; emoji: string }[] = [
  { id: 'drill_sergeant', label: 'Drill Sergeant', emoji: '🎖️' },
  { id: 'wise_elder', label: 'Wise Elder', emoji: '🧙' },
  { id: 'cheerful_coach', label: 'Cheerful Coach', emoji: '🏋️' },
];

export default function AlarmsScreen() {
  const { alarms, addAlarm, updateAlarm, deleteAlarm, toggleAlarm, setActiveAlarm, startSleepMode } = useAlarmStore();
  const { currentStreak, coins, recommendedDifficulty } = usePlayerStore();
  const [editModal, setEditModal] = useState(false);
  const [editAlarm, setEditAlarm] = useState<Alarm | null>(null);
  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(0);
  const [label, setLabel] = useState('');
  const [days, setDays] = useState([false, true, true, true, true, true, false]);
  const [challenges, setChallenges] = useState<ChallengeType[]>(['math', 'trivia']);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [challengeCount, setChallengeCount] = useState(2);
  const [snoozeLimit, setSnoozeLimit] = useState(2);
  // New v1.1 fields
  const [wakeProofEnabled, setWakeProofEnabled] = useState(true);
  const [wakeProofDelay, setWakeProofDelay] = useState(5);
  const [morningRoutine, setMorningRoutine] = useState<string[]>(['water', 'stretch']);
  // Smart Wake + Briefing fields
  const [smartWakeEnabled, setSmartWakeEnabled] = useState(false);
  const [smartWakeWindowMin, setSmartWakeWindowMin] = useState(30);
  const [morningBriefingEnabled, setMorningBriefingEnabled] = useState(true);
  const [briefingPersona, setBriefingPersona] = useState<BriefingPersona>('cheerful_coach');

  const openNewAlarm = () => {
    setEditAlarm(null);
    setHour(7);
    setMinute(0);
    setLabel('');
    setDays([false, true, true, true, true, true, false]);
    setChallenges(['math', 'trivia']);
    setDifficulty('medium');
    setChallengeCount(2);
    setSnoozeLimit(2);
    setWakeProofEnabled(true);
    setWakeProofDelay(5);
    setMorningRoutine(['water', 'stretch']);
    setSmartWakeEnabled(false);
    setSmartWakeWindowMin(30);
    setMorningBriefingEnabled(true);
    setBriefingPersona('cheerful_coach');
    setEditModal(true);
  };

  const openEditAlarm = (alarm: Alarm) => {
    setEditAlarm(alarm);
    setHour(alarm.hour);
    setMinute(alarm.minute);
    setLabel(alarm.label);
    setDays([...alarm.days]);
    setChallenges([...alarm.challenges]);
    setDifficulty(alarm.difficulty);
    setChallengeCount(alarm.challengeCount);
    setSnoozeLimit(alarm.snoozeLimit);
    setWakeProofEnabled(alarm.wakeProofEnabled ?? true);
    setWakeProofDelay(alarm.wakeProofDelayMin ?? 5);
    setMorningRoutine([...(alarm.morningRoutine || ['water', 'stretch'])]);
    setSmartWakeEnabled(alarm.smartWakeEnabled ?? false);
    setSmartWakeWindowMin(alarm.smartWakeWindowMin ?? 30);
    setMorningBriefingEnabled(alarm.morningBriefingEnabled ?? true);
    setBriefingPersona(alarm.briefingPersona ?? 'cheerful_coach');
    setEditModal(true);
  };

  const saveAlarm = () => {
    const data = {
      hour, minute, label, enabled: true, days,
      challenges, challengeCount, difficulty, snoozeLimit,
      vibrate: true, sound: 'viking_horn',
      wakeProofEnabled,
      wakeProofDelayMin: wakeProofDelay,
      morningRoutine,
      smartWakeEnabled,
      smartWakeWindowMin,
      morningBriefingEnabled,
      briefingPersona,
    };
    if (editAlarm) {
      updateAlarm(editAlarm.id, data);
    } else {
      addAlarm(data);
    }
    setEditModal(false);
  };

  const toggleDay = (i: number) => {
    const newDays = [...days];
    newDays[i] = !newDays[i];
    setDays(newDays);
  };

  const toggleChallenge = (type: ChallengeType) => {
    if (challenges.includes(type)) {
      if (challenges.length > 1) setChallenges(challenges.filter((c) => c !== type));
    } else {
      setChallenges([...challenges, type]);
    }
  };

  const toggleRoutineTask = (taskId: string) => {
    if (morningRoutine.includes(taskId)) {
      setMorningRoutine(morningRoutine.filter((t) => t !== taskId));
    } else {
      setMorningRoutine([...morningRoutine, taskId]);
    }
  };

  const testAlarm = (alarm: Alarm) => {
    setActiveAlarm(alarm.id);
  };

  const renderAlarm = ({ item }: { item: Alarm }) => {
    const activeDays = item.days.map((d, i) => d ? DAY_LABELS[i] : null).filter(Boolean).join(' ');
    const allChallengeOptions = CHALLENGE_OPTIONS;
    return (
      <TouchableOpacity style={s.alarmCard} onPress={() => openEditAlarm(item)} activeOpacity={0.7}>
        <View style={s.alarmLeft}>
          <Text style={[s.time, !item.enabled && { opacity: 0.4 }]}>{formatTime(item.hour, item.minute)}</Text>
          <Text style={s.alarmLabel}>{item.label || activeDays || 'One-time'}</Text>
          <View style={s.challengeTags}>
            {item.challenges.map((c) => {
              const opt = allChallengeOptions.find((o) => o.type === c);
              return (
                <Text key={c} style={s.tag}>{opt?.emoji} {opt?.label}</Text>
              );
            })}
            {item.wakeProofEnabled && (
              <Text style={[s.tag, { borderColor: COLORS.frost + '40' }]}>🛡️ Wake Proof</Text>
            )}
            {item.smartWakeEnabled && (
              <Text style={[s.tag, { borderColor: COLORS.purple + '40' }]}>😴 Smart Wake {item.smartWakeWindowMin}m</Text>
            )}
            {item.morningBriefingEnabled && (
              <Text style={[s.tag, { borderColor: COLORS.emerald + '40' }]}>🗣️ Briefing</Text>
            )}
          </View>
        </View>
        <View style={s.alarmRight}>
          <Switch
            value={item.enabled}
            onValueChange={() => toggleAlarm(item.id)}
            trackColor={{ false: COLORS.bgCardLight, true: COLORS.gold + '50' }}
            thumbColor={item.enabled ? COLORS.gold : COLORS.textMuted}
          />
          <TouchableOpacity style={s.testBtn} onPress={() => testAlarm(item)}>
            <Text style={s.testText}>TEST</Text>
          </TouchableOpacity>
          {item.smartWakeEnabled && (
            <TouchableOpacity style={s.sleepBtn} onPress={() => startSleepMode(item.id)}>
              <Text style={s.sleepText}>😴 SLEEP</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        {/* Header */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.appName}>RISE</Text>
            <Text style={s.subtitle}>Conquer Your Morning</Text>
          </View>
          <View style={s.statsRow}>
            <Text style={s.statItem}>🔥 {currentStreak}</Text>
            <Text style={s.statItem}>💰 {coins}</Text>
          </View>
        </View>

        <XPBar />

        {/* Adaptive Difficulty Recommendation */}
        {recommendedDifficulty && recommendedDifficulty !== 'medium' && (
          <View style={s.recBanner}>
            <Text style={s.recText}>
              🎯 Recommended: <Text style={s.recValue}>{recommendedDifficulty.toUpperCase()}</Text> difficulty
            </Text>
          </View>
        )}

        {/* Boss Widget */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <BossWidget />
        </View>

        {/* Ad Banner */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <AdBanner />
        </View>

        {/* Alarms */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>⏰ ALARMS</Text>
          <TouchableOpacity style={s.addBtn} onPress={openNewAlarm}>
            <Text style={s.addText}>+ NEW</Text>
          </TouchableOpacity>
        </View>

        {alarms.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>⏰</Text>
            <Text style={s.emptyText}>No alarms yet</Text>
            <Text style={s.emptySubtext}>Tap + NEW to create your first alarm</Text>
          </View>
        ) : (
          alarms.map((alarm) => (
            <View key={alarm.id} style={{ paddingHorizontal: 16, marginBottom: 10 }}>
              {renderAlarm({ item: alarm })}
            </View>
          ))
        )}
      </ScrollView>

      {/* Edit/Create Modal */}
      <Modal visible={editModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <ScrollView>
              <Text style={s.modalTitle}>{editAlarm ? 'Edit Alarm' : 'New Alarm'}</Text>

              {/* Time Picker */}
              <View style={s.timePickerRow}>
                <TouchableOpacity onPress={() => setHour((h) => (h + 1) % 24)} style={s.timeBtn}>
                  <Text style={s.timeBtnText}>▲</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setMinute((m) => (m + 5) % 60)} style={s.timeBtn}>
                  <Text style={s.timeBtnText}>▲</Text>
                </TouchableOpacity>
              </View>
              <Text style={s.bigTime}>{formatTime(hour, minute)}</Text>
              <View style={s.timePickerRow}>
                <TouchableOpacity onPress={() => setHour((h) => (h - 1 + 24) % 24)} style={s.timeBtn}>
                  <Text style={s.timeBtnText}>▼</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setMinute((m) => (m - 5 + 60) % 60)} style={s.timeBtn}>
                  <Text style={s.timeBtnText}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* Days */}
              <Text style={s.fieldLabel}>Repeat Days</Text>
              <View style={s.daysRow}>
                {DAY_LABELS.map((d, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[s.dayBtn, days[i] && s.dayBtnActive]}
                    onPress={() => toggleDay(i)}
                  >
                    <Text style={[s.dayText, days[i] && s.dayTextActive]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Challenges — now 6 types */}
              <Text style={s.fieldLabel}>Dismiss Challenges</Text>
              <View style={s.challengeRow}>
                {CHALLENGE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.type}
                    style={[s.challengeBtn, challenges.includes(opt.type) && s.challengeBtnActive]}
                    onPress={() => toggleChallenge(opt.type)}
                  >
                    <Text style={s.challengeEmoji}>{opt.emoji}</Text>
                    <Text style={[s.challengeLabel, challenges.includes(opt.type) && { color: COLORS.text }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Difficulty */}
              <Text style={s.fieldLabel}>Difficulty</Text>
              <View style={s.daysRow}>
                {DIFFICULTY_OPTIONS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[s.diffBtn, difficulty === d && s.diffBtnActive]}
                    onPress={() => setDifficulty(d)}
                  >
                    <Text style={[s.diffText, difficulty === d && { color: COLORS.bg }]}>
                      {d.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Challenge Count */}
              <Text style={s.fieldLabel}>Challenges to Solve: {challengeCount}</Text>
              <View style={s.daysRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[s.dayBtn, challengeCount === n && s.dayBtnActive]}
                    onPress={() => setChallengeCount(n)}
                  >
                    <Text style={[s.dayText, challengeCount === n && s.dayTextActive]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Snooze Limit */}
              <Text style={s.fieldLabel}>Snooze Limit: {snoozeLimit === 0 ? 'None' : snoozeLimit}</Text>
              <View style={s.daysRow}>
                {[0, 1, 2, 3].map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[s.dayBtn, snoozeLimit === n && s.dayBtnActive]}
                    onPress={() => setSnoozeLimit(n)}
                  >
                    <Text style={[s.dayText, snoozeLimit === n && s.dayTextActive]}>
                      {n === 0 ? '🚫' : n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* === WAKE PROOF === */}
              <Text style={s.fieldLabel}>🛡️ Wake Proof (Post-Dismissal Check)</Text>
              <View style={s.wakeProofToggle}>
                <Text style={s.wakeProofText}>
                  {wakeProofEnabled ? 'Enabled — re-check after dismissal' : 'Disabled'}
                </Text>
                <Switch
                  value={wakeProofEnabled}
                  onValueChange={setWakeProofEnabled}
                  trackColor={{ false: COLORS.bgCardLight, true: COLORS.frost + '50' }}
                  thumbColor={wakeProofEnabled ? COLORS.frost : COLORS.textMuted}
                />
              </View>
              {wakeProofEnabled && (
                <>
                  <Text style={s.subLabel}>Re-check after (minutes):</Text>
                  <View style={s.daysRow}>
                    {WAKE_PROOF_DELAYS.map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[s.dayBtn, wakeProofDelay === d && s.dayBtnActive]}
                        onPress={() => setWakeProofDelay(d)}
                      >
                        <Text style={[s.dayText, wakeProofDelay === d && s.dayTextActive]}>{d}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* === MORNING ROUTINE === */}
              <Text style={s.fieldLabel}>🌅 Morning Routine Tasks</Text>
              <Text style={s.subLabel}>Select tasks to complete after alarm dismissal</Text>
              <View style={s.routineGrid}>
                {ROUTINE_TASKS.map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={[
                      s.routineChip,
                      morningRoutine.includes(task.id) && s.routineChipActive,
                    ]}
                    onPress={() => toggleRoutineTask(task.id)}
                  >
                    <Text style={s.routineEmoji}>{task.emoji}</Text>
                    <Text style={[
                      s.routineLabel,
                      morningRoutine.includes(task.id) && { color: COLORS.text },
                    ]}>
                      {task.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* === SMART WAKE === */}
              <Text style={s.fieldLabel}>😴 Smart-Wake Window</Text>
              <View style={s.wakeProofToggle}>
                <Text style={s.wakeProofText}>
                  {smartWakeEnabled ? `Detect light sleep ${smartWakeWindowMin}m before alarm` : 'Disabled'}
                </Text>
                <Switch
                  value={smartWakeEnabled}
                  onValueChange={setSmartWakeEnabled}
                  trackColor={{ false: COLORS.bgCardLight, true: COLORS.purple + '50' }}
                  thumbColor={smartWakeEnabled ? COLORS.purple : COLORS.textMuted}
                />
              </View>
              {smartWakeEnabled && (
                <>
                  <Text style={s.subLabel}>Wake window (minutes before alarm):</Text>
                  <View style={s.daysRow}>
                    {SMART_WAKE_WINDOWS.map((w) => (
                      <TouchableOpacity
                        key={w}
                        style={[s.dayBtn, smartWakeWindowMin === w && { backgroundColor: COLORS.purple, borderColor: COLORS.purple }]}
                        onPress={() => setSmartWakeWindowMin(w)}
                      >
                        <Text style={[s.dayText, smartWakeWindowMin === w && s.dayTextActive]}>{w}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* === MORNING BRIEFING === */}
              <Text style={s.fieldLabel}>🗣️ Morning Briefing (AI Voice)</Text>
              <View style={s.wakeProofToggle}>
                <Text style={s.wakeProofText}>
                  {morningBriefingEnabled ? 'Personalized TTS after victory' : 'Disabled'}
                </Text>
                <Switch
                  value={morningBriefingEnabled}
                  onValueChange={setMorningBriefingEnabled}
                  trackColor={{ false: COLORS.bgCardLight, true: COLORS.emerald + '50' }}
                  thumbColor={morningBriefingEnabled ? COLORS.emerald : COLORS.textMuted}
                />
              </View>
              {morningBriefingEnabled && (
                <>
                  <Text style={s.subLabel}>Voice Persona:</Text>
                  <View style={s.challengeRow}>
                    {PERSONA_OPTIONS.map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        style={[s.challengeBtn, briefingPersona === p.id && { borderColor: COLORS.emerald, backgroundColor: COLORS.emerald + '20' }]}
                        onPress={() => setBriefingPersona(p.id)}
                      >
                        <Text style={s.challengeEmoji}>{p.emoji}</Text>
                        <Text style={[s.challengeLabel, briefingPersona === p.id && { color: COLORS.text }]}>{p.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Actions */}
              <View style={s.modalActions}>
                {editAlarm && (
                  <TouchableOpacity
                    style={s.deleteBtn}
                    onPress={() => { deleteAlarm(editAlarm.id); setEditModal(false); }}
                  >
                    <Text style={s.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={s.cancelBtn} onPress={() => setEditModal(false)}>
                  <Text style={s.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={saveAlarm}>
                  <Text style={s.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  appName: { color: COLORS.gold, fontSize: 28, fontWeight: '800', letterSpacing: 3 },
  subtitle: { color: COLORS.textSecondary, fontSize: 11, letterSpacing: 1, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statItem: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  // Recommendation banner
  recBanner: {
    backgroundColor: COLORS.gold + '15',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gold + '30',
  },
  recText: { color: COLORS.textSecondary, fontSize: 12, textAlign: 'center' },
  recValue: { color: COLORS.gold, fontWeight: '800' },
  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  addBtn: { backgroundColor: COLORS.gold, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  addText: { color: COLORS.bg, fontSize: 12, fontWeight: '700' },
  // Alarm card
  alarmCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  alarmLeft: { flex: 1 },
  alarmRight: { alignItems: 'center', gap: 8 },
  time: { color: COLORS.text, fontSize: 36, fontWeight: '700', fontFamily: 'monospace' },
  alarmLabel: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  challengeTags: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  tag: { color: COLORS.textMuted, fontSize: 10, backgroundColor: COLORS.bgCardLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  testBtn: { borderWidth: 1, borderColor: COLORS.frost, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  testText: { color: COLORS.frost, fontSize: 10, fontWeight: '700' },
  sleepBtn: { borderWidth: 1, borderColor: COLORS.purple, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  sleepText: { color: COLORS.purple, fontSize: 10, fontWeight: '700' },
  // Empty
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: COLORS.textSecondary, fontSize: 18, fontWeight: '600' },
  emptySubtext: { color: COLORS.textMuted, fontSize: 13, marginTop: 4 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.bgSurface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalTitle: { color: COLORS.text, fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  // Time picker
  timePickerRow: { flexDirection: 'row', justifyContent: 'center', gap: 60 },
  timeBtn: { padding: 12 },
  timeBtnText: { color: COLORS.frost, fontSize: 24 },
  bigTime: { color: COLORS.text, fontSize: 56, fontWeight: '700', textAlign: 'center', fontFamily: 'monospace', marginVertical: 8 },
  // Fields
  fieldLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 20, marginBottom: 10 },
  subLabel: { color: COLORS.textMuted, fontSize: 11, marginBottom: 8 },
  daysRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', flexWrap: 'wrap' },
  dayBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.bgCardLight, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  dayBtnActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  dayText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  dayTextActive: { color: COLORS.bg, fontWeight: '700' },
  challengeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  challengeBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.bgCardLight, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', width: '30%' },
  challengeBtnActive: { borderColor: COLORS.gold, backgroundColor: COLORS.gold + '20' },
  challengeEmoji: { fontSize: 20, marginBottom: 4 },
  challengeLabel: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '600' },
  diffBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: COLORS.bgCardLight, borderWidth: 1, borderColor: COLORS.border },
  diffBtnActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  diffText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700' },
  // Wake Proof
  wakeProofToggle: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.bgCardLight, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  wakeProofText: { color: COLORS.textSecondary, fontSize: 13, flex: 1 },
  // Morning Routine
  routineGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  routineChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10,
    backgroundColor: COLORS.bgCardLight, borderWidth: 1, borderColor: COLORS.border,
    width: '47%',
  },
  routineChipActive: { borderColor: COLORS.emerald, backgroundColor: COLORS.emerald + '15' },
  routineEmoji: { fontSize: 16 },
  routineLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' },
  // Actions
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 24, justifyContent: 'flex-end' },
  deleteBtn: { backgroundColor: COLORS.fire + '20', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.fire },
  deleteBtnText: { color: COLORS.fire, fontWeight: '700' },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  cancelText: { color: COLORS.textSecondary, fontWeight: '600' },
  saveBtn: { backgroundColor: COLORS.gold, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  saveText: { color: COLORS.bg, fontWeight: '700' },
});
