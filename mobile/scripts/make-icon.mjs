// Draws the app icon (the site's ball on dark green) at 1024 x 1024 from src/lib/ball.js, so icon and site always match.
// Run once: node scripts/make-icon.mjs   Output: assets/icon.png (no transparency, as the App Store requires).
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const here = dirname(fileURLToPath(import.meta.url));
const { ballSvg } = await import(pathToFileURL(join(here, '../../src/lib/ball.js')).href);
const SIZE = 1024;
const ball = Math.round(SIZE * 0.68);
const inner = ballSvg(ball).replace(/<svg[^>]*>/, '').replace('</svg>', '');
const viewBox = /viewBox="([^"]+)"/.exec(ballSvg(ball))?.[1] || '0 0 40 40';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}"><rect width="${SIZE}" height="${SIZE}" fill="#0b1c13"/><svg x="${(SIZE - ball) / 2}" y="${(SIZE - ball) / 2}" width="${ball}" height="${ball}" viewBox="${viewBox}">${inner}</svg></svg>`;
mkdirSync(join(here, '../assets'), { recursive: true });
const tmp = join(here, '../assets/icon-rgba.png');
writeFileSync(tmp, new Resvg(svg, { fitTo: { mode: 'width', value: SIZE } }).render().asPng());
// Going through JPEG drops the (fully opaque) alpha channel; the solid background hides the loss.
const jpg = join(here, '../assets/icon.jpg');
execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '100', tmp, '--out', jpg]);
execFileSync('sips', ['-s', 'format', 'png', jpg, '--out', join(here, '../assets/icon.png')]);
execFileSync('rm', [tmp, jpg]);
console.log('wrote assets/icon.png');
