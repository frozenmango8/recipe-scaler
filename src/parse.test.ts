import { describe, expect, it } from 'vitest';
import { parseRecipe, type Line } from './parse';

function item(text: string): Extract<Line, { kind: 'item' }> {
  const line = parseRecipe(text)[0];
  if (!line || line.kind !== 'item') throw new Error(`expected an item for: ${text}`);
  return line;
}

describe('parseRecipe', () => {
  it('reads whole numbers and units', () => {
    expect(item('2 cups flour')).toEqual({
      kind: 'item',
      quantity: { amount: 2, unit: 'cup' },
      name: 'flour',
    });
    expect(item('1 tablespoon olive oil').quantity).toMatchObject({
      amount: 1,
      unit: 'tbsp',
    });
    expect(item('3 teaspoons vanilla').quantity?.unit).toBe('tsp');
    expect(item('500g chicken')).toEqual({
      kind: 'item',
      quantity: { amount: 500, unit: 'g' },
      name: 'chicken',
    });
    expect(item('500 g chicken').quantity).toEqual({ amount: 500, unit: 'g' });
    expect(item('1 lb beef').quantity?.unit).toBe('lb');
    expect(item('8 fl oz cream').quantity).toEqual({ amount: 8, unit: 'floz' });
    expect(item('2 tbsp. butter').name).toBe('butter');
    expect(item('1 c. sugar').quantity?.unit).toBe('cup');
    expect(item('250 ml milk').quantity?.unit).toBe('ml');
    expect(item('2 quarts stock').quantity?.unit).toBe('quart');
  });

  it('reads fractions, mixed numbers, and unicode', () => {
    expect(item('1 1/2 tsp salt').quantity).toEqual({ amount: 1.5, unit: 'tsp' });
    expect(item('1/4 cup olive oil').quantity?.amount).toBeCloseTo(0.25);
    expect(item('½ cup sugar').quantity).toEqual({ amount: 0.5, unit: 'cup' });
    expect(item('1½ cups milk').quantity?.amount).toBeCloseTo(1.5);
    expect(item('2½ cups flour').quantity?.amount).toBeCloseTo(2.5);
    expect(item('2-1/2 cups flour').quantity?.amount).toBeCloseTo(2.5);
    expect(item('1⁄2 tsp pepper').quantity?.amount).toBeCloseTo(0.5);
    expect(item('.5 oz yeast').quantity).toEqual({ amount: 0.5, unit: 'oz' });
    expect(item('0.33 cup cocoa').quantity?.amount).toBeCloseTo(0.33);
  });

  it('reads ranges without swallowing words that start with "to"', () => {
    expect(item('2-3 tbsp oil').quantity).toEqual({
      amount: 2,
      amountMax: 3,
      unit: 'tbsp',
    });
    expect(item('2–3 cloves garlic')).toEqual({
      kind: 'item',
      quantity: { amount: 2, amountMax: 3 },
      name: 'cloves garlic',
    });
    expect(item('1/2-1 cup stock').quantity).toMatchObject({
      amount: 0.5,
      amountMax: 1,
      unit: 'cup',
    });
    expect(item('1 1/2 - 2 cups broth').quantity).toMatchObject({
      amount: 1.5,
      amountMax: 2,
    });
    expect(item('2 to 3 carrots').quantity).toEqual({ amount: 2, amountMax: 3 });
    expect(item('2 tomatoes')).toEqual({
      kind: 'item',
      quantity: { amount: 2 },
      name: 'tomatoes',
    });
  });

  it('leaves prose and parenthetical sizes alone', () => {
    expect(item('Salt and pepper to taste')).toEqual({
      kind: 'item',
      name: 'Salt and pepper to taste',
    });
    expect(item('1 (15 oz) can chickpeas')).toEqual({
      kind: 'item',
      quantity: { amount: 1 },
      name: '(15 oz) can chickpeas',
    });
    expect(item('2 large eggs')).toEqual({
      kind: 'item',
      quantity: { amount: 2 },
      name: 'large eggs',
    });
    expect(item('2 cans tomatoes').name).toBe('cans tomatoes');
    expect(item('4 cloves garlic').name).toBe('cloves garlic');
    expect(item('1 large onion').name).toBe('large onion');
    expect(item('2 cups of flour').name).toBe('flour');
    expect(item('about 2 cups broth').quantity).toEqual({ amount: 2, unit: 'cup' });
    expect(item('~1/4 tsp nutmeg').quantity?.amount).toBeCloseTo(0.25);
  });

  it('strips one list marker and keeps a blank line', () => {
    expect(item('- 2 cups flour').quantity?.unit).toBe('cup');
    expect(item('1. 2 cups flour').name).toBe('flour');
    expect(item('* 1 egg').name).toBe('egg');
    const lines = parseRecipe('1 cup water\n\n2 tsp salt\n');
    expect(lines.map((line) => line.kind)).toEqual(['item', 'blank', 'item']);
  });
});
