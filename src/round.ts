import {
  dimension,
  systemOf,
  toBase,
  unitLabel,
  type System,
  type Unit,
} from './units';

// Marks on a cup and a spoon set, plus the thirds bakers actually use.
const MARKS: { value: number; text: string }[] = [
  { value: 0, text: '' },
  { value: 1 / 8, text: '1/8' },
  { value: 1 / 4, text: '1/4' },
  { value: 1 / 3, text: '1/3' },
  { value: 3 / 8, text: '3/8' },
  { value: 1 / 2, text: '1/2' },
  { value: 5 / 8, text: '5/8' },
  { value: 2 / 3, text: '2/3' },
  { value: 3 / 4, text: '3/4' },
  { value: 7 / 8, text: '7/8' },
  { value: 1, text: '1' },
];

function snapFraction(amount: number): { value: number; text: string } {
  const abs = Math.abs(amount);
  const whole = Math.floor(abs + 1e-9);
  const frac = abs - whole;
  let best = MARKS[0];
  let bestDist = Infinity;
  for (const mark of MARKS) {
    const dist = Math.abs(frac - mark.value);
    if (dist < bestDist) {
      best = mark;
      bestDist = dist;
    }
  }

  const value = whole + best.value;
  let text: string;
  if (best.value === 1) {
    text = String(whole + 1);
  } else if (whole > 0 && best.text) {
    text = `${whole} ${best.text}`;
  } else {
    text = best.text || String(whole);
  }
  return amount < 0 ? { value: -value, text: `-${text}` } : { value, text };
}

// Below 1/8 tsp there is nothing on a spoon set to measure.
const PINCH_ML = 5 / 8;
const PINCH_G = 0.4;

function isPinch(amount: number, unit: Unit): boolean {
  if (!(amount > 0)) return false;
  const base = toBase(amount, unit);
  return dimension(unit) === 'volume' ? base < PINCH_ML : base < PINCH_G;
}

function roundTo(n: number, step: number): number {
  const decimals = (step.toString().split('.')[1] ?? '').length;
  const stepped = Math.round(n / step) * step;
  const factor = 10 ** decimals;
  return Math.round(stepped * factor) / factor;
}

// Grams follow a scale. Milliliters follow jug marks, so past 100 ml
// a few milliliters either way is noise.
function roundMetric(amount: number, unit: Unit): number {
  if (unit === 'l' || unit === 'kg') return roundTo(amount, amount >= 10 ? 0.1 : 0.01);
  if (unit === 'g') return roundTo(amount, amount < 10 ? 0.1 : 1);
  if (amount < 10) return roundTo(amount, 0.25);
  if (amount < 100) return roundTo(amount, 1);
  return roundTo(amount, 5);
}

function formatDecimal(n: number): string {
  return String(Math.round(n * 100) / 100);
}

// Keep the unit the recipe used while a cook would still read it that way.
// 8 tbsp is a half cup; 4 tsp is easier as tablespoons.
function inRange(amount: number, unit: Unit): boolean {
  switch (unit) {
    case 'tsp':
      return amount >= 1 / 8 && amount < 4;
    case 'tbsp':
      return amount >= 1 && amount < 8;
    case 'cup':
      return amount >= 1 / 4;
    case 'floz':
      return amount >= 1 / 2 && amount < 16;
    case 'pint':
      return amount >= 1 / 2 && amount < 4;
    case 'quart':
      return amount >= 1 / 4;
    case 'oz':
      return amount >= 1 / 4 && amount < 16;
    case 'lb':
      return amount >= 1 / 4;
    case 'ml':
      return amount > 0 && amount < 1000;
    case 'l':
      return amount >= 0.25;
    case 'g':
      return amount > 0 && amount < 1000;
    case 'kg':
      return amount >= 0.25;
  }
}

function pickVolume(ml: number, system: System): Unit {
  if (system === 'metric') return ml >= 1000 ? 'l' : 'ml';
  if (ml >= 960) return 'quart';
  if (ml >= 60) return 'cup';
  if (ml >= 15) return 'tbsp';
  return 'tsp';
}

