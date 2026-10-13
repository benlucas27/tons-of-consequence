'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';

const NAV = [
  { href: '/', label: 'Rankings' },
  { href: '/?view=divisive', label: 'Most divisive' },
  { href: '/quiz', label: 'Pub Test' },
  { href: '/about', label: 'About' },
];

export default function SiteBar() {
  const path = usePathname();
  const links = NAV.map((n) => (
    <Link key={n.href} href={n.href} aria-current={n.href === '/' ? (path === '/' || path.startsWith('/innings') ? 'page' : undefined) : path === n.href ? 'page' : undefined}>
      {n.label}
    </Link>
  ));
  return (
    <header className="s-bar">
      <div className="s-bar-in">
        <Link className="s-logo" href="/" aria-label="Tons of Consequence, home">
          <Logo />
          Tons of Consequence
        </Link>
        <nav className="s-nav" aria-label="Main">{links}</nav>
        <details className="s-menu">
          <summary aria-label="Menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </summary>
          <nav aria-label="Main">{links}</nav>
        </details>
      </div>
    </header>
  );
}
