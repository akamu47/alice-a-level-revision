/* =========================================================================
   Politics revision modes — UK Politics Paper 1
   v2 — blurt-first recall, hint/don't-know buttons, staggered reveals.
   ========================================================================= */

let DATA = null;

(function showExamCountdown() {
  const exam = window.EXAMS.find(e => e.subject === 'pol');
  if (!exam) return;
  const t = timeUntil(exam.date);
  const el2 = document.getElementById('examCountdown');
  if (t.past) { el2.textContent = 'Done'; return; }
  el2.textContent = t.days + ' day' + (t.days === 1 ? '' : 's') + ' to go';
})();

fetch('../assets/data/politics.json?v=' + window.APP_VERSION)
  .then(r => r.json())
  .then(d => { DATA = d; bindModePicker(); })
  .catch(err => {
    const area = document.getElementById('revisionArea');
    area.innerHTML = '';
    const p = document.createElement('p');
    p.style.color = 'red';
    p.textContent = 'Failed to load: ' + err;
    area.appendChild(p);
    area.style.display = 'block';
  });

function bindModePicker() {
  document.querySelectorAll('.mode-card[data-mode]').forEach(card => {
    card.addEventListener('click', e => { e.preventDefault(); switchMode(card.dataset.mode); });
  });
}

function switchMode(mode) {
  document.getElementById('modePicker').style.display = 'none';
  const area = document.getElementById('revisionArea');
  area.style.display = 'block'; area.innerHTML = '';

  area.appendChild(el('button', { class: 'btn btn-ghost', onclick: () => {
    document.getElementById('modePicker').style.display = 'block';
    area.style.display = 'none'; area.innerHTML = '';
  }}, '← back to modes'));

  if (mode === 'cases')      buildCases(area);
  else if (mode === 'elections') buildElections(area);
  else if (mode === 'caselaw')   buildCaseLaw(area);
  else if (mode === 'concepts')  buildConcepts(area);
  else if (mode === 'debates')   buildDebates(area);
  else if (mode === 'tables')    buildTables(area);
  else if (mode === 'dashboard') buildPolDashboard(area);
}

/* ---------------------------------------------------------------------- */
function showConfRow(stage, deck, id, onPicked) {
  const existing = stage.querySelector('.confidence-row');
  if (existing) existing.remove();
  stage.appendChild(el('p', { class: 'muted', style: 'text-align:center; font-size:.85rem; margin-top:24px' },
    'How well do you know this one?'));
  stage.appendChild(el('div', { class: 'confidence-row' },
    el('button', { class: 'confidence-btn shaky', onclick: () => { setConfidence(deck, id, 'shaky'); onPicked(); } }, '🟥 shaky'),
    el('button', { class: 'confidence-btn okay',  onclick: () => { setConfidence(deck, id, 'okay');  onPicked(); } }, '🟧 okay'),
    el('button', { class: 'confidence-btn solid', onclick: () => { setConfidence(deck, id, 'solid'); onPicked(); } }, '🟩 solid')
  ));
}

function sortBy(deck, items, idFn) {
  const map = recall(`confidence_${deck}`, {});
  const score = c => {
    const conf = map[idFn(c)];
    if (!conf) return 1;
    return conf.level === 'shaky' ? 0 : conf.level === 'okay' ? 2 : 3;
  };
  return items.slice().sort((a, b) => score(a) - score(b));
}

/* Build a labelled list as a stagger-friendly DocumentFragment.
   Each <li> gets the .stagger-item class so blurtRecall reveal animates. */
function bulletsBlock(label, items, opts = {}) {
  const wrap = el('div', { class: 'stagger-item', style: 'margin-bottom: 12px' });
  const lblColor = opts.color || 'var(--ink)';
  wrap.appendChild(el('strong', { style: 'display:block; margin-bottom: 6px; color: ' + lblColor }, label));
  if (!items || !items.length) {
    wrap.appendChild(el('p', { class: 'muted', style: 'font-size: .88rem; margin: 0' }, '(no notes for this bucket)'));
    return wrap;
  }
  const ul = el('ul', { style: 'padding-left: 18px; margin: 0; line-height: 1.55; font-size: 0.92rem' });
  items.forEach(it => {
    const li = el('li', { class: 'stagger-item', style: 'margin-bottom: 4px' }, it);
    ul.appendChild(li);
  });
  wrap.appendChild(ul);
  return wrap;
}

