/**
 * ProUpsellCard — shows upgrade benefits and CTA for free tier users.
 * Hidden when user is already Pro.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../theme';
import { useProStore } from '../../stores/proStore';

interface ProUpsellCardProps {
  onUpgrade?: () => void;
}

export default function ProUpsellCard({ onUpgrade }: ProUpsellCardProps) {
  const { isPro, activatePro } = useProStore();

  if (isPro) return null;

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Default: activate Pro locally (swap to real IAP later)
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + 1);
      activatePro('subscription', expiry.toISOString().split('T')[0]);
    }
  };

  return (
    <View style={s.card}>
      <Text style={s.title}>Upgrade to Rise Pro</Text>

      <View style={s.benefitRow}>
        <Text style={s.benefitIcon}>{'🚫'}</Text>
        <Text style={s.benefitText}>No ads — clean experience</Text>
      </View>
      <View style={s.benefitRow}>
        <Text style={s.benefitIcon}>{'💰'}</Text>
        <Text style={s.benefitText}>2x coin multiplier on all rewards</Text>
      </View>
      <View style={s.benefitRow}>
        <Text style={s.benefitIcon}>{'🎁'}</Text>
        <Text style={s.benefitText}>2 grace tokens per month (instead of 1)</Text>
      </View>
      <View style={s.benefitRow}>
        <Text style={s.benefitIcon}>{'⚡'}</Text>
        <Text style={s.benefitText}>Exclusive Pro challenges & badges</Text>
      </View>

      <TouchableOpacity style={s.upgradeBtn} onPress={handleUpgrade} activeOpacity={0.7}>
        <Text style={s.upgradeBtnText}>Upgrade — $2.99/month</Text>
      </TouchableOpacity>

      <Text style={s.disclaimer}>Cancel anytime. In-app purchase coming soon.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.gold + '40',
  },
  title: {
    color: COLORS.gold,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  benefitIcon: {
    fontSize: 16,
    width: 28,
  },
  benefitText: {
    color: COLORS.text,
    fontSize: 14,
    flex: 1,
  },
  upgradeBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  upgradeBtnText: {
    color: COLORS.bg,
    fontSize: 15,
    fontWeight: '800',
  },
  disclaimer: {
    color: COLORS.textMuted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 10,
  },
});
