/* =====================================================================
   LAKASFIT – script.js
   1 Utilities · 2 Food database · 3 Diet plans · 4 Storage
   5 Calculations · 6 Journal · 7 Charts · 8 Renderers
   9 Dialogs · 10 Event wiring & router
   ===================================================================== */
'use strict';

/* ============================ 1. UTILITIES ============================ */
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, '0');
const fmt = n => Math.round(n).toLocaleString('en-US');
const fmt1 = n => String(Math.round(n * 10) / 10);
const qtyFmt = n => String(Math.round(n * 100) / 100);
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function dateStr(d = new Date()) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function parseDate(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
const todayStr = () => dateStr();
function shiftDate(s, n) { const d = parseDate(s); d.setDate(d.getDate() + n); return dateStr(d); }
const prettyDate = s => parseDate(s).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

let toastTimer;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

/* ========================= 2. FILIPINO FOOD DATABASE =========================
   Row format: id, name, category, tags, serving, kcal, protein g, carbs g, fat g, fiber g
   Tags drive the filters: breakfast lunch dinner snack rice meat fish veg fruit drink
   All values are approximate. Add rows here to expand the database. */
const FOOD_ROWS = [
  ['adobo', 'Adobo (pork & chicken)', 'Ulam · Meat', 'lunch dinner meat', '1 serving (~130 g)', 300, 21, 3, 22, 0.3],
  ['adobo-chk', 'Chicken adobo', 'Ulam · Meat', 'lunch dinner meat', '1 serving (1 pc + sauce, ~150 g)', 260, 22, 3, 17, 0.3],
  ['adobo-pork', 'Pork adobo', 'Ulam · Meat', 'lunch dinner meat', '1 serving (~120 g)', 340, 20, 3, 27, 0.3],
  ['sin-baboy', 'Sinigang na baboy', 'Ulam · Soup', 'lunch dinner meat veg', '1 bowl (~300 g)', 280, 18, 12, 18, 2.5],
  ['sin-hipon', 'Sinigang na hipon', 'Ulam · Soup', 'lunch dinner fish veg', '1 bowl (~300 g)', 130, 15, 10, 3, 2.5],
  ['sin-isda', 'Sinigang na isda', 'Ulam · Soup', 'lunch dinner fish veg', '1 bowl (~300 g)', 150, 17, 10, 5, 2.5],
  ['tinola', 'Tinola', 'Ulam · Soup', 'lunch dinner meat veg', '1 bowl (~300 g)', 190, 20, 8, 9, 1.5],
  ['nilaga', 'Nilaga', 'Ulam · Soup', 'lunch dinner meat veg', '1 bowl (~350 g)', 300, 22, 16, 16, 3],
  ['karekare', 'Kare-kare', 'Ulam · Meat', 'lunch dinner meat', '1 serving (~250 g)', 380, 24, 14, 26, 3],
  ['caldereta', 'Caldereta', 'Ulam · Meat', 'lunch dinner meat', '1 serving (~200 g)', 350, 23, 10, 25, 2],
  ['menudo', 'Menudo', 'Ulam · Meat', 'lunch dinner meat', '1 serving (~200 g)', 280, 18, 12, 18, 2],
  ['afritada', 'Afritada', 'Ulam · Meat', 'lunch dinner meat', '1 serving (~200 g)', 270, 20, 12, 15, 2],
  ['mechado', 'Mechado', 'Ulam · Meat', 'lunch dinner meat', '1 serving (~200 g)', 300, 22, 11, 19, 2],
  ['bistek', 'Bistek Tagalog', 'Ulam · Meat', 'lunch dinner meat', '1 serving (~150 g)', 260, 24, 8, 15, 1],
  ['inasal', 'Chicken inasal', 'Ulam · Meat', 'lunch dinner meat', '1 pc (leg quarter, ~200 g)', 330, 32, 4, 20, 0],
  ['lechon', 'Lechon kawali', 'Ulam · Meat', 'lunch dinner meat', '1 serving (~100 g)', 450, 22, 0, 40, 0],
  ['fchicken', 'Fried chicken', 'Ulam · Meat', 'lunch dinner meat', '1 pc (thigh or drumstick)', 280, 20, 10, 18, 0.3],
  ['gchicken', 'Grilled chicken breast', 'Ulam · Meat', 'lunch dinner meat', '1 piece (~100 g)', 165, 31, 0, 4, 0],
  ['tocino', 'Tocino', 'Breakfast · Meat', 'breakfast meat', '3 pcs (~90 g)', 270, 14, 20, 15, 0],
  ['longganisa', 'Longganisa', 'Breakfast · Meat', 'breakfast meat', '2 links (~80 g)', 280, 13, 12, 20, 0],
  ['hotdog', 'Hotdog (Filipino style)', 'Breakfast · Meat', 'breakfast snack meat', '2 pcs (~90 g)', 250, 9, 8, 20, 0],
  ['luncheon', 'Luncheon meat', 'Breakfast · Meat', 'breakfast meat', '2 slices (~60 g)', 180, 7, 3, 16, 0],
  ['tapsilog', 'Tapsilog', 'Breakfast · Meal', 'breakfast lunch rice meat', '1 plate (tapa, garlic rice, egg)', 650, 30, 70, 25, 1],
  ['cornbeef', 'Corned beef with rice', 'Breakfast · Meal', 'breakfast lunch rice meat', '1 plate (½ cup corned beef + 1 cup rice)', 480, 20, 47, 23, 1],
  ['sardines', 'Sardines with rice', 'Breakfast · Meal', 'breakfast lunch rice fish', '1 plate (1 can in tomato sauce + 1 cup rice)', 410, 21, 52, 13, 1.5],
  ['egg-fried', 'Fried egg', 'Breakfast · Egg', 'breakfast snack', '1 egg', 90, 6, 0.5, 7, 0],
  ['egg-boiled', 'Boiled egg', 'Breakfast · Egg', 'breakfast snack', '1 large egg', 78, 6, 0.6, 5, 0],
  ['egg-scr', 'Scrambled egg', 'Breakfast · Egg', 'breakfast', '2 eggs', 200, 13, 2, 15, 0],
  ['bangus', 'Bangus (fried)', 'Ulam · Fish', 'breakfast lunch dinner fish', '1 pc (~120 g)', 250, 25, 0, 16, 0],
  ['tilapia', 'Tilapia (fried)', 'Ulam · Fish', 'lunch dinner fish', '1 pc (~150 g)', 220, 30, 0, 10, 0],
  ['tuna', 'Tuna (grilled)', 'Ulam · Fish', 'lunch dinner fish', '1 slice (~100 g)', 140, 25, 0, 4, 0],
  ['milkfish', 'Milkfish (grilled)', 'Ulam · Fish', 'lunch dinner fish', '1 pc (~120 g)', 200, 24, 0, 11, 0],
  ['tokwa', 'Tokwa (fried tofu)', 'Ulam · Protein', 'lunch dinner snack', '1 serving (~100 g)', 190, 12, 3, 15, 1],
  ['rice', 'Rice (white)', 'Rice', 'breakfast lunch dinner rice', '1 cup cooked (~160 g)', 205, 4, 45, 0.4, 0.6],
  ['brown', 'Brown rice', 'Rice', 'breakfast lunch dinner rice', '1 cup cooked (~170 g)', 215, 5, 45, 1.8, 3.5],
  ['garlic', 'Garlic rice', 'Rice', 'breakfast lunch dinner rice', '1 cup (~170 g)', 280, 5, 46, 8, 0.8],
  ['lugaw', 'Lugaw', 'Breakfast · Rice', 'breakfast snack rice', '1 bowl (~300 ml, plain)', 180, 5, 35, 2, 1],
  ['champorado', 'Champorado', 'Breakfast · Rice', 'breakfast snack rice', '1 bowl (~300 ml)', 260, 6, 50, 4, 3],
  ['canton', 'Pancit canton', 'Noodles', 'lunch dinner snack', '1 plate (~200 g)', 380, 10, 55, 13, 3],
  ['bihon', 'Pancit bihon', 'Noodles', 'lunch dinner snack', '1 plate (~200 g)', 320, 12, 48, 9, 2],
  ['palabok', 'Palabok', 'Noodles', 'lunch dinner snack', '1 plate (~220 g)', 430, 15, 55, 16, 3],
  ['spaghetti', 'Filipino spaghetti', 'Noodles', 'lunch dinner snack', '1 plate (~250 g)', 450, 16, 60, 16, 3],
  ['monggo', 'Monggo (mung bean stew)', 'Ulam · Vegetable', 'lunch dinner veg', '1 bowl (~250 g)', 220, 12, 28, 6, 8],
  ['pinakbet', 'Pinakbet', 'Ulam · Vegetable', 'lunch dinner veg', '1 cup (~150 g)', 120, 5, 12, 6, 4],
  ['chopsuey', 'Chopsuey', 'Ulam · Vegetable', 'lunch dinner veg', '1 cup (~150 g)', 160, 10, 12, 8, 3],
  ['laing', 'Laing', 'Ulam · Vegetable', 'lunch dinner veg', '½ cup (~100 g)', 210, 5, 8, 18, 3],
  ['tortang', 'Tortang talong', 'Ulam · Vegetable', 'breakfast lunch dinner veg', '1 pc (1 eggplant + egg)', 180, 10, 8, 12, 3],
  ['gvegs', 'Ginisang vegetables', 'Ulam · Vegetable', 'lunch dinner veg', '1 cup (~150 g)', 90, 3, 9, 5, 3],
  ['banana', 'Banana (lakatan)', 'Fruit', 'breakfast snack fruit', '1 medium (~100 g)', 90, 1, 23, 0.3, 2.6],
  ['mango', 'Mango', 'Fruit', 'snack fruit', '1 cup sliced (~165 g)', 100, 1, 25, 0.6, 2.6],
  ['papaya', 'Papaya', 'Fruit', 'breakfast snack fruit', '1 cup cubes (~140 g)', 60, 1, 15, 0.4, 2.5],
  ['melon', 'Watermelon', 'Fruit', 'snack fruit', '1 cup diced (~150 g)', 46, 1, 11.5, 0.2, 0.6],
  ['pineapple', 'Pineapple', 'Fruit', 'snack fruit', '1 cup chunks (~165 g)', 80, 1, 21, 0.2, 2.3],
  ['coconut', 'Coconut (buko meat)', 'Fruit', 'snack fruit', '½ cup (~80 g)', 110, 1, 5, 10, 3],
  ['kamote-b', 'Boiled kamote (sweet potato)', 'Snack', 'breakfast snack', '1 medium (~130 g)', 130, 2, 31, 0.2, 4],
  ['milk', 'Milk (full cream)', 'Drink', 'breakfast snack drink', '1 cup (240 ml)', 150, 8, 12, 8, 0],
  ['coffee', 'Coffee (3-in-1)', 'Drink', 'breakfast snack drink', '1 sachet (~20 g)', 80, 1, 14, 2, 0.3],
  ['milo', 'Milo', 'Drink', 'breakfast snack drink', '1 glass (3 tbsp + water)', 130, 3, 23, 3, 1],
  ['softdrink', 'Soft drink', 'Drink', 'snack drink', '1 can (330 ml)', 140, 0, 35, 0, 0],
  ['juice', 'Bottled juice', 'Drink', 'snack drink', '1 bottle (250 ml)', 120, 0, 29, 0, 0],
  ['pandesal', 'Pandesal', 'Breakfast · Bread', 'breakfast snack', '2 pcs (~60 g)', 160, 5, 30, 2, 1],
  ['bananacue', 'Banana cue', 'Snack', 'snack', '1 stick', 250, 1, 45, 8, 2],
  ['turon', 'Turon', 'Snack', 'snack', '1 pc', 220, 2, 35, 9, 2],
  ['kamotecue', 'Kamote cue', 'Snack', 'snack', '1 stick', 200, 1, 38, 6, 3],
  ['fishball', 'Fishballs', 'Snack', 'snack', '5 pcs', 120, 6, 14, 4, 0],
  ['kwek', 'Kwek-kwek', 'Snack', 'snack', '3 pcs', 240, 12, 15, 15, 0],
  ['taho', 'Taho', 'Snack', 'breakfast snack drink', '1 cup (~250 ml)', 200, 5, 36, 3, 1],
  ['puto', 'Puto', 'Snack', 'snack', '2 pcs', 140, 3, 29, 1, 0.5],
  ['skyflakes', 'Crackers (Skyflakes-type)', 'Snack', 'snack', '1 pack (~25 g)', 110, 2, 18, 3, 0.5],
  ['peanuts', 'Peanuts (roasted)', 'Snack', 'snack', '¼ cup (~35 g)', 200, 8, 6, 17, 3]
];
const FOODS = FOOD_ROWS.map(r => ({
  id: r[0], name: r[1], cat: r[2], tags: r[3].split(' '), serving: r[4],
  kcal: r[5], p: r[6], c: r[7], f: r[8], fiber: r[9]
}));

const SLOTS = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'snack1', label: 'Morning Snack' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'snack2', label: 'Afternoon Snack' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack3', label: 'Evening Snack' }
];
const slotLabel = id => (SLOTS.find(s => s.id === id) || SLOTS[0]).label;

