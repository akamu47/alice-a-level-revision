/* =========================================================================
   Shared state, timetable, countdowns, daily quote, storage helpers
   ========================================================================= */

// --- Exam timetable ----------------------------------------------------
window.EXAMS = [
  { date: '2026-05-13T09:00:00', subject: 'eng', title: 'English Lit — Poetry',          paper: 'WJEC A720U10-1 · Component 1', duration: '2h', seat: 'H3' },
  { date: '2026-05-18T13:30:00', subject: 'art', title: 'History of Art — Visual Analysis & Themes', paper: 'Edexcel 9HT0/01',         duration: '3h', seat: 'J1' },
  { date: '2026-05-21T09:00:00', subject: 'pol', title: 'Politics — UK Politics',         paper: 'Edexcel 9PL0/01 · Paper 1',     duration: '2h', seat: 'F4' },
  { date: '2026-06-01T09:00:00', subject: 'eng', title: 'English Lit — Drama',            paper: 'WJEC A720U20-1 · Component 2', duration: '2h', seat: 'E3' },
  { date: '2026-06-02T09:00:00', subject: 'art', title: 'History of Art — Periods',       paper: 'Edexcel 9HT0/02',              duration: '3h', seat: 'L1' },
  { date: '2026-06-08T09:00:00', subject: 'pol', title: 'Politics — UK Government',       paper: 'Edexcel 9PL0/02 · Paper 2',    duration: '2h', seat: 'H4' },
  { date: '2026-06-10T09:00:00', subject: 'eng', title: 'English Lit — Unseen Texts',     paper: 'WJEC A720U30-1 · Component 3', duration: '2h', seat: 'K1' },
  { date: '2026-06-16T13:30:00', subject: 'pol', title: 'Politics — Comparative (USA)',   paper: 'Edexcel 9PL0/3A · Paper 3',    duration: '2h', seat: 'K4' }
];

