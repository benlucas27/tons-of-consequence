import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { LEVERS, RANK_WEIGHTS } from '../../../src/lib/scoring';
import { MEASURED_TOTAL, TONS_TOTAL } from '../../../src/lib/consequence';
import { TOTAL } from '../../../src/lib/dataset';
import { THRESHOLD } from '../../../src/lib/consequenceModel';
import { checkForNewFeed, SITE } from '../loadFeed';
import { useFeedInfo } from '../feedInfo';
import { Screen, H, P, Small, SectionTitle, Link } from '../ui';
import { C, F } from '../theme';

const MESSAGE = {
  checking: 'Checking for new data…',
  'up-to-date': 'You have the latest data.',
  downloaded: 'New data downloaded. It shows next time you open the app.',
  offline: 'Offline: showing the data saved on this phone.',
  failed: 'Could not read the new data. Showing what is saved.',
  'app-too-old': 'Please update the app to see the newest data.',
};

export default function About() {
  const { feedVersion, feedSource } = useFeedInfo();
  const [status, setStatus] = useState('checking');
  useEffect(() => { checkForNewFeed(feedVersion).then((r) => setStatus(r.status)); }, [feedVersion]);
  return (
    <Screen>
      <H>How the ranking works</H>
      <P>Not all hundreds are created equal. Tons of Consequence ranks every Test century by what it meant, and lets you decide what meaning is.</P>
      <SectionTitle>Two things, two names</SectionTitle>
      <P><Text style={{ color: C.ink, fontFamily: F.uiMed }}>The Greatness score</Text> is how great an innings was, from 0 to 100, on the weighting you choose. It drives the rankings.</P>
      <P><Text style={{ color: C.ink, fontFamily: F.uiMed }}>A ton of consequence (a ToC)</Text> is a yes or no: the side needed the hundred, and it helped them win the match or avoid losing it. A hundred that did not is a good ton.</P>
      <P>They can disagree, and that is the point. A great innings in a lost Test can score high and still be a good ton.</P>

      <SectionTitle>The six criteria</SectionTitle>
      {LEVERS.map((l) => (
        <View key={l.key} style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ width: 10, borderRadius: 5, backgroundColor: l.hex, marginTop: 6, height: 10 }} />
          <View style={{ flex: 1 }}><Text style={{ color: C.ink, fontFamily: F.uiMed, fontSize: 16 }}>{l.name}</Text><Small>{l.description}</Small></View>
        </View>
      ))}
      <P>You put the six in order. First place carries {RANK_WEIGHTS[0]}%, then {RANK_WEIGHTS.slice(1).join('%, ')}%. Scores fall into four tiers: Legendary (90 and over), Elite (82 to 89), Great (72 to 81) and Notable.</P>

      <SectionTitle>How a ToC is decided: the 13 laws</SectionTitle>
      <P>Law 1 is the only hard law. Laws 2 to 13 add points, law 8 takes points away, and a hundred needs {THRESHOLD} points to count. The bar is set high on purpose.</P>
      {require('../laws').LAWS.map(([t, d], i) => (
        <P key={t}><Text style={{ color: C.gold, fontFamily: F.displayBold }}>{i + 1}. </Text><Text style={{ color: C.ink, fontFamily: F.uiMed }}>{t}</Text> {d}</P>
      ))}
      <Small>These laws are judgement calls, not a measurement. Every verdict shows how firm its evidence is.</Small>
      <P>{MEASURED_TOTAL.toLocaleString()} of the {TOTAL.toLocaleString()} hundreds have a ToC verdict, and {TONS_TOTAL.toLocaleString()} of them are tons of consequence.</P>

      <SectionTitle>Where the data comes from</SectionTitle>
      <Small>New centuries and many results come from Cricsheet’s open ball-by-ball data. Older results and the women’s hundreds come from Wikipedia’s lists and tour pages, checked against Wisden, cricket.com.au and match reports. New centuries are added through the season.</Small>
      <Small>The phrase “ton of consequence” comes from the Hello Sport podcast.</Small>

      <SectionTitle>The app</SectionTitle>
      <Small>{MESSAGE[status]}</Small>
      <Small>Data {feedVersion} ({feedSource})</Small>
      <P><Link url={`${SITE}/privacy`}>Privacy</Link> · <Link url={SITE}>tonsofconsequence.com</Link> · <Link url="mailto:ben@haveaplan.xyz">Support</Link></P>
    </Screen>
  );
}
