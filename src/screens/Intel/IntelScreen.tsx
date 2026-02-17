import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, TextInput, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme';
import { usePlayerStore } from '../../stores/playerStore';
import { getBossForWeek, getWeekNumber } from '../../data/bosses';
import AdBanner from '../../components/Common/AdBanner';

// Simulated upcoming PDUFA dates — teasers to drive users to pdufa.bio
const UPCOMING_CATALYSTS = [
  { ticker: '????', indication: 'Oncology', phase: 'NDA', daysUntil: 3, tier: 'S', score: 92, blurred: true },
  { ticker: '????', indication: 'Rare Disease', phase: 'BLA', daysUntil: 7, tier: 'A', score: 85, blurred: true },
  { ticker: '????', indication: 'CNS', phase: 'NDA', daysUntil: 12, tier: 'A', score: 78, blurred: true },
  { ticker: '????', indication: 'Immunology', phase: 'sNDA', daysUntil: 18, tier: 'B', score: 71, blurred: true },
  { ticker: '????', indication: 'Cardiovascular', phase: 'NDA', daysUntil: 24, tier: 'B', score: 65, blurred: true },
  { ticker: '????', indication: 'Anti-Infective', phase: 'BLA', daysUntil: 31, tier: 'C', score: 58, blurred: true },
];

const ODIN_FACTS = [
  'ODIN has scored 50+ PDUFA events with 96.0% accuracy',
  'The ODIN scoring engine uses 63 weighted parameters',
  'PDUFA dates are the #1 binary catalyst in biotech investing',
  'Only ~14% of drugs entering Phase 1 trials eventually get approved',
  'A Complete Response Letter (CRL) can drop a stock 40-80% overnight',
  'Priority Review cuts FDA review time from 10 months to 6 months',
  'Breakthrough Therapy designation has ~85% historical approval rate',
  'Advisory Committee (AdCom) votes correctly predict ~90% of FDA decisions',
  'ODIN tiers range from S (highest conviction) to D (highest risk)',
  'The average biotech PDUFA catalyst moves a stock 30-60% in either direction',
];