// --- Daily motivational quotes (rotates by day-of-year, stable per day) -
window.DAILY_QUOTES = [
  { text: "You're on track for A*, A*, A — every page you revise puts those grades closer.", author: "Dad" },
  { text: "What you do today determines who you become tomorrow.", author: "Sylvia Plath" },
  { text: "The harder the conflict, the more glorious the triumph.", author: "Thomas Paine" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "Marilyn Monroe" },
  { text: "Knowledge is power. Information is liberating.", author: "Kofi Annan" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Reading furnishes the mind only with materials of knowledge; it is thinking that makes what we read ours.", author: "John Locke" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
  { text: "The only way to do great work is to love what you do — and right now, you're doing great work.", author: "Steve Jobs" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "She believed she could, so she did.", author: "R. S. Grey" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "Either I will find a way, or I will make one.", author: "Philip Sidney" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Anonymous" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "There is no substitute for hard work.", author: "Thomas Edison" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "The mind is everything. What you think you become.", author: "Buddha" },
  { text: "He who has a why to live for can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
  { text: "Stop wishing. Start doing. The exam doesn't care about wishes.", author: "Dad" },
  { text: "You are stronger than you think, smarter than you realise, and capable of more than you imagine.", author: "Anonymous" },
  { text: "Worrying does not take away tomorrow's troubles. It takes away today's peace.", author: "Anonymous" },
  { text: "Sweat is just fat crying — and revision is just confusion crying. Keep going.", author: "Dad" }
];

// --- Time helpers ------------------------------------------------------
function dayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  return Math.floor(diff / 86400000);
}

function getDailyQuote() {
  // In share mode, hide quotes from "Dad" — those are personal to Alice.
  const pool = (typeof isShareMode === 'function' && isShareMode())
    ? window.DAILY_QUOTES.filter(q => q.author !== 'Dad')
    : window.DAILY_QUOTES;
  const idx = dayOfYear() % pool.length;
  return pool[idx];
}

// Returns the EXAMS list, stripped of seat numbers when running in share mode.
function getExams() {
  if (typeof isShareMode === 'function' && isShareMode()) {
    return window.EXAMS.map(e => ({ ...e, seat: '—' }));
  }
  return window.EXAMS;
}

function timeUntil(dateStr) {
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  let diff = target - now;
  if (diff <= 0) return { past: true };
  const days = Math.floor(diff / 86400000); diff -= days * 86400000;
  const hours = Math.floor(diff / 3600000); diff -= hours * 3600000;
  const minutes = Math.floor(diff / 60000); diff -= minutes * 60000;
  const seconds = Math.floor(diff / 1000);
  return { past: false, days, hours, minutes, seconds };
}

function nextExam() {
  const now = Date.now();
  return window.EXAMS.find(e => new Date(e.date).getTime() > now);
}

function formatDate(d) {
  const dt = new Date(d);
  const opts = { weekday: 'short', day: 'numeric', month: 'short' };
  return dt.toLocaleDateString('en-GB', opts);
}

function formatTime(d) {
  const dt = new Date(d);
  return dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

// --- Storage (per-card confidence, streaks) ----------------------------
const STORE_PREFIX = 'alice_rev_';

function store(key, val) {
  try { localStorage.setItem(STORE_PREFIX + key, JSON.stringify(val)); } catch (e) {}
}
function recall(key, fallback = null) {
  try { const raw = localStorage.getItem(STORE_PREFIX + key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; }
}

function setConfidence(deckId, cardId, level) {
  const key = `confidence_${deckId}`;
  const map = recall(key, {});
  map[cardId] = { level, ts: Date.now() };
  store(key, map);
  // Update streak on any interaction
  bumpStreak();
}
function getConfidence(deckId, cardId) {
  const map = recall(`confidence_${deckId}`, {});
  return map[cardId] || null;
}
// Returns shakiest cards across all decks, sorted by recency (oldest shaky first).
// `decks` is an object: { deckId: [cardId, ...], ... }. Returns up to `limit` items
// of shape { deckId, cardId, ts }. If not enough shaky, falls back to 'okay'.
function getShakyCards(decks, limit) {
  const out = [];
  Object.keys(decks).forEach(deckId => {
    const map = recall(`confidence_${deckId}`, {});
    Object.keys(map).forEach(cardId => {
      const c = map[cardId];
      if (!c) return;
      if (c.level === 'shaky') out.push({ deckId, cardId, ts: c.ts, level: 'shaky' });
    });
  });
  // Oldest shaky first (forgotten longest)
  out.sort((a, b) => a.ts - b.ts);
  if (out.length >= limit) return out.slice(0, limit);
  // Fallback to okay-rated
  Object.keys(decks).forEach(deckId => {
    const map = recall(`confidence_${deckId}`, {});
    Object.keys(map).forEach(cardId => {
      const c = map[cardId];
      if (c && c.level === 'okay') out.push({ deckId, cardId, ts: c.ts, level: 'okay' });
    });
  });
  out.sort((a, b) => (a.level === 'shaky' ? -1 : 1) - (b.level === 'shaky' ? -1 : 1) || a.ts - b.ts);
  return out.slice(0, limit);
}

// Returns un-rated cards (not yet seen) — useful for new-user state.
function getUnseenCards(deckId, allIds, limit) {
  const map = recall(`confidence_${deckId}`, {});
  return allIds.filter(id => !map[id]).slice(0, limit);
}

function getDeckSummary(deckId, cardIds) {
  const map = recall(`confidence_${deckId}`, {});
  let shaky = 0, okay = 0, solid = 0, none = 0;
  cardIds.forEach(id => {
    const c = map[id];
    if (!c) { none++; return; }
    if (c.level === 'shaky') shaky++;
    else if (c.level === 'okay') okay++;
    else if (c.level === 'solid') solid++;
  });
  return { shaky, okay, solid, none, total: cardIds.length };
}

// --- Streak ------------------------------------------------------------
function bumpStreak() {
  const today = new Date().toDateString();
  const data = recall('streak', { last: null, count: 0, all: [] });
  if (data.last === today) return data;
  const yest = new Date(); yest.setDate(yest.getDate() - 1);
  const yesterday = yest.toDateString();
  if (data.last === yesterday) {
    data.count += 1;
  } else {
    data.count = 1;
  }
  data.last = today;
  data.all = [...new Set([...(data.all || []), today])].slice(-90);
  store('streak', data);
  return data;
}
function getStreak() { return recall('streak', { count: 0, last: null }); }

// --- Fuzzy matching for self-test (Levenshtein-based) ------------------
function normalise(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    const curr = [i];
    for (let j = 1; j <= n; j++) {
      const cost = a[i-1] === b[j-1] ? 0 : 1;
      curr[j] = Math.min(curr[j-1] + 1, prev[j] + 1, prev[j-1] + cost);
    }
    prev = curr;
  }
  return prev[n];
}
// returns 0..1, 1 = perfect match
function similarity(a, b) {
  const an = normalise(a), bn = normalise(b);
  if (!an || !bn) return 0;
  const dist = levenshtein(an, bn);
  const longer = Math.max(an.length, bn.length);
  return 1 - dist / longer;
}

// "Close enough" check — for critic names/short answers: > 0.75
function closeMatch(input, target, threshold = 0.75) {
  return similarity(input, target) >= threshold;
}

// --- Countdown DOM ticker ----------------------------------------------
function startCountdown(targetDate, els) {
  function update() {
    const t = timeUntil(targetDate);
    if (t.past) {
      if (els.days) els.days.textContent = '—';
      if (els.hours) els.hours.textContent = '';
      if (els.minutes) els.minutes.textContent = '';
      if (els.seconds) els.seconds.textContent = '';
      return;
    }
    if (els.days) els.days.textContent = t.days;
    if (els.hours) els.hours.textContent = String(t.hours).padStart(2,'0');
    if (els.minutes) els.minutes.textContent = String(t.minutes).padStart(2,'0');
    if (els.seconds) els.seconds.textContent = String(t.seconds).padStart(2,'0');
  }
  update();
  return setInterval(update, 1000);
}

// --- Shuffle, etc. -----------------------------------------------------
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// --- Stable hash for dual-coding (assigning colours/icons consistently)-
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

// --- Critic icons & colours --------------------------------------------
// Manually curated for the most-cited critics — visual hooks aid recall
const CRITIC_HOOKS = {
  'Alistair Fowler':       { emoji: '⚖️',  colour: 'var(--c4)' },  // balanced/judicial
  'Edmund Burke':          { emoji: '🔥',  colour: 'var(--c1)' },  // sublime/awful
  'Liam Haydon':           { emoji: '📜',  colour: 'var(--c7)' },
  'John Leonard':          { emoji: '🦉',  colour: 'var(--c8)' },  // measured wisdom
  'William Empson':        { emoji: '😈',  colour: 'var(--c10)' },  // "makes God so bad"
  'John Carey':            { emoji: '🌫️', colour: 'var(--c4)' },   // "wavering, slumbering"
  'Percy Shelley':         { emoji: '⚡',  colour: 'var(--c1)' },   // energy/magnificence
  'Stella Revard':         { emoji: '🌹', colour: 'var(--c10)' },
  'Gilbert and Gubar':     { emoji: '👯', colour: 'var(--c8)' },   // duo
  'Fredson Bowers':        { emoji: '🎓', colour: 'var(--c9)' },
  'Marcia Landy':          { emoji: '💍', colour: 'var(--c3)' },   // marriage roles
  'Diane McColley':        { emoji: '✨', colour: 'var(--c5)' },   // radiant Eve
  'Mike Edward':           { emoji: '🛡️', colour: 'var(--c4)' },
  'Shannon Miller':        { emoji: '⚔️',  colour: 'var(--c10)' },  // civil war
  'Matthew Jordan':        { emoji: '🤝', colour: 'var(--c6)' },
  'C.S Lewis':             { emoji: '🦁', colour: 'var(--c7)' },
  'C.S. Lewis':            { emoji: '🦁', colour: 'var(--c7)' },
  'Milton (Tetrachordon)': { emoji: '✍️',  colour: 'var(--c8)' },
  'Milton (Defensio Secunda)': { emoji: '✍️', colour: 'var(--c8)' },
  'Stanley Fish':          { emoji: '🎣', colour: 'var(--c5)' },
  'John Peter':            { emoji: '👑', colour: 'var(--c7)' },
  'Voltaire':              { emoji: '🎭', colour: 'var(--c4)' },
  'Michael Bryson':        { emoji: '💞', colour: 'var(--c3)' },
};
function critic_hook(name) {
  if (CRITIC_HOOKS[name]) return CRITIC_HOOKS[name];
  // fall back to deterministic palette for unmapped critics
  const palette = ['var(--c1)','var(--c2)','var(--c3)','var(--c4)','var(--c5)','var(--c6)','var(--c7)','var(--c8)','var(--c9)','var(--c10)'];
  const emojis = ['📚','🔮','🌿','⛰️','🌊','🕯️','🪶','🗝️','🎯','🌙'];
  const idx = hashStr(name);
  return { emoji: emojis[idx % emojis.length], colour: palette[idx % palette.length] };
}

// Theme icon hooks
const THEME_HOOKS = {
  'Marriage':  { emoji: '💍', colour: 'var(--c3)' },
  'Love':      { emoji: '❤️', colour: 'var(--c10)' },
  'Power':     { emoji: '👑', colour: 'var(--c8)' },
  'Gender':    { emoji: '⚖️', colour: 'var(--c4)' },
  'Setting':   { emoji: '🌳', colour: 'var(--c6)' },
  'Tragedy':   { emoji: '🎭', colour: 'var(--c9)' },
  'Free Will': { emoji: '🦋', colour: 'var(--c5)' },
  'Hierarchy & Order': { emoji: '🏛️', colour: 'var(--c7)' },
  'Innocence': { emoji: '🕊️', colour: 'var(--c5)' },
  "Eve's Ambition": { emoji: '🍎', colour: 'var(--c1)' },
  'Postlapsarian Lust': { emoji: '🔥', colour: 'var(--c10)' },
  'Blame for the Fall — Eve': { emoji: '🐍', colour: 'var(--c8)' },
  'Human Perfection': { emoji: '✨', colour: 'var(--c2)' },
  'Satan as Tragic Hero':   { emoji: '😈', colour: 'var(--c8)' },
  'Satan Diminished':       { emoji: '🐛', colour: 'var(--c4)' },
  'Satan as Vehicle':       { emoji: '🎯', colour: 'var(--c9)' },
  'Satan Sympathised':      { emoji: '💔', colour: 'var(--c10)' },
  "Satan's Seduction":      { emoji: '🗣️', colour: 'var(--c1)' },
  'Mutual Seduction':       { emoji: '🪞', colour: 'var(--c3)' },
  "Milton's Aesthetic Seduction": { emoji: '✒️', colour: 'var(--c7)' },
  'The Allure of Sin':      { emoji: '🍎', colour: 'var(--c1)' },
  'Consequences of Sin':    { emoji: '⚡', colour: 'var(--c9)' },
  'Sin as Theological Necessity': { emoji: '⛪', colour: 'var(--c4)' },
};
function theme_hook(name) {
  if (THEME_HOOKS[name]) return THEME_HOOKS[name];
  const palette = ['var(--c1)','var(--c2)','var(--c3)','var(--c4)','var(--c5)','var(--c6)','var(--c7)','var(--c8)','var(--c9)','var(--c10)'];
  return { emoji: '📖', colour: palette[hashStr(name) % palette.length] };
}

// --- Render helpers ---------------------------------------------------
function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k,v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== null && v !== undefined) e.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null) continue;
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return e;
}

