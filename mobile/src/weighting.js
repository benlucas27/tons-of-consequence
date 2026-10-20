import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { File, Paths } from 'expo-file-system';
import { DEFAULT_ORDER, PRESETS, activePreset, parseOrder, formatOrder, parseBias } from '../../src/lib/scoring';

// The reader's weighting (order of the six criteria, plus the Patriot bonus), kept on the phone.
const Ctx = createContext(null);
const file = () => new File(Paths.document, 'weighting.json');

export function WeightingProvider({ children }) {
  const [state, setState] = useState({ order: DEFAULT_ORDER, bias: null });
  useEffect(() => {
    (async () => {
      try {
        const f = file();
        if (!f.exists) return;
        const saved = JSON.parse(await f.text());
        const order = parseOrder(saved.order);
        if (order) setState({ order, bias: parseBias(saved.bias) });
      } catch (e) { /* first run, or a damaged file: keep the default */ }
    })();
  }, []);
  const value = useMemo(() => {
    const set = (order, bias = null) => {
      setState({ order, bias });
      try { const f = file(); if (!f.exists) f.create(); f.write(JSON.stringify({ order: formatOrder(order), bias })); } catch (e) { /* not saved: fine */ }
    };
    return {
      ...state,
      preset: activePreset(state.order, state.bias),
      setOrder: (order) => set(order, null),
      setPreset: (name) => set([...PRESETS[name].order], PRESETS[name].bias),
      setWeighting: set,
    };
  }, [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useWeighting = () => useContext(Ctx);