export default function IntelScreen() {
  const { level, title, coins } = usePlayerStore();
  const boss = getBossForWeek(getWeekNumber());
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [factIndex, setFactIndex] = useState(0);

  // Rotate ODIN facts
  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex((i) => (i + 1) % ODIN_FACTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const openPdufa = () => Linking.openURL('https://pdufa.bio');
  const openOdinMobile = () => Linking.openURL('https://pdufa.bio/mobile');

  const handleSignup = () => {
    if (email.includes('@')) {
      // In production, POST to pdufa.bio/api/waitlist
      setSubmitted(true);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.eye}>👁️</Text>
          <Text style={s.title}>ODIN INTEL</Text>
          <Text style={s.subtitle}>FDA Catalyst Intelligence</Text>
        </View>

        {/* Rotating Fact */}
        <View style={s.factCard}>
          <Text style={s.factIcon}>⚡</Text>
          <Text style={s.factText}>{ODIN_FACTS[factIndex]}</Text>
        </View>

        {/* Ad Banner */}
        <AdBanner />

        {/* === CTA #1: Visit pdufa.bio === */}
        <TouchableOpacity style={s.ctaCard} onPress={openPdufa} activeOpacity={0.8}>
          <View style={s.ctaGlow} />
          <Text style={s.ctaEmoji}>🔮</Text>
          <Text style={s.ctaTitle}>Explore PDUFA Catalysts</Text>
          <Text style={s.ctaDesc}>
            See upcoming FDA approval dates, ODIN scores, and tier rankings for biotech stocks
          </Text>
          <View style={s.ctaBtn}>
            <Text style={s.ctaBtnText}>Visit pdufa.bio →</Text>
          </View>
        </TouchableOpacity>

        {/* === Blurred PDUFA Feed Teaser === */}
        <Text style={s.sectionTitle}>UPCOMING PDUFA DATES</Text>
        <Text style={s.sectionHint}>Unlock full data at pdufa.bio</Text>

        {UPCOMING_CATALYSTS.map((cat, i) => (
          <View key={i} style={s.catalystRow}>
            <View style={s.catalystLeft}>
              <View style={[s.tierBadge, {
                backgroundColor: cat.tier === 'S' ? COLORS.gold + '30' :
                  cat.tier === 'A' ? COLORS.emerald + '30' :
                  cat.tier === 'B' ? COLORS.frost + '30' : COLORS.textMuted + '30',
              }]}>
                <Text style={[s.tierText, {
                  color: cat.tier === 'S' ? COLORS.gold :
                    cat.tier === 'A' ? COLORS.emerald :
                    cat.tier === 'B' ? COLORS.frost : COLORS.textMuted,
                }]}>{cat.tier}</Text>
              </View>
              <View>
                <Text style={s.catTicker}>{cat.ticker}</Text>
                <Text style={s.catIndication}>{cat.indication} • {cat.phase}</Text>
              </View>
            </View>
            <View style={s.catalystRight}>
              <Text style={s.catScore}>{cat.score}%</Text>
              <Text style={s.catDays}>{cat.daysUntil}d</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity style={s.unlockBtn} onPress={openPdufa} activeOpacity={0.7}>
          <Text style={s.unlockText}>🔓 Unlock Full PDUFA Calendar at pdufa.bio</Text>
        </TouchableOpacity>

        {/* === CTA #2: Email Signup / Waitlist === */}
        <Text style={s.sectionTitle}>JOIN THE ODIN NETWORK</Text>
        {!submitted ? (
          <View style={s.signupCard}>
            <Text style={s.signupTitle}>Get PDUFA Alerts</Text>
            <Text style={s.signupDesc}>
              Free weekly alerts on upcoming FDA catalysts, ODIN score updates, and high-conviction plays
            </Text>
            <View style={s.inputRow}>
              <TextInput
                style={s.input}
                placeholder="your@email.com"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity style={s.signupBtn} onPress={handleSignup}>
                <Text style={s.signupBtnText}>Join</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.signupHint}>No spam. Unsubscribe anytime.</Text>
          </View>
        ) : (
          <View style={s.signupCard}>
            <Text style={s.signupSuccess}>✓ You're on the list!</Text>
            <Text style={s.signupDesc}>
              Watch your inbox for ODIN intel drops.
            </Text>
          </View>
        )}

        {/* === CTA #3: ODIN Mobile === */}
        <Text style={s.sectionTitle}>ODIN MOBILE APP</Text>
        <TouchableOpacity style={s.mobileCard} onPress={openOdinMobile} activeOpacity={0.8}>
          <Text style={s.mobileEmoji}>📱</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.mobileTitle}>Get ODIN Mobile</Text>
            <Text style={s.mobileDesc}>
              Real-time PDUFA tracking, push alerts, ODIN scores, portfolio catalyst calendar — all on your phone
            </Text>
          </View>
          <Text style={s.mobileArrow}>→</Text>
        </TouchableOpacity>

        {/* === Boss Lore (PDUFA themed) === */}
        <Text style={s.sectionTitle}>THIS WEEK'S INTEL</Text>
        <View style={s.loreCard}>
          <Text style={s.loreEmoji}>{boss.emoji}</Text>
          <Text style={s.loreName}>{boss.name} — {boss.title}</Text>
          <Text style={s.loreText}>{boss.lore}</Text>
        </View>

        {/* ODIN Scoring Engine Teaser */}
        <View style={s.engineCard}>
          <Text style={s.engineTitle}>⚡ ODIN SCORING ENGINE</Text>
          <View style={s.engineStats}>
            <View style={s.engineStat}>
              <Text style={s.engineVal}>96.0%</Text>
              <Text style={s.engineLabel}>Accuracy</Text>
            </View>
            <View style={s.engineStat}>
              <Text style={s.engineVal}>63</Text>
              <Text style={s.engineLabel}>Parameters</Text>
            </View>
            <View style={s.engineStat}>
              <Text style={s.engineVal}>50+</Text>
              <Text style={s.engineLabel}>Events Scored</Text>
            </View>
          </View>
          <TouchableOpacity style={s.engineBtn} onPress={openPdufa}>
            <Text style={s.engineBtnText}>See Live ODIN Scores →</Text>
          </TouchableOpacity>
        </View>

        {/* Footer branding */}
        <View style={s.footer}>
          <Text style={s.footerLogo}>👁️ ODIN</Text>
          <Text style={s.footerText}>Biotech Catalyst Intelligence Platform</Text>
          <Text style={s.footerUrl}>pdufa.bio</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingBottom: 100 },
  // Header
  header: { alignItems: 'center', paddingVertical: 20 },
  eye: { fontSize: 40, marginBottom: 8 },
  title: { color: COLORS.gold, fontSize: 26, fontWeight: '800', letterSpacing: 3 },
  subtitle: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4, letterSpacing: 1 },
  // Rotating fact
  factCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: COLORS.gold + '30', marginBottom: 20,
  },
  factIcon: { fontSize: 20 },
  factText: { color: COLORS.textSecondary, fontSize: 12, flex: 1, lineHeight: 18 },
  // CTA Card
  ctaCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 20, padding: 24,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.gold + '40',
    marginBottom: 24, overflow: 'hidden',
  },
  ctaGlow: {
    position: 'absolute', top: -40, left: '50%', marginLeft: -60,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: COLORS.gold, opacity: 0.06,
  },
  ctaEmoji: { fontSize: 36, marginBottom: 12 },
  ctaTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800', letterSpacing: 1, textAlign: 'center' },
  ctaDesc: { color: COLORS.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20, paddingHorizontal: 12 },
  ctaBtn: {
    backgroundColor: COLORS.gold, paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 12, marginTop: 16,
  },
  ctaBtnText: { color: COLORS.bg, fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  // Section
  sectionTitle: { color: COLORS.gold, fontSize: 13, fontWeight: '700', letterSpacing: 2, marginTop: 8, marginBottom: 6 },
  sectionHint: { color: COLORS.textMuted, fontSize: 11, marginBottom: 12 },
  // Catalyst rows
  catalystRow: {
    backgroundColor: COLORS.bgCard, borderRadius: 12, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 8,
  },
  catalystLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tierBadge: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  tierText: { fontSize: 16, fontWeight: '800' },
  catTicker: { color: COLORS.textMuted, fontSize: 15, fontWeight: '700', fontFamily: 'monospace', letterSpacing: 2 },
  catIndication: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  catalystRight: { alignItems: 'flex-end' },
  catScore: { color: COLORS.text, fontSize: 18, fontWeight: '800', fontFamily: 'monospace' },
  catDays: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  // Unlock button
  unlockBtn: {
    backgroundColor: COLORS.gold + '15', borderRadius: 12, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.gold + '30',
    marginTop: 8, marginBottom: 24,
  },
  unlockText: { color: COLORS.gold, fontSize: 13, fontWeight: '700' },
  // Signup
  signupCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 24,
  },
  signupTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginBottom: 6 },
  signupDesc: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: 16 },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1, backgroundColor: COLORS.bgCardLight, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    color: COLORS.text, fontSize: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  signupBtn: { backgroundColor: COLORS.gold, paddingHorizontal: 20, borderRadius: 10, justifyContent: 'center' },
  signupBtnText: { color: COLORS.bg, fontSize: 14, fontWeight: '700' },
  signupHint: { color: COLORS.textMuted, fontSize: 10, marginTop: 10, textAlign: 'center' },
  signupSuccess: { color: COLORS.emerald, fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  // ODIN Mobile
  mobileCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 18,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: COLORS.frost + '30', marginBottom: 24,
  },
  mobileEmoji: { fontSize: 32 },
  mobileTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  mobileDesc: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 18 },
  mobileArrow: { color: COLORS.frost, fontSize: 22, fontWeight: '700' },
  // Boss lore
  loreCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', marginBottom: 24,
  },
  loreEmoji: { fontSize: 40, marginBottom: 10 },
  loreName: { color: COLORS.text, fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  loreText: { color: COLORS.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 20, fontStyle: 'italic' },
  // Engine card
  engineCard: {
    backgroundColor: COLORS.bgCard, borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: COLORS.gold + '30', alignItems: 'center', marginBottom: 24,
  },
  engineTitle: { color: COLORS.gold, fontSize: 15, fontWeight: '800', letterSpacing: 2, marginBottom: 16 },
  engineStats: { flexDirection: 'row', gap: 20, marginBottom: 16 },
  engineStat: { alignItems: 'center' },
  engineVal: { color: COLORS.text, fontSize: 28, fontWeight: '800', fontFamily: 'monospace' },
  engineLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 4 },
  engineBtn: {
    backgroundColor: COLORS.gold, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10,
  },
  engineBtnText: { color: COLORS.bg, fontSize: 13, fontWeight: '700' },
  // Footer
  footer: { alignItems: 'center', paddingVertical: 24 },
  footerLogo: { color: COLORS.gold, fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  footerText: { color: COLORS.textMuted, fontSize: 11, marginTop: 4 },
  footerUrl: { color: COLORS.frost, fontSize: 13, fontWeight: '600', marginTop: 6 },
});
