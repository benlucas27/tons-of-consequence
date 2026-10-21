import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="foot">
      <span>
        Data compiled from public cricket records and <a href="https://cricsheet.org">Cricsheet</a>. <Link href="/about">How the ranking works</Link> · <Link href="/tons-of-consequence">How a ToC is decided</Link> · <Link href="/connect">Connect to Claude</Link> · <Link href="/hello-cricket">Hello Cricket</Link> · <Link href="/reviews">Under review</Link> · <Link href="/share">Share cards</Link> · <Link href="/privacy">Privacy</Link>
      </span>
    </footer>
  );
}
