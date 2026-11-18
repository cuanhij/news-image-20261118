// "The World in One Day" — 18 November 2026.
// A newspaper-style image summing up Wednesday 18 November 2026's world news,
// drawn entirely in code: Node 22 standard library only, no network, no fonts,
// no image files. The program renders a 1024x1024 PNG and writes it to
// /output/entry.png (or $MAKEFUN_OUTPUT_DIR/entry.png when set). Deterministic:
// the same bytes come out of every run.
//
// Six stories, all reported on 18 November 2026:
//   1. US sinks five Iranian tankers; Iran hits back (Middle East)
//   2. Ukraine hits the Kerch Bridge a second night (Europe)
//   3. North Korea fires a ballistic missile into the Sea of Japan (Asia)
//   4. COP31 climate talks enter their decisive phase (Climate)
//   5. Trump lands in Manila for Quad talks (Asia-Pacific)
//   6. A Russian An-12 crashes in Siberia, 19 killed (Russia)

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// ---------------------------------------------------------------- canvas

const W = 1024;
const H = 1024;

type RGB = [number, number, number];

const PAPER: RGB = [246, 241, 231];
const INK: RGB = [22, 19, 14];
const RED: RGB = [163, 22, 33];
const BLUE: RGB = [29, 78, 137];
const TEAL: RGB = [30, 107, 82];
const GOLD: RGB = [150, 105, 25];
const GRAY: RGB = [107, 101, 90];
const RULE: RGB = [201, 194, 178];

const buf = new Uint8Array(W * H * 3);

function px(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  buf[i] = c[0];
  buf[i + 1] = c[1];
  buf[i + 2] = c[2];
}

function fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(W, x + w);
  const y1 = Math.min(H, y + h);
  for (let yy = y0; yy < y1; yy++) {
    let i = (yy * W + x0) * 3;
    for (let xx = x0; xx < x1; xx++) {
      buf[i] = c[0];
      buf[i + 1] = c[1];
      buf[i + 2] = c[2];
      i += 3;
    }
  }
}

function hline(x: number, y: number, w: number, h: number, c: RGB): void {
  fillRect(x, y, w, h, c);
}

function frame(x: number, y: number, w: number, h: number, t: number, c: RGB): void {
  fillRect(x, y, w, t, c);
  fillRect(x, y + h - t, w, t, c);
  fillRect(x, y, t, h, c);
  fillRect(x + w - t, y, t, h, c);
}

// ---------------------------------------------------------------- font
// A 5x7 bitmap font, one glyph per character, drawn by hand here. All copy
// is set in capitals, so only capitals, digits and punctuation are needed.
// Each glyph is 7 rows of 5 bits, '1' = ink.

