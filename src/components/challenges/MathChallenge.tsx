import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../theme';
import type { Difficulty } from '../../stores/alarmStore';

interface Props {
  difficulty: Difficulty;
  onComplete: (success: boolean) => void;
}

interface Problem {
  question: string;
  answer: number;
  options: number[];
}

function generateProblem(difficulty: Difficulty): Problem {
  let a: number, b: number, op: string, answer: number;

  switch (difficulty) {
    case 'easy':
      a = Math.floor(Math.random() * 20) + 1;
      b = Math.floor(Math.random() * 20) + 1;
      op = Math.random() > 0.5 ? '+' : '-';
      answer = op === '+' ? a + b : a - b;
      break;
    case 'medium':
      a = Math.floor(Math.random() * 30) + 5;
      b = Math.floor(Math.random() * 15) + 2;
      op = ['+', '-', '×'][Math.floor(Math.random() * 3)];
      answer = op === '+' ? a + b : op === '-' ? a - b : a * b;
      break;
    case 'hard':
      a = Math.floor(Math.random() * 50) + 10;
      b = Math.floor(Math.random() * 20) + 2;
      op = ['×', '-', '+'][Math.floor(Math.random() * 3)];
      answer = op === '×' ? a * b : op === '-' ? a - b : a + b;
      break;
    case 'viking':
    default:
      a = Math.floor(Math.random() * 99) + 10;
      b = Math.floor(Math.random() * 99) + 10;
      const ops = ['+', '-', '×'];
      op = ops[Math.floor(Math.random() * 3)];
      answer = op === '+' ? a + b : op === '-' ? a - b : a * b;
      break;
  }

  // Generate wrong options
  const options = new Set<number>([answer]);
  while (options.size < 4) {
    const offset = Math.floor(Math.random() * 10) - 5 || 1;
    options.add(answer + offset);
  }

  return {
    question: `${a} ${op} ${b} = ?`,
    answer,
    options: [...options].sort(() => Math.random() - 0.5),
  };
}

export default function MathChallenge({ difficulty, onComplete }: Props) {
  const [problem, setProblem] = useState<Problem>(() => generateProblem(difficulty));
  const [selected, setSelected] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft] = useState(difficulty === 'viking' ? 10 : difficulty === 'hard' ? 15 : 20);

  useEffect(() => {
    if (isCorrect !== null) return;
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
  }, [isCorrect]);

  const handleSelect = useCallback((value: number) => {
    if (selected !== null) return;
    setSelected(value);
    const correct = value === problem.answer;
    setIsCorrect(correct);
    setTimeout(() => onComplete(correct), correct ? 600 : 1000);
  }, [selected, problem.answer, onComplete]);

  const timerColor = timeLeft <= 5 ? COLORS.fire : timeLeft <= 10 ? COLORS.gold : COLORS.frost;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.label}>⚡ RUNE MATH</Text>
        <Text style={[s.timer, { color: timerColor }]}>{timeLeft}s</Text>
      </View>

      <Text style={s.question}>{problem.question}</Text>

      <View style={s.grid}>
        {problem.options.map((opt, i) => {
          const isThis = selected === opt;
          const bg = isThis
            ? isCorrect ? COLORS.emerald : COLORS.fire
            : selected !== null && opt === problem.answer
              ? COLORS.emerald + '60'
              : COLORS.bgCardLight;
          return (
            <TouchableOpacity
              key={i}
              style={[s.option, { backgroundColor: bg }]}
              onPress={() => handleSelect(opt)}
              disabled={selected !== null}
              activeOpacity={0.7}
            >
              <Text style={s.optionText}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isCorrect !== null && (
        <Text style={[s.result, { color: isCorrect ? COLORS.emerald : COLORS.fire }]}>
          {isCorrect ? '✓ Correct!' : `✗ Answer: ${problem.answer}`}
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  label: { color: COLORS.gold, fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  timer: { fontSize: 24, fontWeight: '700', fontFamily: 'monospace' },
  question: { color: COLORS.text, fontSize: 48, fontWeight: '700', textAlign: 'center', marginBottom: 40, fontFamily: 'monospace' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  option: {
    width: '46%',
    paddingVertical: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  optionText: { color: COLORS.text, fontSize: 28, fontWeight: '700', fontFamily: 'monospace' },
  result: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginTop: 24 },
});