/* 1) CASE STUDIES — blurt-first per-bucket recall  -------------------- */
function buildCases(area) {
  area.appendChild(el('h2', { class: 'serif' }, 'Case study cards'));
  area.appendChild(el('p', { class: 'muted', style: 'font-size:.9rem; margin-bottom:16px' },
    'Name shown → blurt what you remember for each bucket, then reveal.'));

  const order = sortBy('cases', DATA.case_studies, c => c.name);
  let i = 0;
  area.appendChild(el('div', { class: 'progress-bar' }, el('div', { class: 'fill', id: 'casesProgress', style: 'width: 0%' })));
  const stage = el('div', { class: 'card-stage fade-in' });
  area.appendChild(stage);

  function render() {
    if (i >= order.length) { stage.innerHTML = '<div style="text-align:center; padding:40px 0"><h3>✨ Done</h3></div>'; return; }
    const c = order[i];
    document.getElementById('casesProgress').style.width = ((i / order.length) * 100) + '%';
    stage.innerHTML = '';

    const typeIcon = { case_study: '📂', think_tank: '🏛️', lobbies: '💼', corporations: '🏢', rights_group: '⚖️' }[c.type] || '📂';
    stage.appendChild(el('div', { style: 'display:flex; align-items:center; gap: 12px; margin-bottom: 16px' },
      el('span', { style: 'font-size: 2rem' }, typeIcon),
      el('div', {}, el('span', { class: 'tag pol' }, (c.type || 'case').replace('_', ' ')),
                    el('h2', { class: 'serif', style: 'margin: 4px 0 0' }, c.name))
    ));

    // Render one blurtRecall per bucket
    const bucketEntries = Object.entries(c.buckets).filter(([_, items]) => items && items.length);
    if (!bucketEntries.length) {
      stage.appendChild(el('p', { class: 'muted' }, 'No structured buckets for this case.'));
      showConfRow(stage, 'cases', c.name, () => { i++; render(); });
      return;
    }

    let bIdx = 0;
    function nextBucket() {
      if (bIdx >= bucketEntries.length) {
        showConfRow(stage, 'cases', c.name, () => { i++; render(); });
        return;
      }
      const [bucket, items] = bucketEntries[bIdx];
      const allText = items.join(' ');
      stage.appendChild(blurtRecall({
        prompt: '🔒 ' + bucket + ' — blurt what you remember (any keywords).',
        placeholder: 'Type any words you can recall…',
        targets: [{ text: allText }],
        hint: lvl => {
          if (lvl === 1) return '💡 ' + items.length + ' point' + (items.length === 1 ? '' : 's') + ' to recall.';
          if (lvl === 2) return '✏️ Starts with: "' + (items[0] || '').slice(0, 30) + '…"';
          return '📖 Full notes will be revealed.';
        },
        reveal: () => bulletsBlock(bucket, items, { color: 'var(--pol)' }),
        onComplete: () => { bIdx++; nextBucket(); }
      }));
    }
    nextBucket();
  }
  render();
}

/* 2) ELECTIONS — overview blurt + per-bucket blurts ------------------- */
function buildElections(area) {
  area.appendChild(el('h2', { class: 'serif' }, 'General Elections'));
  area.appendChild(el('p', { class: 'muted', style: 'font-size:.9rem; margin-bottom:16px' },
    'Year shown → blurt the demographics, valence, leaders, turnout, campaign, policies.'));

  area.appendChild(el('div', { style: 'display:flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px' },
    ...DATA.elections.map(e => el('button', { class: 'btn btn-ghost',
      onclick: () => showElection(area, e.year)
    }, String(e.year))),
    el('button', { class: 'btn btn-ghost', onclick: () => compareElections(area) }, 'compare all →')
  ));

  const stage = el('div', { id: 'electionStage' });
  area.appendChild(stage);
  showElection(area, DATA.elections[0].year);
}

