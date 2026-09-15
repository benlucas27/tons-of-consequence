#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  LEVER_KEYS, LEVER_INFO, DEFAULT_WEIGHTS, PRESETS, NATIONS,
  calcToc, scoreTier, calcVolatility, volatilityTier, writeVerdict,
} from './scoring.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CENTURIES = JSON.parse(readFileSync(path.join(__dirname, 'data', 'centuries.json'), 'utf8'));
const BY_ID = new Map(CENTURIES.map((c) => [c.id, c]));

function eraMatch(year, era) {
  if (!era || era === 'All') return true;
  if (era === 'pre1960') return year < 1960;
  if (era === '1960-1989') return year >= 1960 && year <= 1989;
  if (era === '1990-2009') return year >= 1990 && year <= 2009;
  if (era === '2010+') return year >= 2010;
  return true;
}

function resolveWeights({ weights, preset }) {
  const base = preset && PRESETS[preset] ? PRESETS[preset] : DEFAULT_WEIGHTS;
  return { ...base, ...(weights || {}) };
}

function applyFilters(list, { country, era, minRuns, maxRuns, query }) {
  const q = (query || '').toLowerCase().trim();
  return list.filter((c) => {
    if (country && c.country !== country) return false;
    if (!eraMatch(c.year, era)) return false;
    if (minRuns != null && c.runs < minRuns) return false;
    if (maxRuns != null && c.runs > maxRuns) return false;
    if (q) {
      const hay = [c.player, c.opponent, c.venue, c.series, ...(c.tags || [])].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function summarize(c, weights) {
  return {
    id: c.id,
    player: c.player,
    country: c.country,
    countryName: NATIONS[c.country] || c.country,
    runs: c.runs,
    notOut: c.notOut,
    opponent: c.opponent,
    venue: c.venue,
    year: c.year,
    series: c.series,
    matchResult: c.matchResult,
    tags: c.tags || [],
    tocScore: calcToc(c, weights),
    tier: scoreTier(calcToc(c, weights)),
  };
}

const filterShape = {
  country: z.string().length(3).optional().describe('3-letter country code, e.g. AUS, IND, ENG'),
  era: z.enum(['pre1960', '1960-1989', '1990-2009', '2010+']).optional(),
  minRuns: z.number().optional(),
  maxRuns: z.number().optional(),
  query: z.string().optional().describe('Free-text search across player, opponent, venue, series, tags'),
};

const weightsShape = {
  weights: z.object(Object.fromEntries(LEVER_KEYS.map((k) => [k, z.number().min(0).max(100).optional()])))
    .optional()
    .describe('Custom lever weights (0-100 each), merged over the chosen preset / defaults. Levers: ' + LEVER_KEYS.join(', ')),
  preset: z.enum(Object.keys(PRESETS)).optional().describe('A named starting weight profile: ' + Object.keys(PRESETS).join(', ')),
};

const server = new McpServer({ name: 'tons-of-consequence', version: '1.0.0' });

server.tool(
  'list_options',
  'List valid filter values, lever definitions, and weight presets for the Tons of Consequence century-ranking model. Call this first if unsure what values are valid.',
  {},
  async () => {
    const countries = [...new Set(CENTURIES.map((c) => c.country))].sort();
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          totalCenturies: CENTURIES.length,
          countries: countries.map((code) => ({ code, name: NATIONS[code] || code })),
          eras: ['pre1960', '1960-1989', '1990-2009', '2010+'],
          levers: LEVER_KEYS.map((k) => ({ key: k, ...LEVER_INFO[k] })),
          presets: Object.entries(PRESETS).map(([key, w]) => ({ key, weights: w })),
          defaultWeights: DEFAULT_WEIGHTS,
        }, null, 2),
      }],
    };
  }
);