function pickWeight(grams: number, system: System): Unit {
  if (system === 'metric') return grams >= 1000 ? 'kg' : 'g';
  return grams >= 453.592 ? 'lb' : 'oz';
}

function chooseUnit(amount: number, unit: Unit, system: System): Unit {
  if (systemOf(unit) === system && inRange(amount, unit)) return unit;
  const base = toBase(amount, unit);
  return dimension(unit) === 'weight' ? pickWeight(base, system) : pickVolume(base, system);
}

function convert(amount: number, from: Unit, to: Unit): number {
  if (from === to) return amount;
  return toBase(amount, from) / toBase(1, to);
}

const FRACTION_UNITS = new Set<Unit>([
  'tsp',
  'tbsp',
  'cup',
  'floz',
  'pint',
  'quart',
  'oz',
  'lb',
]);

function formatOne(amount: number, unit: Unit): { text: string; value: number } {
  if (FRACTION_UNITS.has(unit)) return snapFraction(amount);
  const rounded = roundMetric(amount, unit);
  return { text: formatDecimal(rounded), value: rounded };
}

function isEgg(name: string): boolean {
  return /\beggs?\b/i.test(name);
}

function formatLoose(amount: number): string {
  const snapped = snapFraction(amount);
  if (Math.abs(snapped.value - amount) <= 0.02) return snapped.text;
  return formatDecimal(Math.round(amount * 10) / 10);
}

function formatEggs(amount: number, amountMax?: number): FormattedQuantity {
  if (amountMax == null) {
    const whole = Math.max(0, Math.round(amount));
    if (Math.abs(whole - amount) <= 1e-9) return { amount: String(whole) };
    return { amount: String(whole), note: `rounded from ${formatLoose(amount)}` };
  }
  const low = Math.max(0, Math.round(amount));
  const high = Math.max(0, Math.round(amountMax));
  const text = low === high ? String(low) : `${low}–${high}`;
  const changed = Math.abs(low - amount) > 1e-9 || Math.abs(high - amountMax) > 1e-9;
  if (!changed) return { amount: text };
  const from = formatLoose(amount);
  const to = formatLoose(amountMax);
  const exact = from === to ? from : `${from}–${to}`;
  return { amount: text, note: `rounded from ${exact}` };
}

function formatCount(amount: number): { text: string; value: number } {
  if (Math.abs(amount) >= 10) {
    const whole = Math.round(amount);
    return { text: String(whole), value: whole };
  }
  return snapFraction(amount);
}

export interface FormattedQuantity {
  amount: string;
  note?: string;
}

export function formatQuantity(
  amount: number,
  amountMax: number | undefined,
  unit: Unit | undefined,
  system: System,
  name: string,
): FormattedQuantity {
  if (!Number.isFinite(amount)) return { amount: '' };

  if (!unit) {
    if (isEgg(name)) return formatEggs(amount, amountMax);
    const low = formatCount(amount);
    if (amountMax == null) return { amount: low.text };
    const high = formatCount(amountMax);
    if (low.text === high.text) return { amount: low.text };
    return { amount: `${low.text}–${high.text}` };
  }

  const highEnd = amountMax != null ? Math.max(amount, amountMax) : amount;
  const lowEnd = amountMax != null ? Math.min(amount, amountMax) : amount;
  if (isPinch(highEnd, unit)) return { amount: 'a pinch' };

  const display = chooseUnit(highEnd, unit, system);
  const low = formatOne(convert(lowEnd, unit, display), display);
  if (amountMax == null) return { amount: `${low.text} ${unitLabel(display, low.value)}` };

  if (isPinch(lowEnd, unit)) {
    const high = formatOne(convert(highEnd, unit, display), display);
    return { amount: `a pinch–${high.text} ${unitLabel(display, high.value)}` };
  }

  const high = formatOne(convert(highEnd, unit, display), display);
  if (low.text === high.text) return { amount: `${low.text} ${unitLabel(display, low.value)}` };
  return { amount: `${low.text}–${high.text} ${unitLabel(display, high.value)}` };
}
