import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../../theme';

interface Props {
  onComplete: (success: boolean) => void;
}

const SYMBOLS = ['⚔️', '🛡️', '🔥', '❄️', '⚡', '🐺', '🐍', '🌙'];

function generateCards(pairs: number): { id: number; symbol: string }[] {
  const selected = SYMBOLS.slice(0, pairs);
  const cards = [...selected, ...selected].map((symbol, i) => ({ id: i, symbol }));
  return cards.sort(() => Math.random() - 0.5);
}

export default function MemoryMatch({ onComplete }: Props) {
  const pairs = 4; // 4 pairs = 8 cards
  const [cards] = useState(() => generateCards(pairs));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(45);
  const [checking, setChecking] = useState(false);

  // Timer
  useEffect(() => {
    if (matched.size === cards.length) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          onComplete(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [matched.size]);

  // Check for match
  useEffect(() => {
    if (flipped.length === 2) {
      setChecking(true);
      const [a, b] = flipped;
      if (cards[a].symbol === cards[b].symbol) {
        setTimeout(() => {
          setMatched((prev) => new Set([...prev, a, b]));
          setFlipped([]);
          setChecking(false);
        }, 300);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setChecking(false);
        }, 800);
      }
    }
  }, [flipped]);

  // Check win
  useEffect(() => {
    if (matched.size === cards.length && cards.length > 0) {
      setTimeout(() => onComplete(true), 500);
    }
  }, [matched.size]);

  const handleFlip = (index: number) => {
    if (checking || flipped.includes(index) || matched.has(index) || flipped.length >= 2) return;
    setFlipped((f) => [...f, index]);
  };

  const timerColor = timeLeft <= 10 ? COLORS.fire : timeLeft <= 20 ? COLORS.gold : COLORS.frost;
  const isFlipped = (i: number) => flipped.includes(i) || matched.has(i);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.label}>🧠 MEMORY RUNES</Text>
        <Text style={[s.timer, { color: timerColor }]}>{timeLeft}s</Text>
      </View>

      <Text style={s.subtitle}>Match {pairs} pairs</Text>

      <View style={s.grid}>
        {cards.map((card, i) => {
          const revealed = isFlipped(i);
          const isMatched = matched.has(i);
          return (
            <TouchableOpacity
              key={card.id}
              style={[
                s.card,
                revealed && { backgroundColor: isMatched ? COLORS.emerald + '30' : COLORS.bgCardLight },
                isMatched && { borderColor: COLORS.emerald },
              ]}
              onPress={() => handleFlip(i)}
              disabled={revealed}
              activeOpacity={0.7}
            >
              <Text style={s.cardText}>{revealed ? card.symbol : '◆'}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={s.progress}>
        {matched.size / 2} / {pairs} pairs found
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  label: { color: COLORS.frostGlow, fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  timer: { fontSize: 24, fontWeight: '700', fontFamily: 'monospace' },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  card: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: { fontSize: 28 },
  progress: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 20, fontWeight: '600' },
});
