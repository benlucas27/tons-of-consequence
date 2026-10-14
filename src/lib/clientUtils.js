'use client';

export function toast(message) {
  window.dispatchEvent(new CustomEvent('toc-toast', { detail: message }));
}

/** Copies text, with a fallback for browsers that block the clipboard API. Returns true on success. */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

/**
 * Sets (or, with an empty value, removes) one query parameter in the address bar without reloading.
 * Written by hand so the commas in a shared ?o=na,hi,... weighting stay readable.
 */
export function setUrlParam(key, value) {
  const url = new URL(window.location.href);
  const kept = url.search.replace(/^\?/, '').split('&').filter((kv) => kv && !kv.startsWith(`${key}=`));
  if (value) kept.push(`${key}=${encodeURIComponent(value).replace(/%2C/g, ',')}`);
  url.search = kept.length ? `?${kept.join('&')}` : '';
  window.history.replaceState(null, '', url);
}
