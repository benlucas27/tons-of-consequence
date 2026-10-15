/**
 * Occasions that give a hundred extra meaning, beyond the match situation: a tribute, an emotional return, a farewell,
 * a comeback after time out. Boxing Day and New Year Tests are picked up from the Test's date automatically. Each entry
 * needs a short plain note and two sources; the weights live in the trial model (scripts/consequence-trial.mjs).
 * id -> { tag: 'tribute' | 'emotional' | 'farewell' | 'comeback', note, sources }
 */
export const OCCASIONS = {
  1421: { tag: 'tribute', note: 'The first Test after Phillip Hughes died. Warner dedicated the hundred to him; the crowd stood at 63.', sources: ['https://www.cricket.com.au/news/3284462', 'https://en.wikipedia.org/wiki/Indian_cricket_team_in_Australia_in_2014%E2%80%9315'] },
  4278: { tag: 'tribute', note: 'Warner\'s second hundred of the first Test after Phillip Hughes died; he again paid tribute.', sources: ['https://www.cricket.com.au/videos/3231758/warners-stirring-century-in-tribute-to-hughes', 'https://en.wikipedia.org/wiki/Indian_cricket_team_in_Australia_in_2014%E2%80%9315'] },
  2130: { tag: 'emotional', note: 'Clarke, who retired hurt on 60 with his back, came back the next day to complete a hundred in the first Test after Phillip Hughes died.', sources: ['https://www.cricket.com.au/news/4179905/famous-australia-india-test-moments-adelaide-second-test-2014-kohli-smith-hughes-lyon-warner-clarke', 'https://en.wikipedia.org/wiki/Indian_cricket_team_in_Australia_in_2014%E2%80%9315'] },
};