/* ============================ 3. DIET PLANS ============================
   meals: slot id -> [[foodId, servings], ...]. Base plans are scaled to the user's target. */
const PLANS = [
  { id: 'balanced', name: 'Balanced Filipino Diet', desc: 'Rice, ulam, vegetables and fruit in sensible proportions.',
    meals: { breakfast: [['egg-fried', 2], ['garlic', 1], ['banana', 1]], snack1: [['mango', 1], ['egg-boiled', 1]],
      lunch: [['rice', 1.5], ['sin-isda', 1], ['pinakbet', 1], ['melon', 1]], snack2: [['kamote-b', 1], ['papaya', 1]],
      dinner: [['rice', 1], ['tinola', 1], ['chopsuey', 1]] } },
  { id: 'protein', name: 'High-Protein Filipino Diet', desc: 'Lean ulam, eggs, fish and tokwa at every meal.',
    meals: { breakfast: [['egg-scr', 1.5], ['pandesal', 1], ['milk', 1]], snack1: [['egg-boiled', 2], ['banana', 1]],
      lunch: [['rice', 1], ['gchicken', 1.5], ['gvegs', 1]], snack2: [['tokwa', 1], ['mango', 1]],
      dinner: [['rice', 1], ['bangus', 1], ['sin-hipon', 1], ['gvegs', 1]] } },
  { id: 'budget', name: 'Budget-Friendly Filipino Diet', desc: 'Affordable staples: monggo, eggs, tilapia, kamote and seasonal veggies.',
    meals: { breakfast: [['lugaw', 1], ['egg-boiled', 1], ['pandesal', 1]], snack1: [['kamote-b', 1]],
      lunch: [['rice', 1.5], ['monggo', 1], ['tilapia', 1]], snack2: [['banana', 1], ['pandesal', 1]],
      dinner: [['rice', 1.5], ['tortang', 1], ['gvegs', 1]] } },
  { id: 'student', name: 'Student-Friendly Filipino Diet', desc: 'Easy to buy near campus or pack from home.',
    meals: { breakfast: [['pandesal', 1.5], ['egg-scr', 1], ['coffee', 1]], snack1: [['banana', 1]],
      lunch: [['rice', 1.5], ['adobo-chk', 1], ['gvegs', 1]], snack2: [['skyflakes', 1], ['milo', 1]],
      dinner: [['canton', 1], ['egg-boiled', 1]] } },
  { id: 'maintenance', name: 'Maintenance Diet', desc: 'Variety and steady energy to hold your weight.',
    meals: { breakfast: [['champorado', 1], ['egg-boiled', 1]], snack1: [['papaya', 1], ['peanuts', 0.5]],
      lunch: [['rice', 1.5], ['inasal', 1], ['pinakbet', 1]], snack2: [['kamote-b', 1], ['milk', 1]],
      dinner: [['rice', 1.5], ['nilaga', 1]] } },
  { id: 'loss', name: 'Gradual Weight-Loss Diet', desc: 'Lighter portions, more soup, vegetables and fruit. Slow and sustainable.',
    meals: { breakfast: [['egg-boiled', 2], ['brown', 0.75], ['papaya', 1]], snack1: [['banana', 1]],
      lunch: [['brown', 1], ['sin-isda', 1], ['gvegs', 1]], snack2: [['melon', 1.5]],
      dinner: [['brown', 0.75], ['tinola', 1], ['chopsuey', 1]] } },
  { id: 'gain', name: 'Weight-Gain Diet', desc: 'Calorie-dense but still home-style Filipino meals.',
    meals: { breakfast: [['tapsilog', 1], ['milk', 1]], snack1: [['bananacue', 1]],
      lunch: [['rice', 1.5], ['adobo-pork', 1], ['pinakbet', 1], ['banana', 1]], snack2: [['canton', 1]],
      dinner: [['rice', 1.5], ['karekare', 1], ['mango', 1]] } }
];
const PLAN_SLOTS = ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner'];