const FONT: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '01100', '00100', '01000'],
  "'": ['00100', '00100', '01000', '00000', '00000', '00000', '00000'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  ';': ['00000', '01100', '01100', '00000', '01100', '00100', '01000'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '?': ['01110', '10001', '00001', '00110', '00100', '00000', '00100'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  '+': ['00000', '00100', '00100', '01110', '00100', '00100', '00000'],
  '=': ['00000', '00000', '11111', '00000', '11111', '00000', '00000'],
  '"': ['01010', '01010', '01010', '00000', '00000', '00000', '00000'],
  $: ['00100', '01111', '10100', '01110', '00101', '11110', '00100'],
  '|': ['00100', '00100', '00100', '00100', '00100', '00100', '00100'],
};

const BLANK = ['00000', '00000', '00000', '00000', '00000', '00000', '00000'];

// A glyph is 5 units wide plus 1 unit of tracking, so one character occupies
// 6 units at any scale; the last character of a line drops its trailing gap.
function textWidth(s: string, scale: number): number {
  if (s.length === 0) return 0;
  return s.length * 6 * scale - scale;
}

function drawChar(ch: string, x: number, y: number, scale: number, c: RGB): void {
  const g = FONT[ch] ?? BLANK;
  for (let row = 0; row < 7; row++) {
    const bits = g[row];
    for (let col = 0; col < 5; col++) {
      if (bits[col] === '1') {
        fillRect(x + col * scale, y + row * scale, scale, scale, c);
      }
    }
  }
}

function drawText(s: string, x: number, y: number, scale: number, c: RGB): void {
  let cx = x;
  for (const ch of s) {
    drawChar(ch, cx, y, scale, c);
    cx += 6 * scale;
  }
}

function drawCentered(s: string, y: number, scale: number, c: RGB): void {
  drawText(s, Math.round((W - textWidth(s, scale)) / 2), y, scale, c);
}

// Greedy word wrap: returns the lines that fit maxWidth at this scale.
function wrap(s: string, maxWidth: number, scale: number): string[] {
  const words = s.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line === '' ? word : line + ' ' + word;
    if (textWidth(next, scale) <= maxWidth || line === '') {
      line = next;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line !== '') lines.push(line);
  return lines;
}

// Draw a wrapped paragraph; returns the y just below the last line.
function drawPara(s: string, x: number, y: number, maxWidth: number, scale: number, c: RGB, leading: number): number {
  const lines = wrap(s, maxWidth, scale);
  for (const line of lines) {
    drawText(line, x, y, scale, c);
    y += 7 * scale + leading;
  }
  return y;
}

// ---------------------------------------------------------------- png

const CRC_TABLE: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}

function crc32(data: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(w: number, h: number, rgb: Uint8Array): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 2; // truecolour RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 3)] = 0; // filter: none
    raw.set(rgb.subarray(y * w * 3, (y + 1) * w * 3), y * (1 + w * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- drawing

// A small oil tanker, drawn from rectangles: funnel, containers, hull, sea.
function drawTanker(x0: number, yBase: number): void {
  const contColors: RGB[] = [RED, BLUE, TEAL, GOLD, RED];
  let cx = x0 + 44;
  for (const cc of contColors) {
    fillRect(cx, yBase - 36, 96, 32, cc);
    cx += 110;
  }
  // Funnel with a red cap.
  fillRect(x0 + 10, yBase - 54, 26, 50, INK);
  fillRect(x0 + 10, yBase - 54, 26, 9, RED);
  // Hull and stern.
  fillRect(x0 - 16, yBase - 4, 16, 22, INK);
  fillRect(x0, yBase - 4, 700, 22, INK);
  // Bow: a stepped prow on the right end of the hull.
  fillRect(x0 + 700, yBase - 4, 22, 6, INK);
  fillRect(x0 + 700, yBase + 2, 16, 6, INK);
  fillRect(x0 + 700, yBase + 8, 10, 6, INK);
  fillRect(x0 + 700, yBase + 14, 4, 4, INK);
  // Sea.
  hline(x0 - 40, yBase + 26, 800, 3, BLUE);
  hline(x0 + 80, yBase + 36, 640, 2, BLUE);
}

// One story block: colour chip + kicker, headline, summary.
// Returns the y just below the block.
function story(
  x: number,
  y: number,
  w: number,
  chip: RGB,
  kicker: string,
  headline: string,
  headlineScale: number,
  summary: string,
): number {
  fillRect(x, y, 14, 14, chip);
  drawText(kicker, x + 22, y, 2, chip);
  let cy = y + 26;
  cy = drawPara(headline, x, cy, w, headlineScale, INK, 6);
  cy += 4;
  cy = drawPara(summary, x, cy, w, 2, INK, 4);
  return cy;
}

function render(): void {
  fillRect(0, 0, W, H, PAPER);
  frame(8, 8, W - 16, H - 16, 2, INK);

  // ---- masthead
  drawCentered('THE WORLD IN ONE DAY', 30, 6, INK);
  drawCentered('WEDNESDAY 18 NOVEMBER 2026', 82, 3, INK);
  hline(30, 110, W - 60, 3, INK);
  hline(30, 116, W - 60, 1, INK);

  // ---- lead story: the US-Iran tanker war
  fillRect(30, 130, 6, 236, RED);
  drawText('MIDDLE EAST', 52, 130, 2, RED);
  let y = drawPara(
    'US SINKS FIVE IRANIAN TANKERS AS IRAN HITS BACK',
    52,
    156,
    942,
    3,
    INK,
    6,
  );
  y += 6;
  drawPara(
    "WASHINGTON SAYS IT SANK FIVE IRANIAN OIL TANKERS IN THE GULF OF OMAN AFTER IRAN'S REVOLUTIONARY GUARDS TWICE TRIED TO HIT A US WARSHIP. TEHRAN SAYS IT STRUCK TEN SHIPS NEAR THE STRAIT OF HORMUZ AND FIRED MISSILES AT US FORCES AT A BASE IN JORDAN.",
    52,
    y,
    942,
    2,
    INK,
    4,
  );
  drawTanker(140, 330);

  // ---- divider
  hline(30, 382, W - 60, 2, INK);

  // ---- four stories in a 2x2 grid
  const colW = 470;
  const rowH = 182;
  const gx = [30, 524];
  const gy = [396, 588];
  story(
    gx[0],
    gy[0],
    colW,
    BLUE,
    'UKRAINE',
    'UKRAINE HITS KERCH BRIDGE AGAIN',
    2,
    "KYIV STRUCK THE BRIDGE LINKING RUSSIA TO OCCUPIED CRIMEA FOR A SECOND NIGHT IN A ROW, SHUTTING IT DOWN, AS MOSCOW HIT TWO BRIDGES OF ITS OWN AHEAD OF THURSDAY'S SUMMIT.",
  );
  story(
    gx[1],
    gy[0],
    colW,
    RED,
    'KOREA',
    'NORTH KOREA FIRES MISSILE INTO THE SEA',
    2,
    "PYONGYANG LAUNCHED A BALLISTIC MISSILE TOWARDS THE SEA OF JAPAN, SOUTH KOREA'S JOINT CHIEFS SAID, AMID HIGH TENSION AFTER A LANDMINE INCIDENT AT THE BORDER.",
  );
  story(
    gx[0],
    gy[1],
    colW,
    TEAL,
    'CLIMATE',
    'COP31 TALKS ENTER DECISIVE PHASE',
    2,
    'NEGOTIATORS IN ANTALYA ARE WORKING THROUGH A FIRST DRAFT DEAL WITH 144 DISPUTED ITEMS AS THE SUMMIT ENTERS ITS FINAL DAYS BEFORE CLOSING ON FRIDAY.',
  );
  story(
    gx[1],
    gy[1],
    colW,
    GOLD,
    'ASIA-PACIFIC',
    'TRUMP LANDS IN MANILA FOR QUAD TALKS',
    2,
    'THE US PRESIDENT ARRIVED IN THE PHILIPPINES FOR QUAD TALKS WITH INDIA, JAPAN AND AUSTRALIA AHEAD OF A CHINA VISIT, AS LEADERS DISCUSS MARITIME SECURITY.',
  );

  // ---- divider
  hline(30, 782, W - 60, 2, INK);

  // ---- bottom story: the Siberian plane crash
  drawText('RUSSIA', 30, 796, 2, RED);
  y = drawPara(
    'RUSSIAN MILITARY PLANE CRASH KILLS 19 IN SIBERIA',
    30,
    822,
    964,
    3,
    INK,
    6,
  );
  y += 6;
  drawPara(
    'AN ANTONOV AN-12 TRANSPORT WENT DOWN NEAR KEMEROVO, KILLING ALL 19 ABOARD. THE DEFENCE MINISTRY BLAMES A SUSPECTED TECHNICAL FAULT; INVESTIGATORS OPENED A CRIMINAL CASE.',
    30,
    y,
    964,
    2,
    INK,
    4,
  );

  // ---- footer
  hline(30, 952, W - 60, 1, RULE);
  drawCentered('COMPILED FROM WIRE REPORTS - 18 NOVEMBER 2026', 966, 2, GRAY);
}

// ---------------------------------------------------------------- main

render();
const png = encodePNG(W, H, buf);
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entry.png'), png);
console.log(`wrote ${join(outDir, 'entry.png')} (${png.length} bytes)`);