function showElection(area, year) {
  const stage = document.getElementById('electionStage');
  stage.innerHTML = '';
  const e = DATA.elections.find(x => x.year === year);
  if (!e) return;

  const card = el('div', { class: 'card-stage fade-in' });
  card.appendChild(el('div', { style: 'display:flex; gap: 16px; align-items: baseline; margin-bottom: 16px' },
    el('h2', { class: 'serif', style: 'font-size: 3rem; color: var(--pol)' }, String(e.year)),
    el('span', { class: 'tag pol' }, 'General Election')
  ));

  if (e.results && e.results.length) {
    const r = el('div', { style: 'background: var(--bg); border-radius: var(--radius); padding: 12px 16px; margin-bottom: 14px; font-size: 0.92rem; line-height: 1.7' },
      el('strong', { style: 'display:block; margin-bottom: 4px' }, 'Result'),
      ...e.results.map(line => el('div', {}, line))
    );
    card.appendChild(r);
  }

  // Build a chain of blurts: overview, then each bucket
  const chain = [];
  if (e.summary && e.summary.length) {
    chain.push({ label: 'Overview', items: e.summary });
  }
  Object.entries(e.buckets || {}).forEach(([bucket, items]) => {
    if (items && items.length) chain.push({ label: bucket, items });
  });

  let cIdx = 0;
  function nextBlurt() {
    if (cIdx >= chain.length) {
      showConfRow(card, 'elections', String(year), () => {});
      return;
    }
    const { label, items } = chain[cIdx];
    const allText = items.join(' ');
    card.appendChild(blurtRecall({
      prompt: '🔒 ' + label + ' — blurt what you can.',
      placeholder: 'Keywords or phrases…',
      targets: [{ text: allText }],
      hint: lvl => {
        if (lvl === 1) return '💡 ' + items.length + ' point' + (items.length === 1 ? '' : 's') + '.';
        if (lvl === 2) return '✏️ Starts with: "' + (items[0] || '').slice(0, 32) + '…"';
        return '📖 Notes will be revealed.';
      },
      reveal: () => bulletsBlock(label, items, { color: 'var(--pol)' }),
      onComplete: () => { cIdx++; nextBlurt(); }
    }));
  }
  nextBlurt();
  stage.appendChild(card);
}

function compareElections(area) {
  const stage = document.getElementById('electionStage');
  stage.innerHTML = '';
  const buckets = ['Demographic', 'Valence', 'Party leaders', 'Turnout', 'Campaign', 'Policies', 'Opinion polls', 'Political issues', 'Key issue'];
  const tbl = el('div', { style: 'overflow-x: auto; background: var(--bg-elev); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px' });
  const grid = el('div', { style: 'display: grid; grid-template-columns: 140px repeat(' + DATA.elections.length + ', minmax(220px, 1fr)); gap: 0; min-width: 600px' });
  // Header row
  grid.appendChild(el('div', { style: 'font-weight: 600; padding: 8px; border-bottom: 2px solid var(--ink)' }, 'Factor'));
  DATA.elections.forEach(e => {
    grid.appendChild(el('div', { style: 'font-weight: 600; padding: 8px; border-bottom: 2px solid var(--pol); color: var(--pol)' }, String(e.year)));
  });
  buckets.forEach(b => {
    grid.appendChild(el('div', { style: 'padding: 10px 8px; border-bottom: 1px solid var(--line); font-weight: 500' }, b));
    DATA.elections.forEach(e => {
      const items = (e.buckets[b] || []);
      const cell = el('div', { style: 'padding: 10px 8px; border-bottom: 1px solid var(--line); font-size: 0.85rem; line-height: 1.45' },
        items.length ? items.map(t => '· ' + t).join('\n') : el('span', { class: 'muted' }, '—'));
      cell.style.whiteSpace = 'pre-wrap';
      grid.appendChild(cell);
    });
  });
  tbl.appendChild(grid);
  stage.appendChild(tbl);
}