/* ============================ 4. STORAGE ============================ */
const KEY = 'lakasfit.v1';
const defaults = () => ({
  profile: {},
  target: { kcal: 2000, p: 125, c: 250, f: 56 },
  journal: {},      // { 'YYYY-MM-DD': [entry, ...] }
  dayTargets: {},   // calorie target recorded per day for history
  weights: {},      // { 'YYYY-MM-DD': kg }
  custom: [],       // user-defined foods
  prefs: { plan: 'balanced', planTarget: '' }
});
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s === 'object') return Object.assign(defaults(), s);
  } catch (e) { /* corrupted or unavailable storage: start fresh */ }
  return defaults();
}
let state = loadState();
function save() {
  state.dayTargets[todayStr()] = state.target.kcal;
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) { toast('Could not save: browser storage is unavailable.'); }
}

/* ============================ 5. CALCULATIONS ============================ */
const calcBMI = (kg, cm) => kg / Math.pow(cm / 100, 2);

function bmiInfo(b) {
  if (b < 18.5) return { label: 'Underweight', text: 'Your BMI is below the usual range. Check that you are eating enough, and talk to a healthcare professional if you are concerned.' };
  if (b < 25) return { label: 'Normal range', text: 'Your BMI is within the commonly used healthy range (18.5–24.9).' };
  if (b < 30) return { label: 'Overweight', text: 'Your BMI is above the commonly used healthy range. Small, steady changes to food and activity can help.' };
  return { label: 'Obesity range', text: 'Your BMI is in the obesity range. Consider speaking with a healthcare professional about a safe plan.' };
}

/* U.S. Navy body-fat estimate (all lengths in cm). Returns {val} or {msg}. */
function bodyFat(p) {
  if (!p.sex || !p.height) return { msg: 'Add your sex and height to estimate body fat.' };
  const need = [];
  if (!p.waist) need.push('waist');
  if (!p.neck) need.push('neck');
  if (p.sex === 'female' && !p.hip) need.push('hip');
  if (need.length) return { msg: 'To estimate body fat, add your ' + need.join(', ') + ' measurement' + (need.length > 1 ? 's' : '') + '.' };
  const d = p.sex === 'male' ? p.waist - p.neck : p.waist + p.hip - p.neck;
  if (d <= 0) return { msg: 'Waist must be larger than neck. Please re-check your measurements.' };
  const bf = p.sex === 'male'
    ? 495 / (1.0324 - 0.19077 * Math.log10(d) + 0.15456 * Math.log10(p.height)) - 450
    : 495 / (1.29579 - 0.35004 * Math.log10(d) + 0.22100 * Math.log10(p.height)) - 450;
  if (!isFinite(bf) || bf < 2 || bf > 60) return { msg: 'The estimate fell outside a plausible range. Please re-check your measurements.' };
  return { val: Math.round(bf * 10) / 10 };
}

/* Mifflin-St Jeor BMR */
const calcBMR = (sex, kg, cm, age) => 10 * kg + 6.25 * cm - 5 * age + (sex === 'male' ? 5 : -161);

const ACTIVITY = {
  sedentary: { label: 'Sedentary', factor: 1.2 },
  light: { label: 'Lightly Active', factor: 1.375 },
  moderate: { label: 'Moderately Active', factor: 1.55 },
  very: { label: 'Very Active', factor: 1.725 },
  extreme: { label: 'Extremely Active', factor: 1.9 }
};

/* Goal target with safety floor: loss = 15% below TDEE, gain = TDEE + 300 kcal. */
function goalTarget(tdee, goal, sex) {
  const floor = sex === 'male' ? 1500 : 1200;
  let t = tdee, limited = false;
  if (goal === 'loss') t = tdee * 0.85;
  else if (goal === 'gain') t = tdee + 300;
  if (t < floor) { t = floor; limited = true; }
  return { kcal: Math.round(t / 10) * 10, limited, floor };
}

/* Macro suggestion: protein by body weight (capped at 35% kcal), fat 25% kcal, carbs the rest. */
function suggestMacros(kcal, weight, goal) {
  const perKg = goal === 'loss' ? 1.8 : 1.6;
  let p = weight ? Math.round(weight * perKg) : Math.round(kcal * 0.25 / 4);
  p = Math.min(p, Math.round(kcal * 0.35 / 4));
  const f = Math.round(kcal * 0.25 / 9);
  const c = Math.max(0, Math.round((kcal - p * 4 - f * 9) / 4));
  return { p, c, f };
}

