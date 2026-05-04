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
function newId(prefix) {
  return (prefix || 'c') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}
function defaultStyle() { return { font: 'serif', color: 'ink', bg: 'cream' }; }
function newSet(name) {
  return { id: newId('set'), name: name || 'My set', cards: [], style: defaultStyle() };
}

/**
 * Returns `{ sets: [ {id, name, cards, style}, ... ] }` for a paper.
 * Migrates older shape `{cards, style}` to a single set called "My cards".
 */
function getPaper(subjectKey, paperId) {
  const all = loadAll();
  const subj = all[subjectKey] || {};
  let paper = subj[paperId];
  if (!paper) return { sets: [] };
  // Migrate legacy: { cards: [...], style: {...} }  ->  { sets: [{...}] }
  if (Array.isArray(paper.cards) && !paper.sets) {
    const migrated = {
      sets: [{
        id: newId('set'),
        name: 'My cards',
        cards: paper.cards,
        style: paper.style || defaultStyle()
      }]
    };
    setPaper(subjectKey, paperId, migrated);
    return migrated;
  }
  if (!paper.sets) paper.sets = [];
  return paper;
}
function setPaper(subjectKey, paperId, paperData) {
  const all = loadAll();
  if (!all[subjectKey]) all[subjectKey] = {};
  all[subjectKey][paperId] = paperData;
  saveAll(all);
}
function getSet(subjectKey, paperId, setId) {
  const paper = getPaper(subjectKey, paperId);
  return paper.sets.find(s => s.id === setId);
}
function updateSet(subjectKey, paperId, setId, mutator) {
  const paper = getPaper(subjectKey, paperId);
  const set = paper.sets.find(s => s.id === setId);
  if (!set) return;
  mutator(set);
  setPaper(subjectKey, paperId, paper);
}
function addSet(subjectKey, paperId, name) {
  const paper = getPaper(subjectKey, paperId);
  const set = newSet(name);
  paper.sets.push(set);
  setPaper(subjectKey, paperId, paper);
  return set;
}
function deleteSet(subjectKey, paperId, setId) {
  const paper = getPaper(subjectKey, paperId);
  paper.sets = paper.sets.filter(s => s.id !== setId);
  setPaper(subjectKey, paperId, paper);
}
function renameSet(subjectKey, paperId, setId, name) {
  updateSet(subjectKey, paperId, setId, s => { s.name = name; });
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

// ---- Helpers: preserve subject-page "back to modes" button across rerenders
function grabModesBackBtn(area) {
  return Array.from(area.children).filter(c =>
    c.tagName === 'BUTTON' && /back to modes/i.test(c.textContent || ''));
}
function resetWithBack(area, backLabel, onBack) {
  const preserved = grabModesBackBtn(area);
  area.innerHTML = '';
  preserved.forEach(b => area.appendChild(b));
  if (backLabel) {
    const back = el('button', { class: 'btn btn-ghost', style: 'margin: 4px 0 8px 8px' }, backLabel);
    back.addEventListener('click', onBack);
    area.appendChild(back);
  }
}

// ---- Public entry point: paper picker --------------------------------------
window.buildFlashcards = function buildFlashcards(area, subjectKey) {
  area.appendChild(el('h2', { class: 'serif' }, '🃏 Flashcards'));
  area.appendChild(el('p', { class: 'muted', style: 'margin-bottom: 18px; font-size:.92rem' },
    'Make your own decks for each paper. You can have several sets per paper — name each one (e.g. "Critics", "Quotes", "Concepts").'));

  const papers = papersForSubject(subjectKey);
  if (!papers.length) {
    area.appendChild(el('p', { class: 'muted' }, 'No papers found for this subject yet.'));
    return;
  }

  // Paper picker — show paper title + how many sets / total cards exist
  const grid = el('div', { class: 'mode-grid', style: 'margin-bottom: 18px' });
  papers.forEach(p => {
    const paperData = getPaper(subjectKey, p.id);
    const setCount = paperData.sets.length;
    const totalCards = paperData.sets.reduce((sum, s) => sum + s.cards.length, 0);
    const summary = setCount === 0
      ? 'No sets yet'
      : setCount + ' set' + (setCount === 1 ? '' : 's') + ' · ' +
        totalCards + ' card' + (totalCards === 1 ? '' : 's');
    const card = el('a', { class: 'mode-card', href: '#' },
      el('span', { class: 'icon' }, '🃏'),
      el('h3', {}, p.title),
      el('p', {}, p.paper + ' · ' + summary)
    );
    card.addEventListener('click', e => {
      e.preventDefault();
      resetWithBack(area, '← back to papers', () => {
        resetWithBack(area, null);
        window.buildFlashcards(area, subjectKey);
      });
      renderSetsPicker(area, subjectKey, p);
    });
    grid.appendChild(card);
  });
  area.appendChild(grid);
};

// ---- Sets picker (one per paper) ------------------------------------------
function renderSetsPicker(area, subjectKey, paper) {
  area.appendChild(el('h2', { class: 'serif' },
    SUBJECT_LABEL[subjectKey] + ' · ' + paper.title));
  area.appendChild(el('p', { class: 'muted', style: 'font-size:.88rem; margin-bottom: 16px' }, paper.paper));

  const paperData = getPaper(subjectKey, paper.id);

  const refresh = () => {
    resetWithBack(area, '← back to papers', () => {
      resetWithBack(area, null);
      window.buildFlashcards(area, subjectKey);
    });
    renderSetsPicker(area, subjectKey, paper);
  };

  // "+ New set" form (always visible)
  const newWrap = el('div', { class: 'fc-newset' });
  newWrap.appendChild(el('h3', { class: 'serif', style: 'margin: 0 0 8px' }, '+ New set'));
  const nameInput = el('input', {
    class: 'fc-input', type: 'text',
    placeholder: 'e.g. "Critics", "Key quotes", "Concepts"',
    maxlength: '60'
  });
  const newRow = el('div', { class: 'fc-newset-row' }, nameInput);
  const createBtn = btn('Create set', () => {
    const name = (nameInput.value || '').trim() || ('Set ' + (paperData.sets.length + 1));
    const set = addSet(subjectKey, paper.id, name);
    // Jump straight into the new set's editor
    resetWithBack(area, '← back to sets', () => {
      resetWithBack(area, '← back to papers', () => {
        resetWithBack(area, null);
        window.buildFlashcards(area, subjectKey);
      });
      renderSetsPicker(area, subjectKey, paper);
    });
    renderDeck(area, subjectKey, paper, set.id, 'edit');
  }, 'btn-primary');
  newRow.appendChild(createBtn);
  newWrap.appendChild(newRow);
  area.appendChild(newWrap);

  // List of existing sets
  if (!paperData.sets.length) {
    area.appendChild(el('p', { class: 'muted', style: 'margin-top: 16px' },
      'No sets yet. Create your first one above — give it a name like "Critics" or "Key quotes".'));
    return;
  }

  area.appendChild(el('h3', { class: 'serif', style: 'margin: 22px 0 8px' },
    'Your sets (' + paperData.sets.length + ')'));

  const grid = el('div', { class: 'mode-grid', style: 'margin-bottom: 8px' });
  paperData.sets.forEach(set => {
    const count = set.cards.length;
    const card = el('a', { class: 'mode-card fc-set-card', href: '#' },
      el('span', { class: 'icon' }, '📚'),
      el('h3', {}, set.name),
      el('p', {}, count + ' card' + (count === 1 ? '' : 's'))
    );
    card.addEventListener('click', e => {
      e.preventDefault();
      // If the click was on a control button inside, ignore (handled separately)
      if (e.target.closest('.fc-set-controls')) return;
      resetWithBack(area, '← back to sets', () => {
        resetWithBack(area, '← back to papers', () => {
          resetWithBack(area, null);
          window.buildFlashcards(area, subjectKey);
        });
        renderSetsPicker(area, subjectKey, paper);
      });
      renderDeck(area, subjectKey, paper, set.id);
    });
    // Inline rename + delete controls
    const controls = el('div', { class: 'fc-set-controls' });
    const renameBtn = el('button', { class: 'fc-set-ctrl', type: 'button', title: 'Rename set' }, '✎');
    renameBtn.addEventListener('click', (ev) => {
      ev.preventDefault(); ev.stopPropagation();
      const next = prompt('Rename set:', set.name);
      if (next && next.trim()) { renameSet(subjectKey, paper.id, set.id, next.trim()); refresh(); }
    });
    const delBtn = el('button', { class: 'fc-set-ctrl danger', type: 'button', title: 'Delete set' }, '🗑');
    delBtn.addEventListener('click', (ev) => {
      ev.preventDefault(); ev.stopPropagation();
      if (!confirm('Delete the set "' + set.name + '"? This removes all ' + count + ' card' + (count === 1 ? '' : 's') + ' inside it.')) return;
      deleteSet(subjectKey, paper.id, set.id);
      refresh();
    });
    controls.appendChild(renameBtn);
    controls.appendChild(delBtn);
    card.appendChild(controls);
    grid.appendChild(card);
  });
  area.appendChild(grid);
}

// ---- Per-set deck view ----------------------------------------------------
function renderDeck(area, subjectKey, paper, setId, initialTab) {
  const set = getSet(subjectKey, paper.id, setId);
  if (!set) {
    area.appendChild(el('p', { class: 'muted' }, 'Set not found.'));
    return;
  }
  area.appendChild(el('h2', { class: 'serif' },
    SUBJECT_LABEL[subjectKey] + ' · ' + paper.title + ' · ' + set.name));
  area.appendChild(el('p', { class: 'muted', style: 'font-size:.88rem; margin-bottom:14px' }, paper.paper));

  const tabBar = el('div', { class: 'fc-tabs' });
  const studyTab = tabEl('Study', initialTab !== 'edit' && initialTab !== 'style');
  const editTab  = tabEl('Manage cards', initialTab === 'edit');
  const styleTab = tabEl('Style', initialTab === 'style');
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
    if (name === 'study') renderStudy(body, subjectKey, paper, setId);
    if (name === 'edit')  renderEditor(body, subjectKey, paper, setId, () => show('edit'));
    if (name === 'style') renderStyle(body, subjectKey, paper, setId, () => show('style'));
  }
  studyTab.addEventListener('click', () => show('study'));
  editTab.addEventListener('click',  () => show('edit'));
  styleTab.addEventListener('click', () => show('style'));
  show(initialTab === 'edit' ? 'edit' : initialTab === 'style' ? 'style' : 'study');
}

