/* =====================================================================
   Flashcards module — Alice's Revision
   User-created decks per (subject, paper). All in localStorage.
   Public entry point: window.buildFlashcards(area, subjectKey)
     subjectKey ∈ 'eng' | 'pol' | 'art'
   Depends on shared.js helpers: el, store, recall (via STORE_PREFIX),
   and window.EXAMS for paper enumeration.
   ===================================================================== */

(function () {

const STORAGE_KEY = 'alice_flashcards_v1';

const FONTS = [
  { id: 'serif',   label: 'Serif (Fraunces)',     css: 'Fraunces, Georgia, serif' },
  { id: 'sans',    label: 'Sans (Inter)',          css: 'Inter, system-ui, sans-serif' },
  { id: 'mono',    label: 'Mono',                  css: 'ui-monospace, SFMono-Regular, Menlo, monospace' },
  { id: 'hand',    label: 'Handwritten',           css: '"Caveat", "Comic Sans MS", cursive' }
];

const TEXT_COLOURS = [
  { id: 'ink',   label: 'Default ink',   value: 'var(--ink)' },
  { id: 'eng',   label: 'English green', value: 'var(--eng)' },
  { id: 'pol',   label: 'Politics teal', value: 'var(--pol)' },
  { id: 'art',   label: 'Art burgundy',  value: 'var(--art)' },
  { id: 'plum',  label: 'Plum',          value: '#7A3270' },
  { id: 'slate', label: 'Slate',         value: '#3D4A55' }
];

const BG_COLOURS = [
  { id: 'cream', label: 'Cream',  value: '#FBF7EE' },
  { id: 'white', label: 'White',  value: '#FFFFFF' },
  { id: 'mint',  label: 'Mint',   value: '#E7F1EA' },
  { id: 'blush', label: 'Blush',  value: '#F6E7E5' }
];

const SUBJECT_LABEL = { eng: 'English', pol: 'Politics', art: 'History of Art' };

// ---- Storage --------------------------------------------------------------
function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}
function saveAll(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
}
function getDeck(subjectKey, paperId) {
  const all = loadAll();
  const subj = all[subjectKey] || {};
  return subj[paperId] || { cards: [], style: { font: 'serif', color: 'ink', bg: 'cream' } };
}
function setDeck(subjectKey, paperId, deck) {
  const all = loadAll();
  if (!all[subjectKey]) all[subjectKey] = {};
  all[subjectKey][paperId] = deck;
  saveAll(all);
}
function newId() {
  return 'c_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}

// ---- Paper enumeration from EXAMS ----------------------------------------
function papersForSubject(subjectKey) {
  const exams = (window.EXAMS || []).filter(e => e.subject === subjectKey);
  return exams.map(e => ({
    id: paperIdFromExam(e),
    title: e.title.replace(/^[^—]+—\s*/, '').trim(), // "English Lit — Poetry" → "Poetry"
    paper: e.paper,
    date: e.date
  }));
}
function paperIdFromExam(e) {
  // stable id derived from the paper code so storage survives data tweaks
  return (e.paper || e.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ---- Public entry point ---------------------------------------------------
window.buildFlashcards = function buildFlashcards(area, subjectKey) {
  area.appendChild(el('h2', { class: 'serif' }, '🃏 Flashcards'));
  area.appendChild(el('p', { class: 'muted', style: 'margin-bottom: 18px; font-size:.92rem' },
    'Make your own deck for each paper. Click a card to flip it. Use ←/→ or the buttons to move. Cards shuffle each session.'));

  const papers = papersForSubject(subjectKey);
  if (!papers.length) {
    area.appendChild(el('p', { class: 'muted' }, 'No papers found for this subject yet.'));
    return;
  }

  // Paper picker
  const grid = el('div', { class: 'mode-grid', style: 'margin-bottom: 18px' });
  papers.forEach(p => {
    const deck = getDeck(subjectKey, p.id);
    const count = deck.cards.length;
    const card = el('a', { class: 'mode-card', href: '#' },
      el('span', { class: 'icon' }, '🃏'),
      el('h3', {}, p.title),
      el('p', {}, p.paper + ' · ' + count + ' card' + (count === 1 ? '' : 's'))
    );
    card.addEventListener('click', e => {
      e.preventDefault();
      // Preserve any sibling "back to modes" button that the host (subject page) added
      const preserved = Array.from(area.children).filter(c =>
        c.tagName === 'BUTTON' && /back to modes/i.test(c.textContent || ''));
      area.innerHTML = '';
      preserved.forEach(b => area.appendChild(b));
      const back = el('button', { class: 'btn btn-ghost', style: 'margin: 4px 0 8px 8px' },
        '← back to papers');
      back.addEventListener('click', () => {
        // Wipe everything except the preserved "back to modes" button
        const keep = Array.from(area.children).filter(c =>
          c.tagName === 'BUTTON' && /back to modes/i.test(c.textContent || ''));
        area.innerHTML = '';
        keep.forEach(b => area.appendChild(b));
        window.buildFlashcards(area, subjectKey);
      });
      area.appendChild(back);
      renderDeck(area, subjectKey, p);
    });
    grid.appendChild(card);
  });
  area.appendChild(grid);
};

// ---- Per-deck view --------------------------------------------------------
function renderDeck(area, subjectKey, paper) {
  area.appendChild(el('h2', { class: 'serif' },
    SUBJECT_LABEL[subjectKey] + ' · ' + paper.title));
  area.appendChild(el('p', { class: 'muted', style: 'font-size:.88rem; margin-bottom:14px' }, paper.paper));

  const tabBar = el('div', { class: 'fc-tabs' });
  const studyTab  = tabEl('Study', true);
  const editTab   = tabEl('Manage cards', false);
  const styleTab  = tabEl('Style', false);
  tabBar.appendChild(studyTab); tabBar.appendChild(editTab); tabBar.appendChild(styleTab);
  area.appendChild(tabBar);

  const body = el('div', { class: 'fc-body' });
  area.appendChild(body);

  function show(name) {
    [studyTab, editTab, styleTab].forEach(t => t.classList.remove('active'));
    if (name === 'study') studyTab.classList.add('active');
    if (name === 'edit')  editTab.classList.add('active');
    if (name === 'style') styleTab.classList.add('active');
    body.innerHTML = '';
    if (name === 'study') renderStudy(body, subjectKey, paper);
    if (name === 'edit')  renderEditor(body, subjectKey, paper, () => show('edit'));
    if (name === 'style') renderStyle(body, subjectKey, paper, () => show('style'));
  }
  studyTab.addEventListener('click', () => show('study'));
  editTab.addEventListener('click',  () => show('edit'));
  styleTab.addEventListener('click', () => show('style'));
  show('study');
}

function tabEl(label, active) {
  return el('button', { class: 'fc-tab' + (active ? ' active' : ''), type: 'button' }, label);
}

// ---- Study mode -----------------------------------------------------------
function renderStudy(host, subjectKey, paper) {
  const deck = getDeck(subjectKey, paper.id);
  if (!deck.cards.length) {
    host.appendChild(el('div', { class: 'fc-empty' },
      el('p', {}, 'No cards yet for this paper.'),
      (() => {
        const btn = el('button', { class: 'btn btn-primary', type: 'button' }, '+ Add your first card');
        btn.addEventListener('click', () => {
          // Switch to edit tab
          const tabs = host.parentElement.querySelectorAll('.fc-tab');
          if (tabs[1]) tabs[1].click();
        });
        return btn;
      })()
    ));
    return;
  }

  // Shuffle order
  const order = shuffle(deck.cards.map((_, i) => i));
  let pos = 0;
  let flipped = false;

  const stage = el('div', { class: 'fc-stage' });
  const counter = el('p', { class: 'fc-counter' });
  const cardEl = el('div', { class: 'fc-card', tabindex: '0' });
  const inner = el('div', { class: 'fc-card-inner' });
  const front = el('div', { class: 'fc-card-face fc-front' });
  const back  = el('div', { class: 'fc-card-face fc-back' });
  inner.appendChild(front); inner.appendChild(back);
  cardEl.appendChild(inner);
  stage.appendChild(counter);
  stage.appendChild(cardEl);

  // Controls row
  const controls = el('div', { class: 'fc-controls' },
    btn('← Prev', () => { pos = (pos - 1 + order.length) % order.length; flipped = false; paint(); }),
    btn('Flip',   () => { flipped = !flipped; paint(); }, 'btn-primary'),
    btn('Next →', () => { pos = (pos + 1) % order.length; flipped = false; paint(); })
  );

  const utils = el('div', { class: 'fc-utils' },
    btn('Re-shuffle', () => {
      const re = shuffle(deck.cards.map((_, i) => i));
      order.length = 0; re.forEach(x => order.push(x));
      pos = 0; flipped = false; paint();
    }, 'btn-ghost'),
    el('span', { class: 'fc-tip' }, 'Tip: ←/→ to move · Space/Enter to flip')
  );

  host.appendChild(stage);
  host.appendChild(controls);
  host.appendChild(utils);

  function paint() {
    const card = deck.cards[order[pos]];
    counter.textContent = (pos + 1) + ' / ' + order.length;
    front.textContent = card.a;
    back.textContent  = card.b;
    cardEl.classList.toggle('flipped', flipped);
    applyStyle(cardEl, deck.style);
  }

  cardEl.addEventListener('click', () => { flipped = !flipped; paint(); });
  cardEl.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { pos = (pos - 1 + order.length) % order.length; flipped = false; paint(); e.preventDefault(); }
    if (e.key === 'ArrowRight') { pos = (pos + 1) % order.length;                  flipped = false; paint(); e.preventDefault(); }
    if (e.key === ' ' || e.key === 'Enter') { flipped = !flipped; paint(); e.preventDefault(); }
  });
  // Page-level keyboard too (only while study is active in this host)
  function onKey(e) {
    if (!host.isConnected) { document.removeEventListener('keydown', onKey); return; }
    if (document.activeElement && document.activeElement.tagName === 'TEXTAREA') return;
    if (document.activeElement && document.activeElement.tagName === 'INPUT')    return;
    if (e.key === 'ArrowLeft')  { pos = (pos - 1 + order.length) % order.length; flipped = false; paint(); }
    else if (e.key === 'ArrowRight') { pos = (pos + 1) % order.length;            flipped = false; paint(); }
    else if (e.key === ' ' || e.key === 'Enter') {
      // Only if focus is on the card or body
      if (document.activeElement === document.body || document.activeElement === cardEl) {
        flipped = !flipped; paint(); e.preventDefault();
      }
    }
  }
  document.addEventListener('keydown', onKey);

  paint();
  setTimeout(() => cardEl.focus(), 50);
}

function btn(label, onClick, cls = '') {
  const b = el('button', { class: 'btn ' + cls, type: 'button' }, label);
  b.addEventListener('click', onClick);
  return b;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function applyStyle(cardEl, style) {
  const f = FONTS.find(x => x.id === style.font) || FONTS[0];
  const c = TEXT_COLOURS.find(x => x.id === style.color) || TEXT_COLOURS[0];
  const bg = BG_COLOURS.find(x => x.id === style.bg) || BG_COLOURS[0];
  cardEl.style.setProperty('--fc-font',  f.css);
  cardEl.style.setProperty('--fc-color', c.value);
  cardEl.style.setProperty('--fc-bg',    bg.value);
}

// ---- Editor (manage cards) -----------------------------------------------
function renderEditor(host, subjectKey, paper, refresh) {
  const deck = getDeck(subjectKey, paper.id);

  // New card form
  const form = el('div', { class: 'fc-form' });
  form.appendChild(el('h3', { class: 'serif' }, '+ New card'));
  const ta1 = el('textarea', { class: 'fc-input', rows: '2', placeholder: 'Side A — question, term, prompt…' });
  const ta2 = el('textarea', { class: 'fc-input', rows: '3', placeholder: 'Side B — answer, definition…' });
  form.appendChild(label('Side A', ta1));
  form.appendChild(label('Side B', ta2));
  const addBtn = btn('Add card', () => {
    const a = ta1.value.trim();
    const b = ta2.value.trim();
    if (!a || !b) { ta1.focus(); return; }
    deck.cards.push({ id: newId(), a, b });
    setDeck(subjectKey, paper.id, deck);
    refresh();
  }, 'btn-primary');
  form.appendChild(addBtn);
  host.appendChild(form);

  // Existing cards
  host.appendChild(el('h3', { class: 'serif', style: 'margin-top: 24px' },
    'Cards in this deck (' + deck.cards.length + ')'));
  if (!deck.cards.length) {
    host.appendChild(el('p', { class: 'muted' }, 'No cards yet.'));
    return;
  }
  const list = el('div', { class: 'fc-list' });
  deck.cards.forEach((card, idx) => {
    list.appendChild(renderCardRow(card, idx, deck, subjectKey, paper, refresh));
  });
  host.appendChild(list);
}

function renderCardRow(card, idx, deck, subjectKey, paper, refresh) {
  const row = el('div', { class: 'fc-row' });
  const num = el('span', { class: 'fc-num' }, '#' + (idx + 1));
  const aSide = el('div', { class: 'fc-side' },
    el('span', { class: 'fc-side-lbl' }, 'A'),
    el('span', { class: 'fc-side-text' }, card.a)
  );
  const bSide = el('div', { class: 'fc-side' },
    el('span', { class: 'fc-side-lbl' }, 'B'),
    el('span', { class: 'fc-side-text' }, card.b)
  );
  const editBtn = btn('Edit', () => {
    row.innerHTML = '';
    const ea = el('textarea', { class: 'fc-input', rows: '2' });
    ea.value = card.a;
    const eb = el('textarea', { class: 'fc-input', rows: '3' });
    eb.value = card.b;
    row.appendChild(label('Side A', ea));
    row.appendChild(label('Side B', eb));
    const save = btn('Save', () => {
      const a = ea.value.trim(), b = eb.value.trim();
      if (!a || !b) return;
      card.a = a; card.b = b;
      setDeck(subjectKey, paper.id, deck);
      refresh();
    }, 'btn-primary');
    const cancel = btn('Cancel', () => refresh(), 'btn-ghost');
    row.appendChild(el('div', { class: 'fc-row-actions' }, save, cancel));
  }, 'btn-ghost');
  const delBtn = btn('Delete', () => {
    if (!confirm('Delete card #' + (idx + 1) + '?')) return;
    deck.cards.splice(idx, 1);
    setDeck(subjectKey, paper.id, deck);
    refresh();
  }, 'btn-ghost danger');
  row.appendChild(num);
  row.appendChild(aSide);
  row.appendChild(bSide);
  row.appendChild(el('div', { class: 'fc-row-actions' }, editBtn, delBtn));
  return row;
}

function label(text, control) {
  const wrap = el('label', { class: 'fc-label' });
  wrap.appendChild(el('span', {}, text));
  wrap.appendChild(control);
  return wrap;
}

// ---- Style tab ------------------------------------------------------------
function renderStyle(host, subjectKey, paper, refresh) {
  const deck = getDeck(subjectKey, paper.id);

  host.appendChild(el('h3', { class: 'serif' }, 'Card style'));
  host.appendChild(el('p', { class: 'muted', style: 'font-size:.88rem' },
    'Choose how this deck looks. Settings are saved per paper.'));

  // Font picker
  host.appendChild(el('h4', { style: 'margin-top:18px' }, 'Font'));
  const fontWrap = el('div', { class: 'fc-swatches' });
  FONTS.forEach(f => {
    const sw = el('button', {
      class: 'fc-swatch fc-font-swatch' + (deck.style.font === f.id ? ' active' : ''),
      type: 'button',
      style: 'font-family: ' + f.css
    }, 'Aa · ' + f.label);
    sw.addEventListener('click', () => {
      deck.style.font = f.id;
      setDeck(subjectKey, paper.id, deck);
      refresh();
    });
    fontWrap.appendChild(sw);
  });
  host.appendChild(fontWrap);

  // Text colour
  host.appendChild(el('h4', { style: 'margin-top:18px' }, 'Text colour'));
  const colWrap = el('div', { class: 'fc-swatches' });
  TEXT_COLOURS.forEach(c => {
    const sw = el('button', {
      class: 'fc-swatch fc-color-swatch' + (deck.style.color === c.id ? ' active' : ''),
      type: 'button',
      style: 'color:' + c.value
    }, '● ' + c.label);
    sw.addEventListener('click', () => {
      deck.style.color = c.id;
      setDeck(subjectKey, paper.id, deck);
      refresh();
    });
    colWrap.appendChild(sw);
  });
  host.appendChild(colWrap);

  // Background
  host.appendChild(el('h4', { style: 'margin-top:18px' }, 'Card background'));
  const bgWrap = el('div', { class: 'fc-swatches' });
  BG_COLOURS.forEach(c => {
    const sw = el('button', {
      class: 'fc-swatch fc-bg-swatch' + (deck.style.bg === c.id ? ' active' : ''),
      type: 'button',
      style: 'background:' + c.value
    }, c.label);
    sw.addEventListener('click', () => {
      deck.style.bg = c.id;
      setDeck(subjectKey, paper.id, deck);
      refresh();
    });
    bgWrap.appendChild(sw);
  });
  host.appendChild(bgWrap);

  // Live preview
  host.appendChild(el('h4', { style: 'margin-top: 24px' }, 'Preview'));
  const preview = el('div', { class: 'fc-card', style: 'margin: 12px auto; max-width: 420px; height: 220px' });
  const pinner = el('div', { class: 'fc-card-inner' });
  const pf = el('div', { class: 'fc-card-face fc-front' }, 'Side A preview');
  const pb = el('div', { class: 'fc-card-face fc-back'  }, 'Side B preview');
  pinner.appendChild(pf); pinner.appendChild(pb);
  preview.appendChild(pinner);
  applyStyle(preview, deck.style);
  preview.addEventListener('click', () => preview.classList.toggle('flipped'));
  host.appendChild(preview);
  host.appendChild(el('p', { class: 'muted', style: 'text-align:center; font-size:.85rem' }, 'Click the preview to flip.'));
}

})();
