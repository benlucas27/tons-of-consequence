import nextVitals from 'eslint-config-next/core-web-vitals';

// The newer React lint rules (react-hooks/*) flag some older patterns that work fine; they are warnings until those components are reworked.
export default [
  ...nextVitals,
  { ignores: ['mobile/**', '.next/**', 'node_modules/**'] },
  { rules: { 'react-hooks/set-state-in-effect': 'warn', 'react-hooks/refs': 'warn', 'react-hooks/purity': 'warn', 'react-hooks/immutability': 'warn', 'react-hooks/preserve-manual-memoization': 'warn', 'react-hooks/static-components': 'warn' } },
];