function tabEl(label, active) {
  return el('button', { class: 'fc-tab' + (active ? ' active' : ''), type: 'button' }, label);
}

// ---- Study mode -----------------------------------------------------------
function renderStudy(host, subjectKey, paper, setId) {
  const deck = getSet(subjectKey, paper.id, setId);
  if (!deck) return;
  if (!deck.cards.length) {
    host.appendChild(el('div', { class: 'fc-empty' },
      el('p', {}, 'No cards yet in this set.'),
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
function renderEditor(host, subjectKey, paper, setId, refresh) {
  const deck = getSet(subjectKey, paper.id, setId);
  if (!deck) return;

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
    updateSet(subjectKey, paper.id, setId, s => { s.cards.push({ id: newId('c'), a, b }); });
    refresh();
  }, 'btn-primary');
  form.appendChild(addBtn);
  host.appendChild(form);

  // Existing cards (re-fetch fresh state since add mutated storage)
  const fresh = getSet(subjectKey, paper.id, setId);
  host.appendChild(el('h3', { class: 'serif', style: 'margin-top: 24px' },
    'Cards in this set (' + fresh.cards.length + ')'));
  if (!fresh.cards.length) {
    host.appendChild(el('p', { class: 'muted' }, 'No cards yet.'));
    return;
  }
  const list = el('div', { class: 'fc-list' });
  fresh.cards.forEach((card, idx) => {
    list.appendChild(renderCardRow(card, idx, subjectKey, paper, setId, refresh));
  });
  host.appendChild(list);
}

function renderCardRow(card, idx, subjectKey, paper, setId, refresh) {
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
      updateSet(subjectKey, paper.id, setId, s => {
        const c = s.cards.find(x => x.id === card.id);
        if (c) { c.a = a; c.b = b; }
      });
      refresh();
    }, 'btn-primary');
    const cancel = btn('Cancel', () => refresh(), 'btn-ghost');
    row.appendChild(el('div', { class: 'fc-row-actions' }, save, cancel));
  }, 'btn-ghost');
  const delBtn = btn('Delete', () => {
    if (!confirm('Delete card #' + (idx + 1) + '?')) return;
    updateSet(subjectKey, paper.id, setId, s => {
      s.cards = s.cards.filter(x => x.id !== card.id);
    });
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
function renderStyle(host, subjectKey, paper, setId, refresh) {
  const deck = getSet(subjectKey, paper.id, setId);
  if (!deck) return;

  host.appendChild(el('h3', { class: 'serif' }, 'Card style'));
  host.appendChild(el('p', { class: 'muted', style: 'font-size:.88rem' },
    'Choose how this set looks. Settings are saved per set.'));

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
      updateSet(subjectKey, paper.id, setId, s => { s.style.font = f.id; });
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
      updateSet(subjectKey, paper.id, setId, s => { s.style.color = c.id; });
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
      updateSet(subjectKey, paper.id, setId, s => { s.style.bg = c.id; });
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
