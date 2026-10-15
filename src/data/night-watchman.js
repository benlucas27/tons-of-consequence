/**
 * Hundreds scored by a night watchman (a lower-order batter sent in late in the day to protect the recognised batters),
 * as listed by Wikipedia's "Nightwatchman (cricket)" page, which follows ESPNcricinfo's classification as of 2019.
 * Wikipedia notes that the classification of Nasim-ul-Ghani and Boucher is debated, so those are marked `debated`.
 * id -> { debated?: true }
 */
export const NIGHT_WATCHMAN = {
  4353: { debated: true }, // Nasim-ul-Ghani 101 v England, Lord's 1962
  3828: {}, // Tony Mann 105 v India, Perth 1977
  4302: {}, // Syed Kirmani 101* v Australia, Mumbai 1979
  2287: { debated: true }, // Mark Boucher 125 v Zimbabwe, Harare 1999
  3574: { debated: true }, // Mark Boucher 108 v England, Durban 1999
  375: {}, // Jason Gillespie 201* v Bangladesh, Chittagong 2006
};
