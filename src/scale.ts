import type { Line } from './parse';
import { formatQuantity } from './round';
import type { System } from './units';

export interface ScaledLine {
  blank?: boolean;
  amount: string;
  name: string;
  note?: string;
}

export function scaleRecipe(lines: Line[], factor: number, system: System): ScaledLine[] {
  const safe = Number.isFinite(factor) ? factor : 1;
  return lines.map((line) => {
    if (line.kind === 'blank') return { blank: true, amount: '', name: '' };
    if (!line.quantity) return { amount: '', name: line.name };
    const max =
      line.quantity.amountMax != null ? line.quantity.amountMax * safe : undefined;
    const formatted = formatQuantity(
      line.quantity.amount * safe,
      max,
      line.quantity.unit,
      system,
      line.name,
    );
    const scaled: ScaledLine = { amount: formatted.amount, name: line.name };
    if (formatted.note) scaled.note = formatted.note;
    return scaled;
  });
}