/* =========================================================================
   BLURT-FIRST RECALL — universal forced-recall component
   =========================================================================
   Usage:
     blurtRecall({
       prompt: 'What does Adam say?',                       // shown above input
       targets: [{label:'quote-1', text:'…the bond of nature…'}, ...],
       hint: cardData => 'first letters: T b o n d…',       // optional fn or string
       reveal: () => HTMLElement,                           // builds the staggered reveal
       onComplete: ({score}) => { // set confidence, advance
     })
   The widget enforces:
     - input box where user must blurt or click 'Don't know' / 'Hint' to proceed
     - fuzzy match against any target → ✓ / close / no
     - stagger-animated reveal (uses .stagger-item)
     - a non-empty placeholder so the reveal box is never blank
   ========================================================================= */
function blurtRecall(opts) {
  const wrap = el('div', { class: 'blurt-wrap' });

  // Prompt
  if (opts.prompt) wrap.appendChild(el('p', { class: 'blurt-prompt' }, opts.prompt));

  // Input row — textarea (multi-line for quote recall)
  const input = el('textarea', {
    placeholder: opts.placeholder || 'Type what you remember… (Enter to check, Shift+Enter for newline)',
    class: 'blurt-input',
    rows: '3'
  });
  wrap.appendChild(input);

  // Buttons row
  const btnRow = el('div', { class: 'blurt-btns' });
  const checkBtn = el('button', { class: 'btn btn-primary' }, '✓ Check');
  const hintBtn = el('button', { class: 'btn btn-ghost' }, '💡 Hint');
  const dontKnowBtn = el('button', { class: 'btn btn-ghost' }, '? Don\u2019t know');
  btnRow.appendChild(checkBtn);
  btnRow.appendChild(hintBtn);
  btnRow.appendChild(dontKnowBtn);
  wrap.appendChild(btnRow);

  // Score / hint area
  const scoreEl = el('div', { class: 'blurt-score' });
  wrap.appendChild(scoreEl);

  // Reveal area (filled on action)
  const revealEl = el('div', { class: 'blurt-reveal' });
  wrap.appendChild(revealEl);

  let resolved = false;
  let hintLevel = 0; // increments on each hint click

  function bestMatch(text) {
    if (!text || !opts.targets) return { sim: 0, target: null };
    let best = { sim: 0, target: null };
    opts.targets.forEach(t => {
      const s = similarity(text, t.text);
      if (s > best.sim) best = { sim: s, target: t };
    });
    return best;
  }

  function showScore(sim) {
    let label, cls;
    if (sim >= 0.75) { label = '✓ Strong recall — ' + Math.round(sim*100) + '%'; cls = 'good'; }
    else if (sim >= 0.40) { label = '~ Close — ' + Math.round(sim*100) + '% match'; cls = 'close'; }
    else if (sim > 0) { label = '✗ Not quite — ' + Math.round(sim*100) + '%'; cls = 'no'; }
    else { label = '✗ No match yet'; cls = 'no'; }
    scoreEl.innerHTML = '';
    scoreEl.appendChild(el('span', { class: 'blurt-score-pill ' + cls }, label));
  }

  function reveal(reason) {
    if (resolved) return;
    resolved = true;
    input.disabled = true;
    checkBtn.disabled = true;
    hintBtn.disabled = true;
    dontKnowBtn.disabled = true;
    // Compute final similarity
    const guess = input.value.trim();
    const bm = bestMatch(guess);
    if (reason === 'check') showScore(bm.sim);
    else if (reason === 'dontknow') {
      scoreEl.innerHTML = '';
      scoreEl.appendChild(el('span', { class: 'blurt-score-pill no' }, 'No problem — here it is. Re-read carefully.'));
    }
    // Build the staggered reveal
    const content = opts.reveal ? opts.reveal() : el('div', { class: 'muted' }, '(no notes)');
    revealEl.innerHTML = '';
    revealEl.appendChild(content);
    // Apply stagger animation: include the content root itself if it carries the class,
    // plus any descendants. Without this, a content node with `class="stagger-item"` would
    // stay at opacity:0 and hide all children visually (the "empty white box" bug).
    const items = [];
    if (content.classList && content.classList.contains('stagger-item')) items.push(content);
    items.push(...content.querySelectorAll('.stagger-item'));
    items.forEach((it, ix) => {
      it.style.animationDelay = (ix * 140) + 'ms';
      it.classList.add('stagger-go');
    });
    if (opts.onComplete) {
      // Pass score so caller can set confidence accordingly
      opts.onComplete({ score: bm.sim, reason });
    }
  }

  function showHint() {
    hintLevel++;
    let h;
    if (typeof opts.hint === 'function') h = opts.hint(hintLevel);
    else if (typeof opts.hint === 'string') h = opts.hint;
    else if (opts.targets && opts.targets[0]) {
      // Default: progressive first-letter hint
      const txt = opts.targets[0].text || '';
      const words = txt.split(/\s+/).slice(0, 8);
      if (hintLevel === 1) {
        // Show first letter of each word
        h = '🔡 ' + words.map(w => w[0] ? w[0] + '_'.repeat(Math.max(0, w.length - 1)) : '').join(' ');
      } else if (hintLevel === 2) {
        // Show first two words
        h = '✏️ Starts with: \u201c' + words.slice(0, 2).join(' ') + '…\u201d';
      } else {
        // Show half the quote
        h = '📖 First half: \u201c' + txt.slice(0, Math.floor(txt.length / 2)) + '…\u201d';
      }
    } else {
      h = '(no hint available)';
    }
    scoreEl.innerHTML = '';
    scoreEl.appendChild(el('span', { class: 'blurt-score-pill close' }, h));
  }

  checkBtn.addEventListener('click', () => reveal('check'));
  dontKnowBtn.addEventListener('click', () => reveal('dontknow'));
  hintBtn.addEventListener('click', showHint);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); reveal('check'); }
  });

  setTimeout(() => input.focus(), 60);
  return wrap;
}