/* 3) CASE LAW — blurt facts, then blurt ruling ------------------------ */
function buildCaseLaw(area) {
  area.appendChild(el('h2', { class: 'serif' }, 'Rights case law'));
  area.appendChild(el('p', { class: 'muted', style: 'font-size:.9rem; margin-bottom:16px' },
    'Case name → blurt the facts, then blurt the ruling.'));

  const order = sortBy('caselaw', DATA.case_law, c => c.name);
  let i = 0;
  area.appendChild(el('div', { class: 'progress-bar' }, el('div', { class: 'fill', id: 'lawProgress', style: 'width: 0%' })));
  const stage = el('div', { class: 'card-stage fade-in' });
  area.appendChild(stage);

  function render() {
    if (i >= order.length) { stage.innerHTML = '<div style="text-align:center; padding:40px 0"><h3>✨ Done</h3></div>'; return; }
    const c = order[i];
    document.getElementById('lawProgress').style.width = ((i / order.length) * 100) + '%';
    stage.innerHTML = '';
    stage.appendChild(el('span', { class: 'tag pol' }, 'Case ' + (i + 1) + '/' + order.length));
    stage.appendChild(el('h2', { class: 'serif', style: 'margin: 12px 0 16px; font-size: 1.5rem' }, c.name));

    const sequence = [];
    if (c.facts && c.facts.length) sequence.push({ label: 'Facts', items: c.facts, color: 'var(--ink)' });
    if (c.ruling && c.ruling.length) sequence.push({ label: 'Ruling', items: c.ruling, color: 'var(--pol)' });

    if (!sequence.length) {
      stage.appendChild(el('p', { class: 'muted' }, 'No notes for this case.'));
      showConfRow(stage, 'caselaw', c.name, () => { i++; render(); });
      return;
    }

    let sIdx = 0;
    function nextStep() {
      if (sIdx >= sequence.length) {
        showConfRow(stage, 'caselaw', c.name, () => { i++; render(); });
        return;
      }
      const s = sequence[sIdx];
      const allText = s.items.join(' ');
      stage.appendChild(blurtRecall({
        prompt: '🔒 ' + s.label + ' — what do you remember?',
        placeholder: s.label === 'Facts' ? 'What happened in this case?' : 'How did the court rule, and why?',
        targets: [{ text: allText }],
        hint: lvl => {
          if (lvl === 1) return '💡 ' + s.items.length + ' point' + (s.items.length === 1 ? '' : 's') + ' to recall.';
          if (lvl === 2) return '✏️ Starts with: "' + (s.items[0] || '').slice(0, 32) + '…"';
          return '📖 Notes will be revealed.';
        },
        reveal: () => bulletsBlock(s.label, s.items, { color: s.color }),
        onComplete: () => { sIdx++; nextStep(); }
      }));
    }
    nextStep();
  }
  render();
}

/* 4) CONCEPTS — blurt definition, then reveal extras ------------------ */
function buildConcepts(area) {
  area.appendChild(el('h2', { class: 'serif' }, 'Concept flashcards'));
  area.appendChild(el('p', { class: 'muted', style: 'font-size:.9rem; margin-bottom:16px' },
    'Term shown → blurt your definition, then check.'));

  const order = sortBy('concepts', DATA.concepts, c => c.term);
  let i = 0;
  area.appendChild(el('div', { class: 'progress-bar' }, el('div', { class: 'fill', id: 'conProgress', style: 'width: 0%' })));
  const stage = el('div', { class: 'card-stage fade-in' });
  area.appendChild(stage);

  function render() {
    if (i >= order.length) { stage.innerHTML = '<div style="text-align:center; padding:40px 0"><h3>✨ Done</h3></div>'; return; }
    const c = order[i];
    document.getElementById('conProgress').style.width = ((i / order.length) * 100) + '%';
    stage.innerHTML = '';
    stage.appendChild(el('span', { class: 'tag pol' }, 'Concept ' + (i + 1) + '/' + order.length));
    stage.appendChild(el('h2', { class: 'serif', style: 'margin: 12px 0 16px' }, c.term));

    const def = c.definition || '';
    const extras = c.extras || [];

    stage.appendChild(blurtRecall({
      prompt: 'Define "' + c.term + '" — give a one-line definition + an example if you can.',
      placeholder: 'Your definition…',
      targets: [{ text: def + ' ' + extras.join(' ') }],
      hint: lvl => {
        if (lvl === 1 && def) return '💡 Definition is ~' + def.split(/\s+/).length + ' words.';
        if (lvl === 2 && def) return '✏️ Starts with: "' + def.slice(0, 30) + '…"';
        return '📖 Full definition will be revealed.';
      },
      reveal: () => {
        const wrap = el('div', {});
        if (def) {
          wrap.appendChild(el('p', { class: 'stagger-item', style: 'font-size: 1.05rem; line-height: 1.55; margin-bottom: 12px; color: var(--pol)' }, def));
        }
        if (extras.length) {
          wrap.appendChild(bulletsBlock('Examples & extras', extras, { color: 'var(--ink)' }));
        }
        return wrap;
      },
      onComplete: () => {
        showConfRow(stage, 'concepts', c.term, () => { i++; render(); });
      }
    }));
  }
  render();
}