/* ---- Input validation ---- */
const LIM = {
  age: [15, 100, 'Age', 'years'], height: [100, 250, 'Height', 'cm'], weight: [30, 300, 'Weight', 'kg'],
  waist: [40, 200, 'Waist', 'cm'], neck: [20, 70, 'Neck', 'cm'], hip: [50, 200, 'Hip', 'cm']
};
function readNums(prefix, keys, required) {
  const v = {}, errs = [];
  keys.forEach(k => {
    const raw = $(prefix + cap(k)).value.trim();
    const [lo, hi, name, unit] = LIM[k];
    if (raw === '') { if (required.includes(k)) errs.push(name + ' is required.'); v[k] = null; return; }
    let n = Number(raw);
    if (k === 'age') n = Math.round(n);
    if (!isFinite(n) || n < lo || n > hi) errs.push(name + ' must be between ' + lo + ' and ' + hi + ' ' + unit + '.');
    else v[k] = n;
  });
  return { v, errs };
}
function showErr(id, list) {
  $(id).innerHTML = list.length ? '<ul>' + list.map(e => '<li>' + esc(e) + '</li>').join('') + '</ul>' : '';
}
function logWeight() { if (state.profile.weight) state.weights[todayStr()] = state.profile.weight; }

/* ============================ 6. JOURNAL ============================ */
let jDate = todayStr();      // date currently shown / edited in the journal
let pendingSlot = null;      // slot chosen via "+ Food" before browsing foods

const allFoods = () => FOODS.concat(state.custom);
const findFood = id => allFoods().find(f => f.id === id);
const getEntries = d => state.journal[d] || [];
function totals(entries) {
  return entries.reduce((a, e) => {
    a.kcal += e.kcal * e.qty; a.p += e.p * e.qty; a.c += e.c * e.qty; a.f += e.f * e.qty; return a;
  }, { kcal: 0, p: 0, c: 0, f: 0 });
}
function addEntry(date, food, qty, slot) {
  (state.journal[date] = state.journal[date] || []).push({
    id: uid(), name: food.name, serving: food.serving, qty, slot,
    kcal: food.kcal, p: food.p, c: food.c, f: food.f
  });
  save();
}
function removeEntry(date, id) {
  state.journal[date] = getEntries(date).filter(e => e.id !== id);
  if (!state.journal[date].length) delete state.journal[date];
  save();
}
const dateWord = () => (jDate === todayStr() ? 'today' : prettyDate(jDate));
function defaultSlot() {
  if (pendingSlot) return pendingSlot;
  const h = new Date().getHours();
  return h < 10 ? 'breakfast' : h < 12 ? 'snack1' : h < 14 ? 'lunch' : h < 17 ? 'snack2' : h < 21 ? 'dinner' : 'snack3';
}

/* ============================ 7. CHARTS (inline SVG) ============================ */
function barChart(vals, labels, target, aria) {
  const W = 320, H = 170, top = 16, bot = 24, n = vals.length, gw = W / n;
  const max = Math.max(...vals, target || 0, 10) * 1.12, ch = H - top - bot;
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(aria) + '">';
  s += '<line class="axis" x1="0" y1="' + (H - bot) + '" x2="' + W + '" y2="' + (H - bot) + '"/>';
  vals.forEach((v, i) => {
    const h = v / max * ch, x = i * gw + gw * 0.2, y = H - bot - h;
    s += '<rect class="bar" x="' + x + '" y="' + y + '" width="' + gw * 0.6 + '" height="' + h + '" rx="3"/>';
    if (v > 0) s += '<text class="lbl" x="' + (i * gw + gw / 2) + '" y="' + (y - 3) + '" text-anchor="middle">' + fmt(v) + '</text>';
    s += '<text class="lbl dim" x="' + (i * gw + gw / 2) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(labels[i]) + '</text>';
  });
  if (target) {
    const y = H - bot - target / max * ch;
    s += '<line class="tline" x1="0" x2="' + W + '" y1="' + y + '" y2="' + y + '"/>';
    s += '<text class="lbl" x="' + (W - 2) + '" y="' + (y - 4) + '" text-anchor="end">Target ' + fmt(target) + '</text>';
  }
  return s + '</svg>';
}
function lineChart(points, aria) {
  const W = 320, H = 170, pl = 26, pr = 26, top = 24, bot = 26, n = points.length;
  const vals = points.map(p => p.value);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (hi - lo < 1) { lo -= 1; hi += 1; }
  const x = i => pl + (n === 1 ? 0 : i * (W - pl - pr) / (n - 1));
  const y = v => top + (hi - v) / (hi - lo) * (H - top - bot);
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(aria) + '">';
  s += '<line class="axis" x1="0" y1="' + (H - bot) + '" x2="' + W + '" y2="' + (H - bot) + '"/>';
  s += '<polyline class="line" points="' + points.map((p, i) => x(i) + ',' + y(p.value)).join(' ') + '"/>';
  points.forEach((p, i) => {
    s += '<circle class="dot" cx="' + x(i) + '" cy="' + y(p.value) + '" r="4"/>';
    if (n <= 8 || i === 0 || i === n - 1) s += '<text class="lbl" x="' + x(i) + '" y="' + (y(p.value) - 9) + '" text-anchor="middle">' + fmt1(p.value) + '</text>';
    if (n <= 6 || i === 0 || i === n - 1) s += '<text class="lbl dim" x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(p.label) + '</text>';
  });
  return s + '</svg>';
}
function lastDays(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = shiftDate(todayStr(), -i);
    out.push(Object.assign({ d, label: parseDate(d).toLocaleDateString('en-US', { weekday: 'short' }) }, totals(getEntries(d))));
  }
  return out;
}

/* ============================ 8. RENDERERS ============================ */
const stat = (label, value, sub) =>
  '<div class="card stat"><span class="stat-label">' + label + '</span><strong class="stat-value">' + value + '</strong>' +
  (sub ? '<span class="stat-sub">' + sub + '</span>' : '') + '</div>';

function meter(label, val, target, unit, round1) {
  const f = round1 ? fmt1 : fmt;
  const pct = target > 0 ? Math.min(100, val / target * 100) : 0, over = val > target;
  return '<div class="meter"><div class="meter-head"><span>' + label + '</span><strong>' + f(val) + ' / ' + f(target) + ' ' + unit + '</strong></div>' +
    '<div class="track" role="progressbar" aria-label="' + label + '" aria-valuemin="0" aria-valuemax="' + Math.round(target) + '" aria-valuenow="' + Math.round(val) + '">' +
    '<div class="fill' + (over ? ' over' : '') + '" style="width:' + pct + '%"></div></div>' +
    '<div class="meter-foot">' + (over ? 'Over by ' + f(val - target) + ' ' + unit : f(target - val) + ' ' + unit + ' remaining') + '</div></div>';
}
function macroMeters(t, tg) {
  return meter('Protein', t.p, tg.p, 'g', true) + meter('Carbohydrates', t.c, tg.c, 'g', true) + meter('Fat', t.f, tg.f, 'g', true);
}

function renderDashboard() {
  const p = state.profile, tg = state.target, t = totals(getEntries(todayStr()));
  const bmi = p.height && p.weight ? calcBMI(p.weight, p.height) : null, bf = bodyFat(p), rem = tg.kcal - t.kcal;
  $('dDate').textContent = prettyDate(todayStr());
  $('dHint').hidden = !!bmi;
  $('dStats').innerHTML = [
    stat('Current weight', p.weight ? fmt1(p.weight) + ' kg' : '—'),
    stat('Height', p.height ? fmt1(p.height) + ' cm' : '—'),
    stat('BMI', bmi ? bmi.toFixed(1) : '—', bmi ? bmiInfo(bmi).label : 'Not set'),
    stat('Estimated body fat', bf.val != null ? bf.val + '%' : '—', bf.val != null ? 'Estimate only' : 'Needs waist and neck'),
    stat('Daily calorie target', fmt(tg.kcal) + ' kcal'),
    stat('Consumed today', fmt(t.kcal) + ' kcal'),
    stat(rem >= 0 ? 'Remaining' : 'Over target', fmt(Math.abs(rem)) + ' kcal')
  ].join('');
  $('dCal').innerHTML = '<h2>Calories</h2><p class="big">' + fmt(t.kcal) + ' / ' + fmt(tg.kcal) + ' kcal</p>' + meter('Daily calories', t.kcal, tg.kcal, 'kcal');
  $('dMacros').innerHTML = '<h2>Macros</h2>' + macroMeters(t, tg);
  const days = lastDays(7);
  $('dChart').innerHTML = barChart(days.map(d => d.kcal), days.map(d => d.label), tg.kcal, 'Calories eaten in the last 7 days');
}

