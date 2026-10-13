'use client';

import { useCallback, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { DEFAULT_ORDER, parseOrder, formatOrder, sameOrder } from './scoring.js';

const KEY = 'toc.order';

function readStored() {
  try { return parseOrder(window.localStorage.getItem(KEY)); } catch { return null; }
}

/**
 * The reader's weighting (an order of the six criteria). A link's ?o= wins, then what the reader
 * saved last time, then the default. Changing it saves it and keeps the address bar shareable.
 * Call inside a <Suspense> boundary: it reads the URL.
 */
export function useWeighting() {
  const params = useSearchParams();
  const [state, setState] = useState(() => {
    const order = parseOrder(params.get('o')) || (typeof window !== 'undefined' ? readStored() : null);
    return { order: order || DEFAULT_ORDER, explicit: Boolean(order) };
  });

  const setOrder = useCallback((next) => {
    setState({ order: next, explicit: true });
    try { window.localStorage.setItem(KEY, formatOrder(next)); } catch { /* private mode */ }
    const url = new URL(window.location.href);
    url.searchParams.delete('o');
    // Append by hand so the commas stay readable in a shared link (URLSearchParams would write %2C).
    if (!sameOrder(next, DEFAULT_ORDER)) url.search = `${url.search ? `${url.search}&` : '?'}o=${formatOrder(next)}`;
    window.history.replaceState(null, '', url);
  }, []);

  return { order: state.order, explicit: state.explicit, setOrder };
}
