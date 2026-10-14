'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DEFAULT_ORDER, parseOrder, parseBias, formatOrder, weightQuery } from './scoring.js';

const KEY = 'toc.order';
const BIAS_KEY = 'toc.bias';

function readStored() {
  try { return { order: parseOrder(window.localStorage.getItem(KEY)), bias: parseBias(window.localStorage.getItem(BIAS_KEY)) }; } catch { return { order: null, bias: null }; }
}

/**
 * The reader's weighting: an order of the six criteria, plus an optional bonus (the Patriot's). A link's
 * ?o= (and ?bonus=) wins, then what the reader saved last time, then the default. Changing it saves it and
 * keeps the address bar shareable. Call inside a <Suspense> boundary: it reads the URL.
 */
export function useWeighting() {
  const params = useSearchParams();
  // The first render must match the server's (which cannot see localStorage), so the saved weighting is applied just after.
  const [state, setState] = useState(() => {
    const fromUrl = parseOrder(params.get('o'));
    if (fromUrl) return { order: fromUrl, bias: parseBias(params.get('bonus')), explicit: true };
    return { order: DEFAULT_ORDER, bias: null, explicit: false };
  });
  useEffect(() => {
    if (parseOrder(params.get('o'))) return;
    const stored = readStored();
    if (stored.order) setState({ order: stored.order, bias: stored.bias, explicit: true });
  }, [params]);
  const current = useRef(state);
  current.current = state;

  /** Set the order, and the bonus too if one is given (null turns it off; leaving it out keeps it). */
  const setOrder = useCallback((order, bias) => {
    const nextBias = bias === undefined ? current.current.bias : bias;
    setState({ order, bias: nextBias, explicit: true });
    try {
      window.localStorage.setItem(KEY, formatOrder(order));
      if (nextBias) window.localStorage.setItem(BIAS_KEY, nextBias); else window.localStorage.removeItem(BIAS_KEY);
    } catch { /* private mode */ }
    const url = new URL(window.location.href);
    const kept = url.search.replace(/^\?/, '').split('&').filter((kv) => kv && !kv.startsWith('o=') && !kv.startsWith('bonus='));
    // Appended by hand so the commas stay readable in a shared link (URLSearchParams would write %2C).
    const q = weightQuery(order, nextBias).replace(/^\?/, '');
    url.search = [...kept, ...(q ? [q] : [])].join('&').replace(/^(?=.)/, '?');
    window.history.replaceState(null, '', url);
  }, []);

  return { order: state.order, bias: state.bias, explicit: state.explicit, setOrder };
}