function renderMetricsResult() {
  const p = state.profile, el = $('mResult');
  if (!p.height || !p.weight) { el.hidden = true; return; }
  el.hidden = false;
  const bmi = calcBMI(p.weight, p.height), info = bmiInfo(bmi), bf = bodyFat(p);
  el.innerHTML = '<h2>Results</h2><div class="grid two">' +
    '<div class="result"><span class="stat-label">BMI</span><strong class="stat-value">' + bmi.toFixed(1) + '</strong><span class="badge">' + info.label + '</span><p>' + info.text + '</p></div>' +
    '<div class="result"><span class="stat-label">Estimated Body Fat %</span>' +
    (bf.val != null
      ? '<strong class="stat-value">' + bf.val + '%</strong><span class="badge">Estimate</span><p>U.S. Navy method. For general reference, many fitness guidelines describe roughly 14–24% as a common range for men and 21–31% for women. This is an estimate, not a lab measurement.</p>'
      : '<strong class="stat-value">—</strong><p>' + esc(bf.msg) + '</p>') +
    '</div></div><p class="note">BMI does not measure body composition, so muscular people may score high. Some guidelines suggest health risks begin at lower BMI values for Asian populations (overweight from 23). Informational only, not a diagnosis.</p>';
}

function renderMacroTable() {
  const t = state.target, rows = [['Protein', t.p, 4], ['Carbohydrates', t.c, 4], ['Fat', t.f, 9]];
  const sum = rows.reduce((a, r) => a + r[1] * r[2], 0);
  $('macroTable').innerHTML = rows.map(r =>
    '<div class="mrow"><strong>' + r[0] + '</strong><span>' + fmt(r[1]) + ' g/day</span><span>' + fmt(r[1] * r[2]) + ' kcal</span><span>' + Math.round(r[1] * r[2] / t.kcal * 100) + '%</span></div>').join('') +
    '<p class="note">Macros add up to ' + fmt(sum) + ' kcal; your calorie target is ' + fmt(t.kcal) + ' kcal.</p>';
}

function renderCalc() {
  const t = state.target;
  $('tKcal').value = t.kcal; $('tP').value = t.p; $('tC').value = t.c; $('tF').value = t.f;
  const box = $('calcResult');
  if (t.bmr) {
    box.hidden = false;
    $('calcStats').innerHTML = [stat('BMR', fmt(t.bmr), 'kcal/day'), stat('TDEE', fmt(t.tdee), 'kcal/day'),
      stat('Maintenance', fmt(t.tdee), 'kcal/day'), stat('Goal target', fmt(t.kcal), 'kcal/day')].join('');
    $('calcExplain').innerHTML =
      '<dt>BMR</dt><dd>Calories your body burns at complete rest (Mifflin-St Jeor equation).</dd>' +
      '<dt>TDEE</dt><dd>BMR multiplied by your activity level: roughly what you burn in a normal day.</dd>' +
      '<dt>Maintenance</dt><dd>Calories to keep your weight about the same, equal to your TDEE.</dd>' +
      '<dt>Goal target</dt><dd>Maintenance adjusted for your goal: about 15% less for gradual loss, or 300 kcal more for gain.</dd>';
    $('calcNote').textContent = (t.limited ? 'Your target was raised to a safe minimum (' + fmt(t.floor) + ' kcal). ' : '') +
      'Calorie needs vary between individuals. Treat these numbers as a starting point and adjust based on how your weight and energy respond.';
  } else box.hidden = true;
  renderMacroTable();
}

/* Fill both forms from the saved profile */
function fillForms() {
  const p = state.profile, set = (id, v) => { $(id).value = v == null ? '' : v; };
  ['Age', 'Sex', 'Height', 'Weight'].forEach(k => { set('m' + k, p[k.toLowerCase()]); set('c' + k, p[k.toLowerCase()]); });
  set('mWaist', p.waist); set('mNeck', p.neck); set('mHip', p.hip);
  set('cActivity', p.activity || 'light'); set('cGoal', p.goal || 'maintain');
  toggleHip();
}
function toggleHip() { $('mHipWrap').hidden = $('mSex').value !== 'female'; }

