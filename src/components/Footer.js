import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="foot">
      <span>Tons of Consequence. Every Test century, scored by what it meant.</span>
      <span>
        Data from ESPNcricinfo Statsguru and <a href="https://cricsheet.org">Cricsheet</a>. <Link href="/about">How it works</Link>
      </span>
    </footer>
  );
}
