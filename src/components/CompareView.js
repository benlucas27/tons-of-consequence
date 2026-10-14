import CompareResult from './CompareResult';

/** The comparison reached from ticking innings in the rankings. */
export default function CompareView({ items, order, bias, onBack, onClear }) {
  return (
    <div className="page-pad">
      <button type="button" className="back link-btn" onClick={onBack} style={{ justifySelf: 'start' }}>← Back to rankings</button>
      <CompareResult items={items} order={order} bias={bias} />
      <button type="button" className="btn" onClick={onClear} style={{ justifySelf: 'start' }}>Clear and return</button>
    </div>
  );
}
