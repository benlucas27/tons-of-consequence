'use client';

import { copyText, toast } from '@/lib/clientUtils';

/** A read-only value (an address or a command) with a button that copies it. */
export default function CopyField({ value, label }) {
  async function copy() {
    const ok = await copyText(value);
    toast(ok ? 'Copied.' : 'Select the text and copy it yourself.');
  }
  return (
    <div className="copyfield">
      <code aria-label={label}>{value}</code>
      <button type="button" className="btn small" onClick={copy}>Copy</button>
    </div>
  );
}
