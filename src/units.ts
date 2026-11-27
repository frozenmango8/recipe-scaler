export type Unit =
  | 'tsp'
  | 'tbsp'
  | 'cup'
  | 'floz'
  | 'pint'
  | 'quart'
  | 'oz'
  | 'lb'
  | 'ml'
  | 'l'
  | 'g'
  | 'kg';

const ALIASES: [string, Unit][] = [
  ['fluid ounces', 'floz'],
  ['fluid ounce', 'floz'],
  ['fl. oz', 'floz'],
  ['fl oz', 'floz'],
  ['tablespoons', 'tbsp'],
  ['tablespoon', 'tbsp'],
  ['teaspoons', 'tsp'],
  ['teaspoon', 'tsp'],
  ['milliliters', 'ml'],
  ['millilitres', 'ml'],
  ['milliliter', 'ml'],
  ['millilitre', 'ml'],
  ['kilograms', 'kg'],
  ['kilogram', 'kg'],
  ['ounces', 'oz'],
  ['ounce', 'oz'],
  ['pounds', 'lb'],
  ['pound', 'lb'],
  ['quarts', 'quart'],
  ['quart', 'quart'],
  ['pints', 'pint'],
  ['pint', 'pint'],
  ['liters', 'l'],
  ['litres', 'l'],
  ['liter', 'l'],
  ['litre', 'l'],
  ['grams', 'g'],
  ['gram', 'g'],
  ['cups', 'cup'],
  ['cup', 'cup'],
  ['tbsps', 'tbsp'],
  ['tbsp', 'tbsp'],
  ['tsps', 'tsp'],
  ['tsp', 'tsp'],
  ['tbs', 'tbsp'],
  ['lbs', 'lb'],
  ['lb', 'lb'],
  ['oz', 'oz'],
  ['ml', 'ml'],
  ['kg', 'kg'],
  ['qt', 'quart'],
  ['pt', 'pint'],
  ['g', 'g'],
  ['l', 'l'],
  ['c', 'cup'],
];

// Longer aliases first so "tablespoon" wins over "tbs" and "fl oz" over "oz".
const SORTED_ALIASES = [...ALIASES].sort((a, b) => b[0].length - a[0].length);

export type System = 'us' | 'metric';

// Kitchen conversions, not lab ones. A US cup is 240 ml so 1/3 cup
// lands on 80 ml instead of 78.86.
const VOLUME_ML: Record<string, number> = {
  tsp: 5,
  tbsp: 15,
  cup: 240,
  floz: 30,
  pint: 480,
  quart: 960,
  ml: 1,
  l: 1000,
};

const WEIGHT_G: Record<string, number> = {
  oz: 28.3495,
  lb: 453.592,
  g: 1,
  kg: 1000,
};

export function dimension(unit: Unit): 'volume' | 'weight' {
  return unit in WEIGHT_G ? 'weight' : 'volume';
}

export function systemOf(unit: Unit): System {
  return unit === 'ml' || unit === 'l' || unit === 'g' || unit === 'kg' ? 'metric' : 'us';
}

export function toBase(amount: number, unit: Unit): number {
  const per = WEIGHT_G[unit] ?? VOLUME_ML[unit];
  return amount * per;
}

export function unitLabel(unit: Unit, amount: number): string {
  // "1/2 cup" and "1 cup", but "2 cups". Zero takes the plural.
  const singular = amount > 0 && amount <= 1;
  switch (unit) {
    case 'cup':
      return singular ? 'cup' : 'cups';
    case 'pint':
      return singular ? 'pint' : 'pints';
    case 'quart':
      return singular ? 'quart' : 'quarts';
    case 'floz':
      return 'fl oz';
    default:
      return unit;
  }
}

export function takeUnit(input: string): { unit: Unit; rest: string } | null {
  const text = input.replace(/^\s+/, '');
  const lower = text.toLowerCase();
  for (const [alias, unit] of SORTED_ALIASES) {
    if (!lower.startsWith(alias)) continue;
    let after = text.slice(alias.length);
    // "g" must not eat "garlic", and "c" must not eat "chopped".
    if (/^[a-z]/i.test(after)) continue;
    if (after.startsWith('.')) after = after.slice(1);
    return { unit, rest: after.replace(/^\s+/, '') };
  }
  return null;
}
