import { takeUnit, type Unit } from './units';

export interface Quantity {
  amount: number;
  amountMax?: number;
  unit?: Unit;
}

export type Line =
  | { kind: 'blank' }
  | { kind: 'item'; quantity?: Quantity; name: string };

const UNICODE_FRACTIONS: Record<string, string> = {
  '½': '1/2',
  '⅓': '1/3',
  '⅔': '2/3',
  '¼': '1/4',
  '¾': '3/4',
  '⅕': '1/5',
  '⅖': '2/5',
  '⅗': '3/5',
  '⅘': '4/5',
  '⅙': '1/6',
  '⅚': '5/6',
  '⅛': '1/8',
  '⅜': '3/8',
  '⅝': '5/8',
  '⅞': '7/8',
};

const FRACTION_CHARS = new RegExp(`[${Object.keys(UNICODE_FRACTIONS).join('')}]`, 'g');

// A quantity is a mixed number, a fraction, or a decimal. Order matters:
// "1 1/2" must be tried before "1".
const QTY = String.raw`(?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?|\.\d+)`;
const QTY_RE = new RegExp(
  `^(${QTY})(?:\\s*(?:-|–|—|to)\\s*(${QTY}))?`,
  'i',
);

function normalize(input: string): string {
  return input
    .replace(/\u2044/g, '/')
    .replace(FRACTION_CHARS, (ch) => UNICODE_FRACTIONS[ch])
    .replace(/(\d)\s*(\d+\/\d+)/g, '$1 $2');
}

function parseNumber(token: string): number | null {
  const mixed = /^(\d+)\s+(\d+)\/(\d+)$/.exec(token);
  if (mixed) {
    const den = Number(mixed[3]);
    if (den === 0) return null;
    return Number(mixed[1]) + Number(mixed[2]) / den;
  }
  const frac = /^(\d+)\/(\d+)$/.exec(token);
  if (frac) {
    const den = Number(frac[2]);
    if (den === 0) return null;
    return Number(frac[1]) / den;
  }
  const n = Number(token);
  return Number.isFinite(n) ? n : null;
}

function parseItem(raw: string): Line {
  let line = raw.trim();
  if (!line) return { kind: 'blank' };

  // Drop a single leading list marker ("- ", "1. ") so pasted lists still parse.
  line = line.replace(/^(?:[-*•–]|\d+[.)])\s+/, '');
  line = line.replace(/^(?:about|approx\.?|approximately)\s+/i, '');
  line = line.replace(/^~\s*/, '');
  line = normalize(line);

  // "2-1/2" means 2½ in American recipes. "2-3" is a range.
  line = line.replace(/^(\d+)-(\d+\/\d+)\b/, '$1 $2');

  const matched = QTY_RE.exec(line);
  if (!matched) return { kind: 'item', name: line };

  let amount = parseNumber(matched[1]);
  let amountMax = matched[2] ? parseNumber(matched[2]) : undefined;
  if (amount == null || (matched[2] && amountMax == null)) {
    return { kind: 'item', name: line };
  }

  if (
    amountMax != null &&
    amountMax < amount &&
    amountMax < 1 &&
    Number.isInteger(amount)
  ) {
    amount += amountMax;
    amountMax = undefined;
  }

  let rest = line.slice(matched[0].length).trim();
  const taken = takeUnit(rest);
  let unit: Unit | undefined;
  if (taken) {
    unit = taken.unit;
    rest = taken.rest.replace(/^of\s+/i, '');
  }

  const quantity: Quantity = { amount };
  if (amountMax != null) quantity.amountMax = amountMax;
  if (unit) quantity.unit = unit;
  return { kind: 'item', quantity, name: rest };
}

export function parseRecipe(text: string): Line[] {
  const lines = text.split(/\r?\n/).map(parseItem);
  while (lines[0]?.kind === 'blank') lines.shift();
  while (lines.at(-1)?.kind === 'blank') lines.pop();
  return lines;
}
