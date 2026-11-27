import './style.css';
import { parseRecipe } from './parse';
import { scaleRecipe } from './scale';
import type { System } from './units';

const app = document.querySelector('#app');
if (!app) throw new Error('missing #app');

app.innerHTML = `
  <h1>Recipe scaler</h1>
  <form id="controls">
    <label class="field">
      <span>Name</span>
      <input id="name" type="text" autocomplete="off">
    </label>
    <label class="field">
      <span>Ingredients</span>
      <textarea id="ingredients" spellcheck="false"></textarea>
    </label>
    <fieldset>
      <legend>Scale</legend>
      <div class="choice">
        <label><input type="radio" name="mode" value="servings" checked> Servings</label>
        <input id="from" type="number" min="0" step="any" value="4" inputmode="decimal" aria-label="Original servings">
        <span class="to">to</span>
        <input id="to" type="number" min="0" step="any" value="4" inputmode="decimal" aria-label="Desired servings">
      </div>
      <div class="choice">
        <label><input type="radio" name="mode" value="multiplier"> Multiplier</label>
        <input id="multiplier" type="number" min="0" step="any" value="1" inputmode="decimal" aria-label="Multiplier">
      </div>
    </fieldset>
    <fieldset>
      <legend>Units</legend>
      <div class="choice">
        <label><input type="radio" name="system" value="us" checked> US</label>
        <label><input type="radio" name="system" value="metric"> Metric</label>
      </div>
    </fieldset>
  </form>
  <section id="out"></section>
`;

const must = <T extends Element>(selector: string): T => {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`missing ${selector}`);
  return el;
};

const form = must<HTMLFormElement>('#controls');
const nameInput = must<HTMLInputElement>('#name');
const ingredients = must<HTMLTextAreaElement>('#ingredients');
const fromInput = must<HTMLInputElement>('#from');
const toInput = must<HTMLInputElement>('#to');
const multiplier = must<HTMLInputElement>('#multiplier');
const output = must<HTMLElement>('#out');

ingredients.placeholder = [
  '2 cups all-purpose flour',
  '1 1/2 tsp baking powder',
  '1/2 tsp salt',
  '1/3 cup sugar',
  '1 egg',
  '1 cup milk',
  '2 tbsp melted butter',
].join('\n');

function mode(): 'servings' | 'multiplier' {
  const selected = form.querySelector<HTMLInputElement>('input[name="mode"]:checked');
  return selected?.value === 'multiplier' ? 'multiplier' : 'servings';
}

function system(): System {
  const selected = form.querySelector<HTMLInputElement>('input[name="system"]:checked');
  return selected?.value === 'metric' ? 'metric' : 'us';
}

function factor(): number {
  if (mode() === 'multiplier') {
    const value = Number(multiplier.value);
    return Number.isFinite(value) && value >= 0 ? value : 1;
  }
  const from = Number(fromInput.value);
  const to = Number(toInput.value);
  if (!(from > 0) || !(to >= 0) || !Number.isFinite(to)) return 1;
  return to / from;
}

function metaText(): string {
  if (mode() === 'multiplier') {
    const value = Number(multiplier.value);
    if (!Number.isFinite(value)) return '';
    return `× ${String(Math.round(value * 1000) / 1000)}`;
  }
  const from = fromInput.value.trim();
  const to = toInput.value.trim();
  if (!from || !to) return '';
  if (from === to) return `${from} servings`;
  return `${from} to ${to} servings`;
}

function syncDisabled(): void {
  const byServings = mode() === 'servings';
  fromInput.disabled = !byServings;
  toInput.disabled = !byServings;
  multiplier.disabled = byServings;
}

function render(): void {
  output.replaceChildren();
  if (!ingredients.value.trim()) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'Paste ingredients above.';
    output.append(empty);
    return;
  }

  const heading = document.createElement('h2');
  heading.textContent = nameInput.value.trim() || 'Scaled recipe';
  const meta = document.createElement('p');
  meta.className = 'meta';
  meta.textContent = metaText();
  output.append(heading, meta);

  for (const line of scaleRecipe(parseRecipe(ingredients.value), factor(), system())) {
    if (line.blank) {
      const gap = document.createElement('div');
      gap.className = 'gap';
      output.append(gap);
      continue;
    }
    const row = document.createElement('div');
    row.className = 'line';
    const amount = document.createElement('div');
    amount.className = 'amt';
    amount.textContent = line.amount;
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = line.name;
    if (line.note) {
      const note = document.createElement('span');
      note.className = 'note';
      note.textContent = line.note;
      name.append(note);
    }
    row.append(amount, name);
    output.append(row);
  }
}

form.addEventListener('submit', (event) => event.preventDefault());
form.addEventListener('input', () => {
  syncDisabled();
  render();
});

for (const field of [fromInput, toInput, multiplier]) {
  field.addEventListener(
    'wheel',
    (event) => {
      if (document.activeElement === field) event.preventDefault();
    },
    { passive: false },
  );
}

syncDisabled();
render();