/* ---- Foods ---- */
let activeFilter = 'all';
const FILTERS = [['all', 'All'], ['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['dinner', 'Dinner'], ['snack', 'Snacks'],
  ['rice', 'Rice'], ['meat', 'Meat'], ['fish', 'Fish'], ['veg', 'Vegetables'], ['fruit', 'Fruits'], ['drink', 'Drinks'], ['custom', 'My Foods']];

function foodCard(f) {
  const custom = f.tags.includes('custom');
  return '<article class="card food"><div><span class="tag">' + esc(f.cat) + '</span><h3>' + esc(f.name) + '</h3><p class="muted">' + esc(f.serving) + '</p></div>' +
    '<p class="kcal"><strong>' + fmt(f.kcal) + '</strong> kcal / serving</p>' +
    '<dl class="macros"><div><dt>Protein</dt><dd>' + fmt1(f.p) + ' g</dd></div><div><dt>Carbs</dt><dd>' + fmt1(f.c) + ' g</dd></div>' +
    '<div><dt>Fat</dt><dd>' + fmt1(f.f) + ' g</dd></div><div><dt>Fiber</dt><dd>' + (f.fiber == null ? '–' : fmt1(f.fiber) + ' g') + '</dd></div></dl>' +
    '<button class="btn" type="button" data-add="' + esc(f.id) + '">+ Add to Journal</button>' +
    (custom ? '<button class="btn-sm danger" type="button" data-rm-custom="' + esc(f.id) + '" aria-label="Remove ' + esc(f.name) + ' from My Foods">Remove from My Foods</button>' : '') +
    '</article>';
}
function renderFoods() {
  $('filters').innerHTML = FILTERS.map(([id, l]) =>
    '<button type="button" class="chip" data-filter="' + id + '" aria-pressed="' + (id === activeFilter) + '">' + l + '</button>').join('');
  const q = $('fSearch').value.trim().toLowerCase();
  const list = allFoods().filter(f => (activeFilter === 'all' || f.tags.includes(activeFilter)) && (!q || (f.name + ' ' + f.cat).toLowerCase().includes(q)));
  $('fCount').textContent = list.length + ' food' + (list.length === 1 ? '' : 's') + (pendingSlot ? ' · adding to ' + slotLabel(pendingSlot) : '');
  $('foodGrid').innerHTML = list.length ? list.map(foodCard).join('') : '<p class="empty">No foods match. Try another word or filter, or add a custom food.</p>';
}

/* ---- Diet plans ---- */
const currentPlan = () => PLANS.find(p => p.id === state.prefs.plan) || PLANS[0];
function sumItems(items) {
  return totals(items.map(i => ({ kcal: i.food.kcal, p: i.food.p, c: i.food.c, f: i.food.f, qty: i.qty })));
}
function planBaseKcal(plan) {
  let k = 0;
  PLAN_SLOTS.forEach(s => (plan.meals[s] || []).forEach(([id, q]) => { const f = findFood(id); if (f) k += f.kcal * q; }));
  return k;
}
function planTargetValue() { const n = Number(state.prefs.planTarget); return n >= 1200 && n <= 6000 ? n : state.target.kcal; }
function scaledPlan(plan, target) {
  const scale = target / planBaseKcal(plan);
  return PLAN_SLOTS.map(sid => {
    const items = (plan.meals[sid] || []).map(([id, q]) => ({ food: findFood(id), qty: Math.max(0.1, Math.round(q * scale * 10) / 10) })).filter(i => i.food);
    return { slot: SLOTS.find(s => s.id === sid), items, tot: sumItems(items) };
  });
}
const sumLine = t => '<span>' + fmt(t.kcal) + ' kcal</span><span>P ' + fmt1(t.p) + ' g</span><span>C ' + fmt1(t.c) + ' g</span><span>F ' + fmt1(t.f) + ' g</span>';

function renderPlans() {
  $('planSelect').innerHTML = PLANS.map(p => '<option value="' + p.id + '"' + (p.id === currentPlan().id ? ' selected' : '') + '>' + p.name + '</option>').join('');
  const plan = currentPlan(), target = planTargetValue();
  $('planTarget').value = target;
  const parts = scaledPlan(plan, target);
  const day = sumItems(parts.flatMap(p => p.items));
  $('planView').innerHTML = '<p class="muted">' + esc(plan.desc) + ' Portions are scaled to about ' + fmt(target) + ' kcal. Nutrition values are estimates.</p>' +
    '<div class="grid two">' + parts.map(p =>
      '<article class="card"><h3>' + p.slot.label.replace('Morning Snack', 'Morning snack').replace('Afternoon Snack', 'Afternoon snack') + '</h3>' +
      p.items.map(i => '<div class="plan-item"><span>' + qtyFmt(i.qty) + ' × ' + esc(i.food.name) + ' <small>(' + esc(i.food.serving) + ')</small></span><span>' + fmt(i.food.kcal * i.qty) + ' kcal</span></div>').join('') +
      '<div class="plan-sum">' + sumLine(p.tot) + '</div>' +
      '<button class="btn ghost" type="button" data-plan-meal="' + p.slot.id + '">Add entire meal to Journal</button></article>').join('') +
    '</div><article class="card"><h2>Daily total</h2><div class="plan-sum">' + sumLine(day) + '</div>' +
    '<button class="btn" type="button" data-plan-day>Add entire day to Journal</button></article>';
}

/* ---- Journal ---- */
function slotHTML(slot, entries) {
  const sub = totals(entries).kcal;
  return '<article class="card"><div class="slot-head"><h3>' + slot.label + ' <small>' + fmt(sub) + ' kcal</small></h3>' +
    '<div class="slot-actions"><button class="btn-sm" type="button" data-slot-food="' + slot.id + '">+ Food</button>' +
    '<button class="btn-sm" type="button" data-slot-custom="' + slot.id + '">+ Custom</button></div></div>' +
    (entries.length ? '<ul class="entries">' + entries.map(e =>
      '<li class="entry"><div class="entry-main"><strong>' + esc(e.name) + '</strong><span class="muted">' + qtyFmt(e.qty) + ' × ' + esc(e.serving) + '</span></div>' +
      '<div class="entry-nums"><b>' + fmt(e.kcal * e.qty) + ' kcal</b><span>P ' + fmt1(e.p * e.qty) + ' · C ' + fmt1(e.c * e.qty) + ' · F ' + fmt1(e.f * e.qty) + ' g</span></div>' +
      '<div class="entry-actions"><button class="btn-sm" type="button" data-edit="' + e.id + '" aria-label="Edit ' + esc(e.name) + '">Edit</button>' +
      '<button class="btn-sm danger" type="button" data-del="' + e.id + '" aria-label="Delete ' + esc(e.name) + '">Delete</button></div></li>').join('') + '</ul>'
      : '<p class="muted">Nothing logged yet.</p>') + '</article>';
}
function renderJournal() {
  const es = getEntries(jDate), t = totals(es), tg = state.target;
  const kcalTarget = jDate === todayStr() ? tg.kcal : (state.dayTargets[jDate] || tg.kcal);
  $('jDate').value = jDate; $('jDate').max = todayStr();
  $('jLabel').textContent = prettyDate(jDate) + (jDate === todayStr() ? ' (today)' : '');
  $('jTotals').innerHTML = '<h2>Totals</h2>' + meter('Calories', t.kcal, kcalTarget, 'kcal') + macroMeters(t, tg);
  $('jSlots').innerHTML = SLOTS.map(s => slotHTML(s, es.filter(e => e.slot === s.id))).join('');
}

/* ---- History ---- */
function renderHistory() {
  const days = Object.keys(state.journal).filter(d => state.journal[d].length).sort().reverse();
  $('hList').innerHTML = days.length ? days.slice(0, 90).map(d => {
    const t = totals(state.journal[d]), tk = state.dayTargets[d] || state.target.kcal;
    const status = t.kcal > tk * 1.05 ? 'over target' : t.kcal < tk * 0.95 ? 'under target' : 'on target';
    return '<div class="hrow"><div><strong>' + prettyDate(d) + '</strong><div class="muted">' + fmt(t.kcal) + ' / ' + fmt(tk) + ' kcal · ' + status + '</div></div>' +
      '<div class="hmac"><span>P ' + fmt1(t.p) + ' g</span><span>C ' + fmt1(t.c) + ' g</span><span>F ' + fmt1(t.f) + ' g</span></div>' +
      '<button class="btn-sm" type="button" data-date="' + d + '">View journal</button></div>';
  }).join('') : '<p class="empty">No history yet. Add foods to your journal and each day will appear here.</p>';
  const w = lastDays(7);
  $('hCalChart').innerHTML = barChart(w.map(d => d.kcal), w.map(d => d.label), state.target.kcal, 'Calories eaten in the last 7 days');
  $('hProChart').innerHTML = barChart(w.map(d => d.p), w.map(d => d.label), state.target.p, 'Protein eaten in the last 7 days');
  const pts = Object.keys(state.weights).sort().slice(-30).map(d => ({ label: parseDate(d).getMonth() + 1 + '/' + parseDate(d).getDate(), value: state.weights[d] }));
  $('hWeightChart').innerHTML = pts.length >= 2 ? lineChart(pts, 'Weight trend')
    : '<p class="empty">Save your weight in Body Metrics on at least two different days to see a trend.</p>';
}

/* ============================ 9. DIALOGS ============================ */
const dlg = $('dlg');
let dlgSubmit = null, dlgInput = null;
function openDialog(html, onSubmit, onInput) {
  if (dlg.open) dlg.close();
  dlgSubmit = onSubmit || null; dlgInput = onInput || null;
  dlg.innerHTML = '<div class="dlg-body">' + html + '</div>';
  dlg.showModal();
}
function closeDialog() { if (dlg.open) dlg.close(); }
const slotOptions = sel => SLOTS.map(s => '<option value="' + s.id + '"' + (s.id === sel ? ' selected' : '') + '>' + s.label + '</option>').join('');
const previewHTML = (f, q) => '<strong>' + fmt(f.kcal * q) + ' kcal</strong><span>P ' + fmt1(f.p * q) + ' g</span><span>C ' + fmt1(f.c * q) + ' g</span><span>F ' + fmt1(f.f * q) + ' g</span>';

/* Add a food (or edit an existing entry) with a quantity and meal slot */
function openAddDialog(food, entry) {
  const q0 = entry ? entry.qty : 1, slot = entry ? entry.slot : defaultSlot();
  openDialog(
    '<form novalidate><h2 id="dlgTitle">' + (entry ? 'Edit entry' : 'Add to Journal') + '</h2>' +
    '<h3>' + esc(food.name) + '</h3><p class="muted">' + fmt(food.kcal) + ' kcal per serving · ' + esc(food.serving) + '</p>' +
    '<div class="field"><label for="aQty">Quantity (servings)</label><input id="aQty" type="number" inputmode="decimal" min="0.1" max="50" step="0.25" value="' + q0 + '"></div>' +
    '<div class="field"><label for="aSlot">Meal</label><select id="aSlot">' + slotOptions(slot) + '</select></div>' +
    '<div class="preview" id="aPreview" aria-live="polite">' + previewHTML(food, q0) + '</div>' +
    '<div class="err" id="aErr" role="alert"></div>' +
    '<div class="dlg-actions"><button class="btn" type="submit">' + (entry ? 'Save changes' : 'Add to ' + dateWord()) + '</button>' +
    '<button class="btn ghost" type="button" data-close>Cancel</button></div></form>',
    () => {
      const q = Number($('aQty').value);
      if (!isFinite(q) || q < 0.1 || q > 50) { showErr('aErr', ['Quantity must be between 0.1 and 50 servings.']); return; }
      const sl = $('aSlot').value;
      if (entry) { entry.qty = q; entry.slot = sl; save(); toast('Entry updated'); }
      else { addEntry(jDate, food, q, sl); pendingSlot = null; toast('Added ' + food.name + ' to ' + slotLabel(sl) + ' (' + dateWord() + ')'); }
      closeDialog(); refreshCurrent();
    },
    () => { const q = Number($('aQty').value); $('aPreview').innerHTML = isFinite(q) && q > 0 ? previewHTML(food, q) : '<span>Enter a quantity</span>'; });
}

/* Custom food / quick calories */
function openCustomDialog(slot) {
  const num = (id, label, max) => '<div class="field"><label for="' + id + '">' + label + '</label><input id="' + id + '" type="number" inputmode="decimal" min="0" max="' + max + '" step="any"></div>';
  openDialog(
    '<form novalidate><h2 id="dlgTitle">Custom food or quick calories</h2>' +
    '<div class="field"><label for="qName">Name <small>(required to save as a food)</small></label><input id="qName" type="text" maxlength="60" autocomplete="off"></div>' +
    '<div class="field"><label for="qServing">Serving size</label><input id="qServing" type="text" maxlength="60" placeholder="e.g. 1 plate" autocomplete="off"></div>' +
    '<div class="form-grid">' + num('qKcal', 'Calories (kcal)', 5000) + num('qP', 'Protein (g)', 500) + num('qC', 'Carbs (g)', 800) + num('qF', 'Fat (g)', 500) + '</div>' +
    '<div class="form-grid"><div class="field"><label for="qQty">Quantity</label><input id="qQty" type="number" inputmode="decimal" min="0.1" max="50" step="0.25" value="1"></div>' +
    '<div class="field"><label for="qSlot">Meal</label><select id="qSlot">' + slotOptions(slot || defaultSlot()) + '</select></div></div>' +
    '<div class="field check"><input id="qSave" type="checkbox"><label for="qSave">Also save to My Foods</label></div>' +
    '<div class="err" id="qErr" role="alert"></div>' +
    '<div class="dlg-actions"><button class="btn" type="submit" value="add">Add to ' + dateWord() + '</button>' +
    '<button class="btn ghost" type="submit" value="save">Save food only</button>' +
    '<button class="btn ghost" type="button" data-close>Cancel</button></div></form>',
    e => {
      const mode = (e.submitter && e.submitter.value) || 'add', errs = [];
      const val = (id, max, req) => {
        const raw = $(id).value.trim();
        if (raw === '') { if (req) errs.push('Calories are required.'); return 0; }
        const n = Number(raw);
        if (!isFinite(n) || n < 0 || n > max || (req && n <= 0)) { errs.push('Check the ' + (req ? 'calorie' : 'macro') + ' values (0 to ' + max + ').'); return 0; }
        return n;
      };
      const name = $('qName').value.trim(), serving = $('qServing').value.trim() || '1 serving';
      const kcal = val('qKcal', 5000, true), p = val('qP', 500), c = val('qC', 800), f = val('qF', 500);
      const q = Number($('qQty').value), saveIt = mode === 'save' || $('qSave').checked;
      if (mode === 'add' && (!isFinite(q) || q < 0.1 || q > 50)) errs.push('Quantity must be between 0.1 and 50.');
      if (saveIt && !name) errs.push('Enter a name to save this food.');
      if (errs.length) { showErr('qErr', [...new Set(errs)]); return; }
      const food = { id: 'u' + uid(), name: name || 'Quick add', cat: 'My Foods', tags: ['custom'], serving, kcal, p, c, f, fiber: null };
      if (saveIt) state.custom.push(food);
      if (mode === 'add') { addEntry(jDate, food, q, $('qSlot').value); pendingSlot = null; toast('Added ' + food.name + ' (' + dateWord() + ')'); }
      else { save(); toast('Saved ' + food.name + ' to My Foods'); }
      closeDialog(); refreshCurrent();
    });
}

function openResetDialog() {
  openDialog('<form novalidate><h2 id="dlgTitle">Reset all data?</h2>' +
    '<p>This permanently deletes your profile, targets, food journal, history, weight log and custom foods from this browser.</p>' +
    '<div class="dlg-actions"><button class="btn" type="submit">Yes, reset everything</button><button class="btn ghost" type="button" data-close>Cancel</button></div></form>',
    () => {
      try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
      state = defaults(); jDate = todayStr(); pendingSlot = null;
      closeDialog(); route(); toast('All data was reset');
    });
}

/* ============================ 10. EVENTS & ROUTER ============================ */
const VIEWS = ['dashboard', 'metrics', 'calculator', 'foods', 'plans', 'journal', 'history'];
let currentView = 'dashboard';

function renderView(v) {
  if (v === 'dashboard') renderDashboard();
  else if (v === 'metrics') { fillForms(); showErr('mErr', []); renderMetricsResult(); }
  else if (v === 'calculator') { fillForms(); showErr('cErr', []); renderCalc(); }
  else if (v === 'foods') renderFoods();
  else if (v === 'plans') renderPlans();
  else if (v === 'journal') renderJournal();
  else if (v === 'history') renderHistory();
}
const refreshCurrent = () => renderView(currentView);

function route() {
  const id = location.hash.slice(1);
  currentView = VIEWS.includes(id) ? id : 'dashboard';
  VIEWS.forEach(v => { $('view-' + v).hidden = v !== currentView; });
  document.querySelectorAll('#nav a').forEach(a => {
    if (a.dataset.view === currentView) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  $('nav').classList.remove('open');
  $('menuBtn').setAttribute('aria-expanded', 'false');
  $('menuBtn').setAttribute('aria-label', 'Open menu');
  renderView(currentView);
  window.scrollTo(0, 0);
}
const goTo = v => { if (location.hash === '#' + v) route(); else location.hash = '#' + v; };

function init() {
  window.addEventListener('hashchange', route);

  $('menuBtn').addEventListener('click', () => {
    const open = $('nav').classList.toggle('open');
    $('menuBtn').setAttribute('aria-expanded', String(open));
    $('menuBtn').setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });

  /* Body metrics */
  $('mSex').addEventListener('change', toggleHip);
  $('metricsForm').addEventListener('submit', e => {
    e.preventDefault();
    const { v, errs } = readNums('m', ['age', 'height', 'weight', 'waist', 'neck', 'hip'], ['age', 'height', 'weight']);
    const sex = $('mSex').value;
    if (!sex) errs.push('Please select your sex.');
    if (errs.length) { showErr('mErr', errs); return; }
    showErr('mErr', []);
    Object.assign(state.profile, { age: v.age, sex, height: v.height, weight: v.weight, waist: v.waist, neck: v.neck, hip: sex === 'female' ? v.hip : null });
    logWeight(); save(); renderMetricsResult(); toast('Body metrics saved');
  });

  /* Calorie calculator */
  $('calcForm').addEventListener('submit', e => {
    e.preventDefault();
    const { v, errs } = readNums('c', ['age', 'height', 'weight'], ['age', 'height', 'weight']);
    const sex = $('cSex').value, activity = $('cActivity').value, goal = $('cGoal').value;
    if (!sex) errs.push('Please select your sex.');
    if (errs.length) { showErr('cErr', errs); return; }
    showErr('cErr', []);
    const bmr = calcBMR(sex, v.weight, v.height, v.age), tdee = bmr * ACTIVITY[activity].factor;
    const g = goalTarget(tdee, goal, sex), m = suggestMacros(g.kcal, v.weight, goal);
    Object.assign(state.profile, { age: v.age, sex, height: v.height, weight: v.weight, activity, goal });
    state.target = { kcal: g.kcal, p: m.p, c: m.c, f: m.f, bmr: Math.round(bmr), tdee: Math.round(tdee), limited: g.limited, floor: g.floor };
    logWeight(); save(); renderCalc(); toast('Calorie target saved: ' + fmt(g.kcal) + ' kcal');
  });
  $('targetForm').addEventListener('submit', e => {
    e.preventDefault();
    const n = Number($('tKcal').value);
    if (!Number.isInteger(n) || n < 1200 || n > 6000) { showErr('tErr', ['Calorie target must be a whole number between 1,200 and 6,000 kcal.']); return; }
    showErr('tErr', []);
    const m = suggestMacros(n, state.profile.weight, state.profile.goal);
    Object.assign(state.target, { kcal: n, p: m.p, c: m.c, f: m.f });
    const lowMale = state.profile.sex === 'male' && n < 1500;
    $('tMsg').textContent = lowMale ? 'This is below the usual minimum for men (1,500 kcal). Consider checking with a healthcare professional.' : 'Target updated and macros re-suggested.';
    save(); renderCalc(); toast('Calorie target updated');
  });
  $('macroForm').addEventListener('submit', e => {
    e.preventDefault();
    const vals = ['tP', 'tC', 'tF'].map(id => Number($(id).value)), max = [800, 800, 400];
    const bad = vals.some((n, i) => !Number.isInteger(n) || n < 0 || n > max[i]);
    if (bad || vals.every(n => n === 0)) { showErr('macroErr', ['Enter whole numbers: protein and carbs up to 800 g, fat up to 400 g, not all zero.']); return; }
    showErr('macroErr', []);
    Object.assign(state.target, { p: vals[0], c: vals[1], f: vals[2] });
    save(); renderCalc(); toast('Macro targets saved');
  });

  /* Foods */
  $('fSearch').addEventListener('input', renderFoods);
  $('filters').addEventListener('click', e => {
    const b = e.target.closest('[data-filter]');
    if (b) { activeFilter = b.dataset.filter; renderFoods(); }
  });
  $('foodGrid').addEventListener('click', e => {
    const add = e.target.closest('[data-add]'), rm = e.target.closest('[data-rm-custom]');
    if (add) { const f = findFood(add.dataset.add); if (f) openAddDialog(f); }
    if (rm) { state.custom = state.custom.filter(f => f.id !== rm.dataset.rmCustom); save(); renderFoods(); toast('Removed from My Foods'); }
  });
  $('customBtn').addEventListener('click', () => openCustomDialog());

  /* Plans */
  $('planSelect').addEventListener('change', () => { state.prefs.plan = $('planSelect').value; save(); renderPlans(); });
  $('planTarget').addEventListener('change', () => {
    const n = Number($('planTarget').value);
    if (!isFinite(n) || n < 1200 || n > 6000) { showErr('planErr', ['Plan target must be between 1,200 and 6,000 kcal.']); return; }
    showErr('planErr', []); state.prefs.planTarget = n; save(); renderPlans();
  });
  $('planUseTarget').addEventListener('click', () => { showErr('planErr', []); state.prefs.planTarget = state.target.kcal; save(); renderPlans(); });
  $('planView').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    const parts = scaledPlan(currentPlan(), planTargetValue());
    const addItems = part => part.items.forEach(i => addEntry(jDate, i.food, i.qty, part.slot.id));
    if (b.dataset.planMeal) {
      const part = parts.find(p => p.slot.id === b.dataset.planMeal);
      if (part) { addItems(part); toast(part.slot.label + ' added to journal (' + dateWord() + ')'); }
    } else if ('planDay' in b.dataset) {
      parts.forEach(addItems); toast('Whole day added to journal (' + dateWord() + ')');
    }
  });

  /* Journal */
  $('jDate').addEventListener('change', () => {
    const v = $('jDate').value;
    if (v && v <= todayStr()) { jDate = v; renderJournal(); }
    else $('jDate').value = jDate;
  });
  $('jToday').addEventListener('click', () => { jDate = todayStr(); renderJournal(); });
  $('jQuick').addEventListener('click', () => openCustomDialog());
  $('jSlots').addEventListener('click', e => {
    const edit = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
    const sf = e.target.closest('[data-slot-food]'), sc = e.target.closest('[data-slot-custom]');
    if (edit) { const en = getEntries(jDate).find(x => x.id === edit.dataset.edit); if (en) openAddDialog(en, en); }
    else if (del) { removeEntry(jDate, del.dataset.del); renderJournal(); toast('Entry deleted'); }
    else if (sf) { pendingSlot = sf.dataset.slotFood; goTo('foods'); }
    else if (sc) openCustomDialog(sc.dataset.slotCustom);
  });

  /* History */
  const openDay = d => { jDate = d; goTo('journal'); };
  $('hList').addEventListener('click', e => { const b = e.target.closest('[data-date]'); if (b) openDay(b.dataset.date); });
  $('hDate').max = todayStr();
  $('hDate').addEventListener('change', () => { const v = $('hDate').value; if (v && v <= todayStr()) openDay(v); });

  /* Reset + dialog plumbing */
  $('resetBtn').addEventListener('click', openResetDialog);
  dlg.addEventListener('submit', e => { e.preventDefault(); if (dlgSubmit) dlgSubmit(e); });
  dlg.addEventListener('input', e => { if (dlgInput) dlgInput(e); });
  dlg.addEventListener('click', e => { if (e.target === dlg || e.target.closest('[data-close]')) closeDialog(); });

  route();
}
init();
