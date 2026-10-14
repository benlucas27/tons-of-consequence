'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from '@/lib/clientUtils';

const ctor = () => (typeof window === 'undefined' ? null : window.SpeechRecognition || window.webkitSpeechRecognition || null);

const ERRORS = {
  'not-allowed': 'Microphone access is blocked. Allow it in your browser, or type the question.',
  'service-not-allowed': 'Microphone access is blocked. Allow it in your browser, or type the question.',
  'no-speech': 'Did not catch anything. Tap the microphone and try again.',
  'audio-capture': 'No microphone found.',
  network: 'Voice needs an internet connection.',
};

/** Whether this browser can turn speech into text. Safe to call during render (false on the server). */
export function useSpeechSupport() {
  const [ok, setOk] = useState(false);
  useEffect(() => { setOk(Boolean(ctor())); }, []);
  return ok;
}

/**
 * A microphone button using the browser's own speech recognition. It shows the words as they are
 * heard (`onInterim`) and hands over the finished sentence (`onFinal`). Renders nothing where the
 * browser has no speech recognition (Firefox), so there is never a dead button.
 */
export default function VoiceButton({ onInterim, onFinal }) {
  const supported = useSpeechSupport();
  const [listening, setListening] = useState(false);
  const rec = useRef(null);

  useEffect(() => () => { try { rec.current?.abort(); } catch { /* already stopped */ } }, []);
  if (!supported) return null;

  function start() {
    const SR = ctor();
    if (!SR) return;
    const r = new SR();
    r.lang = 'en-AU';
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 1;
    let heard = '';
    r.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) heard += t; else interim += t;
      }
      onInterim?.(`${heard}${interim}`.trim());
    };
    r.onerror = (e) => {
      setListening(false);
      if (e.error !== 'aborted') toast(ERRORS[e.error] || 'Voice did not work. Type the question instead.');
    };
    r.onend = () => {
      setListening(false);
      if (heard.trim()) onFinal?.(heard.trim());
    };
    rec.current = r;
    try {
      r.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  return (
    <button
      type="button"
      className={`mic${listening ? ' on' : ''}`}
      aria-pressed={listening}
      aria-label={listening ? 'Stop listening' : 'Speak your question'}
      title={listening ? 'Listening. Tap to stop.' : 'Speak your question'}
      onClick={listening ? () => rec.current?.stop() : start}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="9" y="3" width="6" height="12" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      </svg>
    </button>
  );
}
