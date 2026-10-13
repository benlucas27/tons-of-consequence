export default function Logo({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="11" fill="#a82619" />
      <path d="M4 9c4-3 12-3 16 0M4 15c4 3 12 3 16 0" stroke="#f2ead4" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity=".85" />
    </svg>
  );
}
