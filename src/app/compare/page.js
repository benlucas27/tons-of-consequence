import { Suspense } from 'react';
import CompareBuilder from '@/components/CompareBuilder';

export const metadata = {
  title: 'Compare two innings',
  description: 'Pick any two Test centuries and see which one wins on your weighting, how the verdict holds under every preset, and the six criteria side by side.',
};

export default function Page() {
  return (
    <Suspense fallback={<div className="page-pad" aria-busy="true"><div className="skel" style={{ height: 160 }} /></div>}>
      <CompareBuilder />
    </Suspense>
  );
}
