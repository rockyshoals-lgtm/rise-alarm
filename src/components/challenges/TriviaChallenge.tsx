import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../theme';
import { getRandomTrivia, TriviaQuestion } from '../../data/trivia';

interface Props {
  onComplete: (success: boolean) => void;
}

export default function TriviaChallenge({ onComplete }: Props) {
  const [question] = useState<TriviaQuestion>(() => getRandomTrivia(1)[0]);
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);

  useEffect(() => {
    if (selected !== null) return;
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
  }, [selected]);

  const handleSelect = (index: number) => {
    if (selected !== null) return;
    setSelected(index);
    const correct = index === question.correctIndex;
    setTimeout(() => onComplete(correct), correct ? 600 : 1200);
  };

  const timerColor = timeLeft <= 5 ? COLORS.fire : timeLeft <= 10 ? COLORS.gold : COLORS.frost;
  const categoryEmoji = { science: '🔬', history: '📜', geography: '🌍', general: '💡', norse: '⚔️' }[question.category] || '❓';

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.label}>{categoryEmoji} WISDOM TEST</Text>
        <Text style={[s.timer, { color: timerColor }]}>{timeLeft}s</Text>
      </View>

      <Text style={s.question}>{question.question}</Text>

      <View style={s.answers}>
        {question.answers.map((answer, i) => {
          const isThis = selected === i;
          const correct = i === question.correctIndex;
          const bg = isThis
            ? correct ? COLORS.emerald : COLORS.fire
            : selected !== null && correct
              ? COLORS.emerald + '60'
              : COLORS.bgCardLight;
          return (
            <TouchableOpacity
              key={i}
              style={[s.option, { backgroundColor: bg }]}
              onPress={() => handleSelect(i)}
              disabled={selected !== null}
              activeOpacity={0.7}
            >
              <Text style={s.letter}>{String.fromCharCode(65 + i)}</Text>
              <Text style={s.answerText}>{answer}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selected !== null && (
        <Text style={[s.result, { color: selected === question.correctIndex ? COLORS.emerald : COLORS.fire }]}>
          {selected === question.correctIndex ? '✓ Wisdom gained!' : `✗ ${question.answers[question.correctIndex]}`}
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  label: { color: COLORS.purple, fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  timer: { fontSize: 24, fontWeight: '700', fontFamily: 'monospace' },
  question: { color: COLORS.text, fontSize: 22, fontWeight: '600', textAlign: 'center', marginBottom: 32, lineHeight: 30 },
  answers: { gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  letter: { color: COLORS.gold, fontSize: 16, fontWeight: '700', width: 28, fontFamily: 'monospace' },
  answerText: { color: COLORS.text, fontSize: 17, fontWeight: '500', flex: 1 },
  result: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginTop: 20 },
});
