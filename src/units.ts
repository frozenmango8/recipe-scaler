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
