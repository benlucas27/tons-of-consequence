import { Suspense } from 'react';
import Rankings from '@/components/Rankings';

export default function Page() {
  return (
    <Suspense fallback={<div className="page-pad" aria-busy="true"><div className="skel" style={{ height: 160 }} /><div className="skel" style={{ height: 240 }} /></div>}>
      <Rankings />
    </Suspense>
  );
}
