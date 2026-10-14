/**
 * Preset comparisons on the Compare page. To add one, add an entry here and run
 * `node scripts/build-careers.mjs` so its players' career figures are worked out (the monthly update does this too).
 *
 *   id        in the address: /compare?set=big-four
 *   players   `name` and `country` match the player's innings in the dataset (display name and team code).
 *             `cricsheet` is the player's ID in Cricsheet's archive (https://cricsheet.org/register/), which
 *             stays the same if the spelling of their name changes.
 */
export const COMPARE_SETS = [
  {
    id: 'big-four',
    name: 'The Big Four',
    kicker: 'Careers',
    blurb: 'Smith, Kohli, Root and Williamson: the batters who defined Test cricket in the 2010s and 2020s. Their whole careers, side by side.',
    players: [
      { name: 'Steve Smith', country: 'AUS', cricsheet: '30a45b23' },
      { name: 'Virat Kohli', country: 'IND', cricsheet: 'ba607b88' },
      { name: 'Joe Root', country: 'ENG', cricsheet: 'a343262c' },
      { name: 'Kane Williamson', country: 'NZ', cricsheet: 'd027ba9f' },
    ],
  },
  {
    id: 'openers',
    name: 'The Openers',
    kicker: 'Careers',
    blurb: 'Cook, Warner, Rohit Sharma and Graeme Smith: four of the most prolific Test openers of the modern era.',
    players: [
      { name: 'Alastair Cook', country: 'ENG', cricsheet: 'f41598c1' },
      { name: 'David Warner', country: 'AUS', cricsheet: 'dcce6f09' },
      { name: 'Rohit Sharma', country: 'IND', cricsheet: '740742ef' },
      { name: 'Graeme Smith', country: 'SA', cricsheet: '72861603' },
    ],
  },
  {
    id: 'noughties-giants',
    name: 'The Noughties Giants',
    kicker: 'Careers',
    blurb: 'Ponting, Dravid, Sangakkara and Kallis: the batters who ruled Test cricket through the 2000s. Their careers began before ball-by-ball records are complete, so the career numbers are partial.',
    players: [
      { name: 'Ricky Ponting', country: 'AUS', cricsheet: '7d415ea5' },
      { name: 'Rahul Dravid', country: 'IND', cricsheet: '0184dc35' },
      { name: 'Kumar Sangakkara', country: 'SL', cricsheet: '6b71e6cf' },
      { name: 'Jacques Kallis', country: 'SA', cricsheet: '86dc8f2e' },
    ],
  },
  {
    id: 'asias-best',
    name: 'Asia\'s Best',
    kicker: 'Careers',
    blurb: 'Kohli, Sangakkara, Jayawardene, Younis Khan and Babar Azam: the finest Test batters from the subcontinent in this era.',
    players: [
      { name: 'Virat Kohli', country: 'IND', cricsheet: 'ba607b88' },
      { name: 'Kumar Sangakkara', country: 'SL', cricsheet: '6b71e6cf' },
      { name: 'Mahela Jayawardene', country: 'SL', cricsheet: 'd18f9182' },
      { name: 'Younis Khan', country: 'PAK', cricsheet: '33cb3411' },
      { name: 'Babar Azam', country: 'PAK', cricsheet: '8a75e999' },
    ],
  },
  {
    id: 'south-africas-greats',
    name: 'South Africa\'s Greats',
    kicker: 'Careers',
    blurb: 'Kallis, Amla, de Villiers and Graeme Smith: South Africa\'s best batters of the past two decades.',
    players: [
      { name: 'Jacques Kallis', country: 'SA', cricsheet: '86dc8f2e' },
      { name: 'Hashim Amla', country: 'SA', cricsheet: 'e798611a' },
      { name: 'AB de Villiers', country: 'SA', cricsheet: 'c4487b84' },
      { name: 'Graeme Smith', country: 'SA', cricsheet: '72861603' },
    ],
  },
  {
    id: 'next-generation',
    name: 'The Next Generation',
    kicker: 'Careers',
    blurb: 'Brook, Head, Labuschagne and Jaiswal: the newest names with hundreds in the ranking. Short careers, so compare the rates.',
    players: [
      { name: 'Harry Brook', country: 'ENG', cricsheet: '4ae1755b' },
      { name: 'Travis Head', country: 'AUS', cricsheet: '12b610c2' },
      { name: 'Marnus Labuschagne', country: 'AUS', cricsheet: 'fa433be6' },
      { name: 'Yashasvi Jaiswal', country: 'IND', cricsheet: '6c19c6e5' },
    ],
  },
  {
    id: 'ashes-heroes',
    name: 'Ashes Heroes',
    kicker: 'Careers',
    blurb: 'Cook, Pietersen, Clarke, Smith and Root: the batters who shaped the Ashes of the last two decades.',
    players: [
      { name: 'Alastair Cook', country: 'ENG', cricsheet: 'f41598c1' },
      { name: 'Kevin Pietersen', country: 'ENG', cricsheet: '39f01cdb' },
      { name: 'Michael Clarke', country: 'AUS', cricsheet: 'f842c2cf' },
      { name: 'Steve Smith', country: 'AUS', cricsheet: '30a45b23' },
      { name: 'Joe Root', country: 'ENG', cricsheet: 'a343262c' },
    ],
  },
  {
    id: 'keeper-batters',
    name: 'Keeper-Batters',
    kicker: 'Careers',
    blurb: 'de Kock, Pant, Gilchrist, Watling and Buttler: wicketkeepers who scored Test hundreds.',
    players: [
      { name: 'Quinton de Kock', country: 'SA', cricsheet: '372455c4' },
      { name: 'Rishabh Pant', country: 'IND', cricsheet: '919a3be2' },
      { name: 'Adam Gilchrist', country: 'AUS', cricsheet: '2b6e6dec' },
      { name: 'BJ Watling', country: 'NZ', cricsheet: '928670cc' },
      { name: 'Jos Buttler', country: 'ENG', cricsheet: '99b75528' },
    ],
  },
  {
    id: 'bazball-era',
    name: 'England\'s Bazball Era',
    kicker: 'Careers',
    blurb: 'Root, Brook, Stokes, Duckett and Pope: the England batters of the attacking era.',
    players: [
      { name: 'Joe Root', country: 'ENG', cricsheet: 'a343262c' },
      { name: 'Harry Brook', country: 'ENG', cricsheet: '4ae1755b' },
      { name: 'Ben Stokes', country: 'ENG', cricsheet: 'e087956b' },
      { name: 'Ben Duckett', country: 'ENG', cricsheet: '5f26f677' },
      { name: 'Ollie Pope', country: 'ENG', cricsheet: 'e94bc520' },
    ],
  },
];
