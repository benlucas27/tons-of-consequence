import { Suspense } from 'react';
import CompareBuilder from '@/components/CompareBuilder';

const metadata = {
  title: 'Compare innings and careers',
  description: 'Pick any two Test centuries for a verdict on your weighting, or compare whole careers, starting with The Big Four: Smith, Kohli, Root and Williamson.',
};

export function generateMetadata({ searchParams }) {
  const a = Number(searchParams?.a);
  const b = Number(searchParams?.b);
  if (!a || !b || searchParams?.women || searchParams?.set) return metadata;
  const extra = [searchParams.o ? `o=${encodeURIComponent(searchParams.o)}` : '', searchParams.bonus ? `bonus=${encodeURIComponent(searchParams.bonus)}` : ''].filter(Boolean).join('&');
  const img = `/card/compare?a=${a}&b=${b}&format=wide${extra ? `&${extra}` : ''}`;
  return { ...metadata, openGraph: { images: [{ url: img, width: 1200, height: 630 }] }, twitter: { card: 'summary_large_image', images: [img] } };
}

export default function Page() {
  return (
    <Suspense fallback={<div className="page-pad" aria-busy="true"><div className="skel" style={{ height: 160 }} /></div>}>
      <CompareBuilder />
    </Suspense>
  );
}