/* -------------------------------------------------------------------------
   wrapStaggerItems(parent) — utility: walks direct children of `parent` and
   adds the `.stagger-item` class so blurtRecall can animate them in turn.
   Also assigns visual variation: alternating colour accents, slight font-size
   variation, and rotating display fonts for memorability.
   ------------------------------------------------------------------------- */
function wrapStaggerItems(parent) {
  const accents = ['var(--c1)','var(--c8)','var(--c5)','var(--c3)','var(--c10)','var(--c4)','var(--c7)','var(--c2)'];
  const sizes  = ['1.05rem','1.15rem','1rem','1.1rem'];
  const fonts  = ['var(--font-display)','var(--font-display)','var(--font-sans)']; // mostly serif
  Array.from(parent.children).forEach((child, i) => {
    child.classList.add('stagger-item');
    if (!child.style.borderLeft) child.style.borderLeft = '3px solid ' + accents[i % accents.length];
    if (!child.style.fontSize)   child.style.fontSize   = sizes[i % sizes.length];
    if (!child.style.fontFamily) child.style.fontFamily = fonts[i % fonts.length];
    child.style.paddingLeft = child.style.paddingLeft || '12px';
    child.style.marginBottom = child.style.marginBottom || '8px';
  });
  return parent;
}

/* -------------------------------------------------------------------------
   buildClozeQuote(targetText) — returns:
     { gappedNode: HTMLElement, check: (input) => similarity }
   Two cloze styles: whole-gap (entire quote hidden, one input box) and
   first-two-words (shows the first 2 words then a long gap to complete).
   ------------------------------------------------------------------------- */
