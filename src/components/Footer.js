import Link from 'next/link';
import { APP_STORE_URL } from '@/lib/site';

export default function Footer() {
  return (
    <footer className="foot">
      <span>
        Data compiled from public cricket records and <a href="https://cricsheet.org">Cricsheet</a>. <Link href="/about">How the ranking works</Link> · <Link href="/tons-of-consequence">How a ToC is decided</Link> · <a href={APP_STORE_URL}>iPhone app</a> · <Link href="/connect">Connect to Claude</Link> · <Link href="/hello-cricket">Hello Cricket</Link> · <Link href="/reviews">Review</Link> · <Link href="/share">Build a graphic</Link> · <Link href="/privacy">Privacy</Link>
      </span>
    </footer>
  );
}
