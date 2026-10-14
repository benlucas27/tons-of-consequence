/**
 * Same person, spelled differently by Cricsheet (the key) and by the ranking dataset (the value). Until every row
 * carries Cricsheet's player ID, joins and the monthly update use this so one spelling never hides an innings.
 */
export const NAME_ALIASES = {
  'Mehedi Hasan Miraz': 'Mehidy Hasan Miraz',
  'Nazmul Hossain Shanto': 'Najmul Hossain Shanto',
  'Liton Das': 'Litton Das',
  'Agha Salman': 'Salman Agha',
  'Sarfraz Ahmed': 'Sarfaraz Ahmed',
  'L Tucker': 'LJ Tucker',
  'Nithish Kumar Reddy': 'K Nitish Kumar Reddy',
  'Dhruv Jurel': 'DC Jurel',
};

/** The dataset's spelling of a name from either source. */
export const canonicalPlayer = (name) => NAME_ALIASES[name] || name;
