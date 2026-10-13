'use client';

import { useEffect, useRef, useState } from 'react';

export default function Toaster() {
  const [msg, setMsg] = useState('');
  const [on, setOn] = useState(false);
  const timer = useRef(null);
  useEffect(() => {
    const show = (e) => {
      setMsg(e.detail);
      setOn(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setOn(false), 2200);
    };
    window.addEventListener('toc-toast', show);
    return () => window.removeEventListener('toc-toast', show);
  }, []);
  return <div id="toast" className={on ? 'on' : ''} role="status" aria-live="polite">{msg}</div>;
}