function buildClozeQuote(text, mode) {
  const wrap = el('div', { class: 'cloze' });
  const words = text.split(/\s+/);
  if (mode === 'whole') {
    wrap.appendChild(el('span', { class: 'cloze-gap' }, '_'.repeat(Math.min(40, text.length))));
  } else {
    // first-two-words variant
    const first = words.slice(0, 2).join(' ');
    wrap.appendChild(el('span', { class: 'cloze-shown' }, '\u201c' + first + ' '));
    wrap.appendChild(el('span', { class: 'cloze-gap' }, '_'.repeat(Math.min(40, text.length - first.length))));
    wrap.appendChild(el('span', { class: 'cloze-shown' }, '\u201d'));
  }
  return wrap;
}

/* -------------------------------------------------------------------------
   isShareMode() / shareUserName() / shouldHidePersonal()
   ------------------------------------------------------------------------- */
function isShareMode() {
  return location.pathname.includes('/share') ||
         location.search.includes('share=1') ||
         location.hash === '#share' ||
         (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('alice_rev_share_session') === '1');
}

// Persist share mode for the session so internal links don't break it.
(function persistShareMode() {
  if (typeof sessionStorage === 'undefined') return;
  if (location.search.includes('share=1') || location.pathname.includes('/share')) {
    try { sessionStorage.setItem('alice_rev_share_session', '1'); } catch (e) {}
  }
})();

