export const metadata = { title: 'Offline', robots: { index: false } };

export default function Offline() {
  return (
    <article className="prose toc-page">
      <h1>You&rsquo;re offline</h1>
      <p className="lede">This page isn&rsquo;t saved on your phone yet. Pages you have already opened still work. Reconnect to see the rest.</p>
    </article>
  );
}