server.tool(
  'rank_centuries',
  'Rank Test cricket centuries by the Tons of Consequence model, with your own lever weights (or a preset), optional filters, and search. This is the core "which innings mattered most" tool.',
  {
    ...weightsShape,
    ...filterShape,
    sortBy: z.enum(['toc', 'runs', 'year']).default('toc'),
    limit: z.number().min(1).max(100).default(20),
    offset: z.number().min(0).default(0),
  },
  async ({ weights, preset, country, era, minRuns, maxRuns, query, sortBy, limit, offset }) => {
    const w = resolveWeights({ weights, preset });
    let list = applyFilters(CENTURIES, { country, era, minRuns, maxRuns, query });
    const scored = list.map((c) => ({ c, toc: calcToc(c, w) }));
    if (sortBy === 'toc') scored.sort((a, b) => b.toc - a.toc);
    if (sortBy === 'runs') scored.sort((a, b) => b.c.runs - a.c.runs);
    if (sortBy === 'year') scored.sort((a, b) => b.c.year - a.c.year);

    const page = scored.slice(offset, offset + limit).map(({ c }, i) => ({
      rank: offset + i + 1,
      ...summarize(c, w),
    }));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ total: scored.length, weightsUsed: w, results: page }, null, 2),
      }],
    };
  }
);

server.tool(
  'get_century',
  'Get full detail on one century — story, all six lever scores, its score under every weight preset, and how divisive it is (how much its ranking shifts depending on what you value).',
  {
    id: z.number().optional().describe('The century\'s numeric id, if known (from a previous rank_centuries/most_divisive call)'),
    player: z.string().optional().describe('Player name (partial match ok) — used with `year` if id is not known'),
    year: z.number().optional(),
    ...weightsShape,
  },
  async ({ id, player, year, weights, preset }) => {
    let c = id != null ? BY_ID.get(id) : null;
    if (!c && player) {
      const p = player.toLowerCase();
      c = CENTURIES.find((x) => x.player.toLowerCase().includes(p) && (year == null || x.year === year));
    }
    if (!c) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: 'No matching century found. Try rank_centuries with a query first to find the id.' }) }] };
    }
    const w = resolveWeights({ weights, preset });
    const vol = calcVolatility(c);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          ...summarize(c, w),
          balls: c.balls,
          minutes: c.minutes,
          story: c.story,
          levers: c.levers,
          divisiveness: { ...vol, tier: volatilityTier(vol.volatility) },
        }, null, 2),
      }],
    };
  }
);

server.tool(
  'compare_centuries',
  'Compare 2-3 centuries head-to-head under a given weighting and get a written verdict on which one "wins" and why.',
  {
    ids: z.array(z.number()).min(2).max(3),
    ...weightsShape,
  },
  async ({ ids, weights, preset }) => {
    const items = ids.map((id) => BY_ID.get(id)).filter(Boolean);
    if (items.length < 2) {
      return { content: [{ type: 'text', text: JSON.stringify({ error: 'Need at least 2 valid ids.' }) }] };
    }
    const w = resolveWeights({ weights, preset });
    // The written verdict is head-to-head by design (see writeVerdict), so
    // with 3 items it's between the top two by score on these weights —
    // never silently between whichever two happened to be listed first.
    const ranked = [...items].sort((a, b) => calcToc(b, w) - calcToc(a, w));
    const verdict = writeVerdict(ranked[0], ranked[1], w);
    if (ranked.length > 2) {
      verdict.verdict += ` (${ranked[2].player}'s ${ranked[2].runs}${ranked[2].notOut ? '*' : ''} placed third on these weights, ${Math.round((calcToc(ranked[0], w) - calcToc(ranked[2], w)) * 10) / 10} points off the top.)`;
    }
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          weightsUsed: w,
          items: items.map((c) => summarize(c, w)),
          verdict,
        }, null, 2),
      }],
    };
  }
);

server.tool(
  'most_divisive',
  'Find the most divisive centuries — innings whose ranking swings wildly depending on what you value (narrative vs conditions vs clutch, etc). These make the best arguments.',
  {
    ...filterShape,
    limit: z.number().min(1).max(100).default(20),
  },
  async ({ country, era, minRuns, maxRuns, query, limit }) => {
    const list = applyFilters(CENTURIES, { country, era, minRuns, maxRuns, query });
    const scored = list.map((c) => ({ c, vol: calcVolatility(c) }))
      .sort((a, b) => b.vol.volatility - a.vol.volatility)
      .slice(0, limit);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          results: scored.map(({ c, vol }, i) => ({
            rank: i + 1,
            ...summarize(c, DEFAULT_WEIGHTS),
            volatility: vol.volatility,
            volatilityTier: volatilityTier(vol.volatility),
            scoreRange: [vol.min, vol.max],
          })),
        }, null, 2),
      }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
