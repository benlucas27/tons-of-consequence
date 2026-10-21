import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Image, ActivityIndicator, StyleSheet, useWindowDimensions } from 'react-native';
import { onShare, openShareSheet } from './share';
import { Button } from './ui';
import { C, F } from './theme';

/** Shows the image that is about to be shared, with Share and Close buttons. */
export default function ShareHost() {
  const [state, setState] = useState(null);
  const { width, height } = useWindowDimensions();
  useEffect(() => onShare(setState), []);
  const close = () => setState(null);
  const size = Math.min(width - 40, (height - 260) * 0.8);
  return (
    <Modal visible={!!state} animationType="slide" onRequestClose={close} transparent>
      <View style={s.back}>
        <View style={s.sheet}>
          <Text style={s.title}>Share this image</Text>
          {state?.loading ? <View style={{ height: size, justifyContent: 'center' }}><ActivityIndicator color={C.gold} /></View> : null}
          {state?.error ? <Text style={s.err}>{state.error}</Text> : null}
          {state?.uri ? <Image source={{ uri: state.uri }} style={{ width: size, height: size * 1.25, maxHeight: height - 260 }} resizeMode="contain" /> : null}
          {state?.uri ? <Button label="Share" primary onPress={() => openShareSheet(state.uri)} style={{ alignSelf: 'stretch' }} /> : null}
          <Button label="Close" onPress={close} style={{ alignSelf: 'stretch' }} />
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  back: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.bg, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 20, gap: 12, alignItems: 'center', borderTopWidth: 1, borderColor: C.line },
  title: { color: C.ink, fontFamily: F.displayBold, fontSize: 24 },
  err: { color: C.soft, fontFamily: F.ui, fontSize: 15, textAlign: 'center' },
});