/* 5) DEBATES — YES/NO and FOR/AGAINST tables -------------------------- */
function buildDebates(area) {
  area.appendChild(el('h2', { class: 'serif' }, 'Debate banks'));
  area.appendChild(el('p', { class: 'muted', style: 'font-size:.9rem; margin-bottom:16px' },
    'Two-sided arguments — pick a debate. Blurt one side, then check.'));

  const debates = DATA.tables.filter(t => ['yes_no', 'for_against', 'pros_cons', 'strengths_weaknesses'].includes(t.kind));
  const grid = el('div', { class: 'mode-grid' });
  debates.forEach(d => {
    const card = el('a', { class: 'mode-card', onclick: () => showDebate(area, d) },
      el('span', { class: 'icon' }, '⚔️'),
      el('h3', {}, d.label),
      el('p', {}, d.headers.join(' vs '))
    );
    grid.appendChild(card);
  });
  area.appendChild(grid);
}

function showDebate(area, d) {
  // Replace mode-grid with the debate
  area.querySelector('.mode-grid').remove();
  area.querySelector('h2').textContent = d.label;

  const cols = el('div', { class: 'compare', style: 'margin: 16px 0' });
  d.headers.forEach((h, hi) => {
    const colour = hi === 0 ? 'var(--solid)' : 'var(--shaky)';
    const items = [];
    d.rows.forEach(r => {
      const cell = r[hi];
      if (!cell) return;
      cell.split('\n').forEach(line => { if (line.trim()) items.push(line.trim()); });
    });
    const allText = items.join(' ');
    const col = el('div', { class: 'compare-col', style: 'border-top: 3px solid ' + colour },
      el('h4', { style: 'color: ' + colour }, h));

    col.appendChild(blurtRecall({
      prompt: '🔒 Blurt arguments for "' + h + '"',
      placeholder: 'Type any points you can think of…',
      targets: [{ text: allText }],
      hint: lvl => {
        if (lvl === 1) return '💡 ' + items.length + ' argument' + (items.length === 1 ? '' : 's') + ' to recall.';
        if (lvl === 2) return '✏️ Starts: "' + (items[0] || '').slice(0, 30) + '…"';
        return '📖 Full list will be revealed.';
      },
      reveal: () => {
        const wrap = el('div', {});
        const ul = el('ul', { style: 'list-style: none; padding: 0; margin: 0; display: grid; gap: 8px' });
        items.forEach(line => {
          ul.appendChild(el('li', { class: 'stagger-item', style: 'padding-left: 10px; border-left: 2px solid ' + colour + '; font-size: 0.9rem' }, line));
        });
        wrap.appendChild(ul);
        return wrap;
      },
      onComplete: () => {}
    }));
    cols.appendChild(col);
  });
  area.appendChild(cols);
  const wrap = el('div', { class: 'card-stage', style: 'min-height: auto' });
  showConfRow(wrap, 'debates', d.label, () => {});
  area.appendChild(wrap);
}

