import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { QUESTIONS, getPersona, rankingsFor, tally, PICKS } from '../../../src/lib/quiz';
import { shareCard } from '../share';
import { PRESETS } from '../../../src/lib/scoring';
import { useWeighting } from '../weighting';
import { Screen, H, P, Small, Button, WeightBar, Legend } from '../ui';
import { C, F } from '../theme';

const shuffle = (a) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

export default function PubTest({ navigation }) {
  const { setWeighting } = useWeighting();
  const [round, setRound] = useState(0);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState([]);
  const qs = useMemo(() => QUESTIONS.map((q) => ({ ...q, options: shuffle(q.options) })), [round]);
  const done = i >= qs.length;
  const persona = done ? getPersona(answers) : null;
  if (done) {
    const r = rankingsFor(persona);
    return (
      <Screen>
        <Small>Your result</Small>
        <H style={{ color: persona.colour, fontSize: 36 }}>{persona.name}</H>
        <P style={{ color: C.ink, fontFamily: F.serif, fontSize: 20 }}>{persona.tagline}</P>
        <P>{persona.description}</P>
        <WeightBar order={r.order} /><Legend order={r.order} />
        <Button label="See the rankings your way" primary onPress={() => { setWeighting(r.order, r.bias); navigation.navigate('Tabs', { screen: 'Rankings' }); }} />
        <Button label="Share my result as an image" onPress={() => { const c = tally(answers); shareCard(`/card/persona/${persona.id}?c=${PICKS.map((id) => c[id]).join(',')}`, `toc-pub-test-${persona.id}`); }} />
        <Button label="Take it again" onPress={() => { setRound(round + 1); setI(0); setAnswers([]); }} />
      </Screen>
    );
  }
  const q = qs[i];
  return (
    <Screen>
      <Small>Question {i + 1} of {qs.length}</Small>
      <H style={{ fontSize: 26 }}>{q.question}</H>
      {q.options.map((o) => (
        <Pressable key={o.text} style={s.opt} onPress={() => { setAnswers([...answers, o.persona]); setI(i + 1); }}>
          <Text style={s.optText}>{o.text}</Text>
        </Pressable>
      ))}
    </Screen>
  );
}

const s = StyleSheet.create({
  opt: { backgroundColor: C.panel, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.line },
  optText: { color: C.ink, fontFamily: F.ui, fontSize: 16, lineHeight: 22 },
});
