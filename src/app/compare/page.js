import { Suspense } from 'react';
import CompareBuilder from '@/components/CompareBuilder';

export const metadata = {
  title: 'Compare innings and careers',
  description: 'Pick any two Test centuries for a verdict on your weighting, or compare whole careers, starting with The Big Four: Smith, Kohli, Root and Williamson.',
};

export default function Page() {
  return (
    <Suspense fallback={<div className="page-pad" aria-busy="true"><div className="skel" style={{ height: 160 }} /></div>}>
      <CompareBuilder />
    </Suspense>
  );
}