// In share mode, replace the "Alice's Revision" brand text with a generic label.
(function rebrandInShareMode() {
  if (typeof document === 'undefined') return;
  document.addEventListener('DOMContentLoaded', () => {
    if (!isShareMode()) return;
    document.body.classList.add('share-mode');
    const brand = document.querySelector('.nav .brand');
    if (brand) brand.textContent = 'A-Level Revision';
    if (document.title.includes("Alice's Revision")) {
      document.title = document.title.replace("Alice's Revision", 'A-Level Revision');
    }
  });
})();

// Patch internal navigation in share mode so the ?share=1 flag survives clicks.
(function patchShareLinks() {
  if (typeof document === 'undefined') return;
  document.addEventListener('click', e => {
    if (!isShareMode()) return;
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href) return;
    // Skip external, mailto, and anchor-only links
    if (/^(https?:|mailto:|tel:|#)/i.test(href)) return;
    if (href.includes('share=1')) return;
    // Append ?share=1 (or &share=1) to the href just-in-time
    const sep = href.includes('?') ? '&' : '?';
    a.setAttribute('href', href + sep + 'share=1');
  }, true);
})();
function shareUserName() {
  return recall('share_name', null);
}
function setShareUserName(name) {
  store('share_name', name);
}

// --- Cache busting hint -----------------------------------------------
window.APP_VERSION = '20260504145300';

// --- Register service worker (cache-busted per deploy) ----------------
(function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  // Resolve sw.js relative to the repo root regardless of current page depth
  const isSub = location.pathname.includes('/subjects/');
  const swUrl = (isSub ? '../' : './') + 'sw.js?v=' + window.APP_VERSION;
  const scope = isSub ? '../' : './';
  let refreshed = false;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(swUrl, { scope }).then((reg) => {
      // Force the SW script itself to be re-fetched on every page load and
      // whenever the tab regains focus. Without this, browsers only re-check
      // sw.js every ~24h, so a stale SW keeps serving old assets.
      try { reg.update(); } catch (e) {}
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          try { reg.update(); } catch (e) {}
        }
      });
    }).catch(() => {});
    // When a new SW takes control (after a deploy), reload once so users
    // see fresh assets without a manual hard refresh.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshed) return;
      refreshed = true;
      location.reload();
    });
  });
})();

// --- On every page, bump streak quietly the first time per day --------
(function autoStreak() {
  const today = new Date().toDateString();
  const data = recall('streak', { last: null });
  if (data.last !== today) {
    // don't bump until they interact - this is touched by setConfidence / submit answers
  }
})();
