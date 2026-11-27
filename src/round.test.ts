import { describe, expect, it } from 'vitest';
import { parseRecipe } from './parse';
import { formatQuantity } from './round';
import { scaleRecipe } from './scale';

describe('formatQuantity', () => {
  it('snaps US measures to cup and spoon marks', () => {
    expect(formatQuantity(0.33, undefined, 'cup', 'us', 'cocoa').amount).toBe('1/3 cup');
    expect(formatQuantity(0.25, undefined, 'cup', 'us', 'sugar').amount).toBe('1/4 cup');
    expect(formatQuantity(0.5, undefined, 'cup', 'us', 'milk').amount).toBe('1/2 cup');
    expect(formatQuantity(2 / 3, undefined, 'cup', 'us', 'milk').amount).toBe('2/3 cup');
    expect(formatQuantity(1.5, undefined, 'cup', 'us', 'flour').amount).toBe('1 1/2 cups');
    expect(formatQuantity(1, undefined, 'cup', 'us', 'flour').amount).toBe('1 cup');
    expect(formatQuantity(2, undefined, 'cup', 'us', 'flour').amount).toBe('2 cups');
    expect(formatQuantity(0.125, undefined, 'tsp', 'us', 'salt').amount).toBe('1/8 tsp');
    expect(formatQuantity(0.75, undefined, 'tsp', 'us', 'vanilla').amount).toBe('3/4 tsp');
  });

  it('calls an amount smaller than 1/8 tsp a pinch', () => {
    expect(formatQuantity(0.05, undefined, 'tsp', 'us', 'cayenne').amount).toBe('a pinch');
    expect(formatQuantity(0.1, undefined, 'tsp', 'us', 'clove').amount).toBe('a pinch');
    expect(formatQuantity(0.125, undefined, 'tsp', 'us', 'salt').amount).toBe('1/8 tsp');
    expect(formatQuantity(0.2, undefined, 'g', 'metric', 'saffron').amount).toBe('a pinch');
  });

  it('keeps eggs whole and notes the unrounded amount', () => {
    expect(formatQuantity(1.5, undefined, undefined, 'us', 'large eggs')).toEqual({
      amount: '2',
      note: 'rounded from 1 1/2',
    });
    expect(formatQuantity(2, undefined, undefined, 'us', 'eggs')).toEqual({ amount: '2' });
    expect(formatQuantity(0.5, undefined, undefined, 'us', 'egg')).toEqual({
      amount: '1',
      note: 'rounded from 1/2',
    });
    expect(formatQuantity(1, undefined, undefined, 'us', 'eggplant').amount).toBe('1');
    expect(formatQuantity(1.5, undefined, undefined, 'us', 'onion').amount).toBe('1 1/2');
    expect(formatQuantity(12.4, undefined, undefined, 'us', 'crackers').amount).toBe('12');
  });

  it('converts volume to volume and weight to weight', () => {
    expect(formatQuantity(1, undefined, 'cup', 'metric', 'milk').amount).toBe('240 ml');
    expect(formatQuantity(1 / 3, undefined, 'cup', 'metric', 'sugar').amount).toBe('80 ml');
    expect(formatQuantity(2, undefined, 'cup', 'metric', 'stock').amount).toBe('480 ml');
    expect(formatQuantity(5, undefined, 'cup', 'metric', 'stock').amount).toBe('1.2 l');
    expect(formatQuantity(1, undefined, 'tsp', 'metric', 'salt').amount).toBe('5 ml');
    expect(formatQuantity(0.5, undefined, 'tsp', 'metric', 'salt').amount).toBe('2.5 ml');
    expect(formatQuantity(0.25, undefined, 'tsp', 'metric', 'salt').amount).toBe('1.25 ml');
    expect(formatQuantity(0.75, undefined, 'tsp', 'metric', 'salt').amount).toBe('3.75 ml');
    expect(formatQuantity(1, undefined, 'lb', 'metric', 'beef').amount).toBe('454 g');
    expect(formatQuantity(1, undefined, 'oz', 'metric', 'cheese').amount).toBe('28 g');
    expect(formatQuantity(240, undefined, 'ml', 'us', 'milk').amount).toBe('1 cup');
    expect(formatQuantity(1000, undefined, 'ml', 'us', 'stock').amount).toBe('1 quart');
    expect(formatQuantity(500, undefined, 'g', 'us', 'beef').amount).toBe('1 1/8 lb');
    expect(formatQuantity(1, undefined, 'cup', 'us', 'egg whites').amount).toBe('1 cup');
  });

  it('keeps a range in one unit', () => {
    expect(formatQuantity(2, 3, 'cup', 'us', 'broth').amount).toBe('2–3 cups');
    expect(formatQuantity(0.25, 0.5, 'cup', 'us', 'cream').amount).toBe('1/4–1/2 cup');
    expect(formatQuantity(1, 2, undefined, 'us', 'carrots').amount).toBe('1–2');
  });

  it('steps off a spoon that no longer fits', () => {
    expect(formatQuantity(0.5, undefined, 'tbsp', 'us', 'oil').amount).toBe('1 1/2 tsp');
    expect(formatQuantity(8, undefined, 'tbsp', 'us', 'butter').amount).toBe('1/2 cup');
    expect(formatQuantity(3, undefined, 'tsp', 'us', 'salt').amount).toBe('3 tsp');
  });
});

describe('scaleRecipe', () => {
  it('scales a parsed list, then rounds', () => {
    const lines = parseRecipe(
      ['1 1/2 cups flour', '1 egg', '1/3 cup sugar', '2-3 tbsp oil', '', 'Salt to taste'].join(
        '\n',
      ),
    );
    const doubled = scaleRecipe(lines, 2, 'us');
    expect(doubled.map((line) => line.amount)).toEqual([
      '3 cups',
      '2',
      '2/3 cup',
      '4–6 tbsp',
      '',
      '',
    ]);
    expect(doubled[1].note).toBeUndefined();
    expect(doubled[5].name).toBe('Salt to taste');

    const eggs = scaleRecipe(parseRecipe('1 egg'), 1.5, 'us');
    expect(eggs[0]).toMatchObject({ amount: '2', note: 'rounded from 1 1/2' });

    const metric = scaleRecipe(parseRecipe('1 cup milk'), 1, 'metric');
    expect(metric[0].amount).toBe('240 ml');
  });
});
