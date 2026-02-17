/**
 * AdBanner — placeholder ad banner for free tier users.
 * Pro users see nothing. Swap inner content to real AdMob BannerAd later.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../../theme';
import { useProStore } from '../../stores/proStore';

interface AdBannerProps {
  style?: ViewStyle;
  onUpgradePress?: () => void;
}

export default function AdBanner({ style, onUpgradePress }: AdBannerProps) {
  const isPro = useProStore((s) => s.isProActive());

  if (isPro) return null;

  return (
    <TouchableOpacity
      style={[s.container, style]}
      onPress={onUpgradePress}
      activeOpacity={0.7}
    >
      <View style={s.accentBar} />
      <View style={s.content}>
        <Text style={s.adLabel}>AD</Text>
        <Text style={s.text}>Support Rise — Go Pro to remove ads</Text>
        <Text style={s.arrow}>{'>'}</Text>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    flexDirection: 'row',
    height: 52,
  },
  accentBar: {
    width: 3,
    backgroundColor: COLORS.goldDark,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  adLabel: {
    color: COLORS.goldDark,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    backgroundColor: COLORS.goldDark + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 10,
  },
  text: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: 12,
  },
  arrow: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
});
