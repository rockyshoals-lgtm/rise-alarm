import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../theme';

export default function ProBadge() {
  return (
    <View style={s.badge}>
      <Text style={s.text}>PRO</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    backgroundColor: COLORS.gold + '20',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  text: {
    color: COLORS.gold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
