import { Suspense } from 'react';
import SearchView from '@/components/SearchView';

export const metadata = {
  title: 'Ask the rankings',
  description: 'Ask a plain-English question about any Test century, by typing or speaking. For example: who has the better hundred, Ricky Ponting or Steve Smith?',
};

export default function Page() {
  return (
    <Suspense fallback={<div className="page-pad" aria-busy="true"><div className="skel" style={{ height: 160 }} /></div>}>
      <SearchView />
    </Suspense>
  );
}
