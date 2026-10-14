'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';

const NAV = [
  { href: '/', label: 'Rankings' },
  { href: '/tons-of-consequence', label: 'ToCs' },
  { href: '/compare', label: 'Compare' },
  { href: '/search', label: 'Search' },
  { href: '/the-don', label: 'The Don' },
  { href: '/quiz', label: 'Pub Test' },
];
const MORE = [
  { href: '/hello-sport', label: 'Hello Cricket' },
  { href: '/connect', label: 'Connect to Claude' },
  { href: '/about', label: 'About' },
  { href: '/privacy', label: 'Privacy' },
];

export default function SiteBar() {
  const path = usePathname();
  const current = (href) => (href === '/' ? (path === '/' || path.startsWith('/innings') ? 'page' : undefined) : path === href || path.startsWith(`${href}/`) ? 'page' : undefined);
  const link = (n) => <Link key={n.href} href={n.href} aria-current={current(n.href)}>{n.label}</Link>;
  const links = NAV.map(link);
  const moreLinks = MORE.map(link);
  const moreActive = MORE.some((n) => current(n.href));
  return (
    <header className="s-bar">
      <div className="s-bar-in">
        <Link className="s-logo" href="/" aria-label="Tons of Consequence, home">
          <Logo />
          Tons of Consequence
        </Link>
        <nav className="s-nav" aria-label="Main">
          {links}
          <details className="s-more" key={path}>
            <summary aria-current={moreActive ? 'page' : undefined}>More</summary>
            <div>{moreLinks}</div>
          </details>
        </nav>
        <details className="s-menu">
          <summary aria-label="Menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </summary>
          <nav aria-label="Main">{links}{moreLinks}</nav>
        </details>
      </div>
    </header>
  );
}
