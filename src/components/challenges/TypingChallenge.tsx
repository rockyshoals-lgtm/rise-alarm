import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS } from '../../theme';

interface Props {
  onComplete: (success: boolean) => void;
}

const QUOTES = [
  'The early bird catches the worm',
  'Rise and shine warrior',
  'Today I choose to be great',
  'Discipline is the bridge between goals and accomplishment',
  'Victory belongs to the most persevering',
  'The only way to do great work is to love what you do',
  'Fortune favors the brave',
  'Wake up with determination go to bed with satisfaction',
  'Every morning brings new potential',
  'Strength does not come from winning',
  'I am the master of my fate',
  'The best time to start is now',
  'Courage is not the absence of fear',
  'A journey of a thousand miles begins with a single step',
  'Where there is a will there is a way',
  'From the ashes I rise stronger',
  'Odin gave his eye for wisdom',
];

export default function TypingChallenge({ onComplete }: Props) {
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [completed, setCompleted] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  useEffect(() => {
    if (completed) return;
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
  }, [completed]);

  useEffect(() => {
    if (input.toLowerCase().trim() === quote.toLowerCase() && !completed) {
      setCompleted(true);
      setTimeout(() => onComplete(true), 500);
    }
  }, [input, quote, completed]);

  // Color each character
  const renderQuote = () => {
    return quote.split('').map((char, i) => {
      let color = COLORS.textMuted;
      if (i < input.length) {
        color = input[i].toLowerCase() === char.toLowerCase() ? COLORS.emerald : COLORS.fire;
      } else if (i === input.length) {
        color = COLORS.text; // current position
      }
      return (
        <Text key={i} style={[s.quoteChar, { color }]}>
          {char}
        </Text>
      );
    });
  };

  const accuracy = input.length > 0
    ? Math.round(input.split('').filter((c, i) => i < quote.length && c.toLowerCase() === quote[i].toLowerCase()).length / input.length * 100)
    : 100;

  const timerColor = timeLeft <= 5 ? COLORS.fire : timeLeft <= 15 ? COLORS.gold : COLORS.frost;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.label}>✍️ SCRIBE TRIAL</Text>
        <Text style={[s.timer, { color: timerColor }]}>{timeLeft}s</Text>
      </View>

      <View style={s.quoteBox}>
        <Text style={s.quoteText}>{renderQuote()}</Text>
      </View>

      <TextInput
        ref={inputRef}
        style={s.input}
        value={input}
        onChangeText={setInput}
        placeholder="Type the quote above..."
        placeholderTextColor={COLORS.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!completed}
      />

      <View style={s.statsRow}>
        <Text style={s.stat}>{input.length}/{quote.length} chars</Text>
        <Text style={[s.stat, { color: accuracy >= 90 ? COLORS.emerald : accuracy >= 70 ? COLORS.gold : COLORS.fire }]}>
          {accuracy}% accuracy
        </Text>
      </View>

      {completed && <Text style={s.success}>✓ Perfectly transcribed!</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  label: { color: COLORS.emeraldDark, fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  timer: { fontSize: 24, fontWeight: '700', fontFamily: 'monospace' },
  quoteBox: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    minHeight: 80,
  },
  quoteText: { flexDirection: 'row', flexWrap: 'wrap' },
  quoteChar: { fontSize: 22, fontFamily: 'monospace', lineHeight: 32 },
  input: {
    backgroundColor: COLORS.bgCardLight,
    borderRadius: 12,
    padding: 16,
    color: COLORS.text,
    fontSize: 18,
    fontFamily: 'monospace',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { color: COLORS.textSecondary, fontSize: 13, fontFamily: 'monospace' },
  success: { color: COLORS.emerald, fontSize: 18, fontWeight: '700', textAlign: 'center', marginTop: 16 },
});