/* 6) TABLES — browse all reference tables ------------------------------ */
function buildTables(area) {
  area.appendChild(el('h2', { class: 'serif' }, 'Reference tables'));
  area.appendChild(el('p', { class: 'muted', style: 'font-size:.9rem; margin-bottom:16px' },
    'All structured tables from your notes — handy for quick lookups during essay practice.'));

  const groups = {};
  DATA.tables.forEach(t => { (groups[t.area] = groups[t.area] || []).push(t); });

  Object.entries(groups).forEach(([area_, tables]) => {
    const wrap = el('div', { style: 'margin-bottom: 28px' });
    wrap.appendChild(el('h3', { style: 'font-family: var(--font-display); color: var(--pol); margin-bottom: 8px; padding-bottom: 4px; border-bottom: 2px solid var(--pol-bg)' }, area_));
    tables.forEach(t => {
      const det = el('details', { style: 'background: var(--bg-elev); border: 1px solid var(--line); border-radius: var(--radius); padding: 12px 16px; margin-bottom: 8px' });
      det.appendChild(el('summary', { style: 'cursor: pointer; font-weight: 500' }, t.label));
      const tableEl = el('table', { style: 'width: 100%; margin-top: 12px; border-collapse: collapse; font-size: 0.85rem' });
      const thead = el('thead', {});
      const headerRow = el('tr', {});
      t.headers.forEach(h => headerRow.appendChild(el('th', { style: 'text-align: left; padding: 8px; border-bottom: 1px solid var(--line); background: var(--line-soft); font-weight: 600' }, h)));
      thead.appendChild(headerRow); tableEl.appendChild(thead);
      const tbody = el('tbody', {});
      t.rows.forEach(r => {
        const tr = el('tr', {});
        r.forEach(c => {
          const td = el('td', { style: 'padding: 8px; border-bottom: 1px solid var(--line-soft); vertical-align: top; line-height: 1.5; white-space: pre-wrap' }, c);
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      tableEl.appendChild(tbody);
      const tableWrap = el('div', { style: 'overflow-x: auto' }); tableWrap.appendChild(tableEl);
      det.appendChild(tableWrap);
      wrap.appendChild(det);
    });
    area.appendChild(wrap);
  });
}

/* 7) DASHBOARD --------------------------------------------------------- */
function buildPolDashboard(area) {
  area.appendChild(el('h2', { class: 'serif' }, 'Where you are'));
  const decks = [
    { id: 'cases',     label: 'Case studies', ids: DATA.case_studies.map(c => c.name) },
    { id: 'elections', label: 'Elections',    ids: DATA.elections.map(e => String(e.year)) },
    { id: 'caselaw',   label: 'Case law',     ids: DATA.case_law.map(c => c.name) },
    { id: 'concepts',  label: 'Concepts',     ids: DATA.concepts.map(c => c.term) },
    { id: 'debates',   label: 'Debates',      ids: DATA.tables.filter(t => ['yes_no','for_against','pros_cons','strengths_weaknesses'].includes(t.kind)).map(t => t.label) },
  ];
  decks.forEach(d => {
    const summary = getDeckSummary(d.id, d.ids);
    const total = d.ids.length || 1;
    const block = el('div', { class: 'card-stage', style: 'min-height: auto; margin-bottom: 12px; padding: 20px' });
    block.appendChild(el('div', { style: 'display: flex; justify-content: space-between; margin-bottom: 12px' },
      el('h3', { style: 'font-family: var(--font-display); font-weight: 500' }, d.label),
      el('span', { class: 'muted', style: 'font-size: .85rem' }, summary.solid + ' / ' + total + ' solid')
    ));
    const bar = el('div', { style: 'height: 14px; border-radius: 7px; overflow: hidden; display: flex; background: var(--line)' });
    [
      { c: 'var(--solid)', n: summary.solid },
      { c: 'var(--okay)',  n: summary.okay  },
      { c: 'var(--shaky)', n: summary.shaky },
    ].forEach(s => { if (s.n > 0) bar.appendChild(el('div', { style: 'background:' + s.c + '; flex: ' + s.n + ' 0 0' })); });
    block.appendChild(bar);
    const map = recall(`confidence_${d.id}`, {});
    const dotRow = el('div', { style: 'margin-top: 10px; display: flex; flex-wrap: wrap; gap: 4px' });
    d.ids.forEach(id => {
      const conf = map[id]; const cls = conf ? conf.level : '';
      dotRow.appendChild(el('span', { class: 'heat-dot ' + cls, title: id + (conf ? ' · ' + conf.level : ' · unseen') }));
    });
    block.appendChild(dotRow);
    area.appendChild(block);
  });
}
