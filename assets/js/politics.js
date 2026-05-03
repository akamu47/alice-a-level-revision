/* =========================================================================
   Politics revision modes — UK Politics Paper 1
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

/* 1) CASE STUDIES  ----------------------------------------------------- */
function buildCases(area) {
  area.appendChild(el('h2', { class: 'serif' }, 'Case study cards'));
  area.appendChild(el('p', { class: 'muted', style: 'font-size:.9rem; margin-bottom:16px' },
    'Name shown → recall the buckets (aims, methods, successes, failures). Tap to reveal each.'));

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
    stage.appendChild(el('div', { style: 'display:flex; align-items:center; gap: 12px; margin-bottom: 12px' },
      el('span', { style: 'font-size: 2rem' }, typeIcon),
      el('div', {}, el('span', { class: 'tag pol' }, (c.type || 'case').replace('_', ' ')),
                    el('h2', { class: 'serif', style: 'margin: 4px 0 0' }, c.name))
    ));
    stage.appendChild(el('p', { class: 'muted', style: 'font-size:.85rem; margin-bottom: 16px' }, 'Try to recall each bucket before revealing.'));

    Object.entries(c.buckets).forEach(([bucket, items]) => {
      if (!items.length) return;
      const reveal = el('div', { class: 'reveal', style: 'margin-bottom: 10px' });
      const lbl = el('div', { style: 'font-weight: 500; color: var(--ink)' }, bucket);
      const ul = el('ul', { style: 'margin: 8px 0 0; padding-left: 18px; line-height: 1.55; font-size: 0.92rem' });
      items.forEach(it => ul.appendChild(el('li', { style: 'margin-bottom: 4px' }, it)));
      reveal.addEventListener('click', () => {
        if (reveal.classList.contains('revealed')) return;
        reveal.classList.add('revealed'); reveal.innerHTML = '';
        reveal.appendChild(lbl); reveal.appendChild(ul);
      });
      // Show the bucket label permanently to prompt recall, even before reveal
      reveal.dataset.bucket = bucket;
      // Hint label visible behind lock
      reveal.innerHTML = '';
      const placeholder = el('div', { style: 'opacity:.55; font-style:normal; font-family: var(--font-sans); font-size: 0.85rem' },
        '🔒 ' + bucket + ' — tap to reveal');
      reveal.appendChild(placeholder);
      stage.appendChild(reveal);
    });

    showConfRow(stage, 'cases', c.name, () => { i++; render(); });
  }
  render();
}

/* 2) ELECTIONS  -------------------------------------------------------- */
function buildElections(area) {
  area.appendChild(el('h2', { class: 'serif' }, 'General Elections'));
  area.appendChild(el('p', { class: 'muted', style: 'font-size:.9rem; margin-bottom:16px' },
    'Year shown → recall demographics, valence, leaders, turnout, campaign, policies.'));

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

  if (e.summary.length) {
    const sumReveal = el('div', { class: 'reveal' });
    const ul = el('ul', { style: 'padding-left: 18px; line-height: 1.6' });
    e.summary.forEach(s => ul.appendChild(el('li', { style: 'margin-bottom: 4px' }, s)));
    sumReveal.addEventListener('click', () => {
      if (sumReveal.classList.contains('revealed')) return;
      sumReveal.classList.add('revealed'); sumReveal.innerHTML = '';
      sumReveal.appendChild(el('strong', { style: 'display:block; margin-bottom: 6px' }, 'Overview'));
      sumReveal.appendChild(ul);
    });
    sumReveal.innerHTML = '<div style="opacity:.55; font-family: var(--font-sans); font-style:normal">🔒 Overview — tap to reveal</div>';
    card.appendChild(sumReveal);
  }

  if (e.results.length) {
    const r = el('div', { style: 'background: var(--bg); border-radius: var(--radius); padding: 12px 16px; margin-top: 12px; font-size: 0.92rem; line-height: 1.7' },
      el('strong', { style: 'display:block; margin-bottom: 4px' }, 'Result'),
      ...e.results.map(line => el('div', {}, line))
    );
    card.appendChild(r);
  }

  Object.entries(e.buckets).forEach(([bucket, items]) => {
    if (!items.length) return;
    const reveal = el('div', { class: 'reveal', style: 'margin-top: 10px' });
    const ul = el('ul', { style: 'padding-left: 18px; margin-top: 6px; line-height: 1.6; font-size: 0.92rem' });
    items.forEach(s => ul.appendChild(el('li', { style: 'margin-bottom: 4px' }, s)));
    reveal.addEventListener('click', () => {
      if (reveal.classList.contains('revealed')) return;
      reveal.classList.add('revealed'); reveal.innerHTML = '';
      reveal.appendChild(el('strong', { style: 'display:block; margin-bottom: 6px' }, bucket));
      reveal.appendChild(ul);
    });
    reveal.innerHTML = '<div style="opacity:.55; font-family: var(--font-sans); font-style:normal">🔒 ' + bucket + ' — tap to reveal</div>';
    card.appendChild(reveal);
  });

  showConfRow(card, 'elections', String(year), () => {});
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

/* 3) CASE LAW ---------------------------------------------------------- */
function buildCaseLaw(area) {
  area.appendChild(el('h2', { class: 'serif' }, 'Rights case law'));
  area.appendChild(el('p', { class: 'muted', style: 'font-size:.9rem; margin-bottom:16px' },
    'Case name → recall the facts and ruling.'));

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
    stage.appendChild(el('h2', { class: 'serif', style: 'margin: 12px 0 4px; font-size: 1.5rem' }, c.name));
    stage.appendChild(el('p', { class: 'muted', style: 'margin-bottom: 16px; font-size: .9rem' }, 'What were the facts? What was the ruling?'));

    const reveal = el('div', { class: 'reveal' });
    const body = el('div', {});
    if (c.facts.length) {
      body.appendChild(el('strong', { style: 'display:block; margin-bottom: 4px' }, 'Facts'));
      const ul = el('ul', { style: 'padding-left: 18px; margin-bottom: 12px; line-height: 1.5; font-size: 0.92rem' });
      c.facts.forEach(f => ul.appendChild(el('li', { style: 'margin-bottom: 4px' }, f)));
      body.appendChild(ul);
    }
    if (c.ruling.length) {
      body.appendChild(el('strong', { style: 'display:block; margin-bottom: 4px; color: var(--pol)' }, 'Ruling'));
      const ul = el('ul', { style: 'padding-left: 18px; line-height: 1.5; font-size: 0.92rem' });
      c.ruling.forEach(f => ul.appendChild(el('li', { style: 'margin-bottom: 4px' }, f)));
      body.appendChild(ul);
    }
    reveal.addEventListener('click', () => {
      if (reveal.classList.contains('revealed')) return;
      reveal.classList.add('revealed'); reveal.innerHTML = '';
      reveal.appendChild(body);
      showConfRow(stage, 'caselaw', c.name, () => { i++; render(); });
    });
    stage.appendChild(reveal);
  }
  render();
}

/* 4) CONCEPTS  --------------------------------------------------------- */
function buildConcepts(area) {
  area.appendChild(el('h2', { class: 'serif' }, 'Concept flashcards'));
  area.appendChild(el('p', { class: 'muted', style: 'font-size:.9rem; margin-bottom:16px' },
    'Term shown → recall the definition + examples.'));

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
    stage.appendChild(el('h2', { class: 'serif', style: 'margin: 12px 0 8px' }, c.term));
    stage.appendChild(el('p', { class: 'muted', style: 'margin-bottom: 16px; font-size: .9rem' }, 'Define it. Give an example.'));
    const reveal = el('div', { class: 'reveal' });
    const body = el('div', {});
    if (c.definition) body.appendChild(el('p', { style: 'font-size: 1rem; line-height: 1.55; margin-bottom: 10px' }, c.definition));
    if (c.extras.length) {
      const ul = el('ul', { style: 'padding-left: 18px; line-height: 1.5; font-size: 0.92rem' });
      c.extras.forEach(e => ul.appendChild(el('li', { style: 'margin-bottom: 4px' }, e)));
      body.appendChild(ul);
    }
    reveal.addEventListener('click', () => {
      if (reveal.classList.contains('revealed')) return;
      reveal.classList.add('revealed'); reveal.innerHTML = '';
      reveal.appendChild(body);
      showConfRow(stage, 'concepts', c.term, () => { i++; render(); });
    });
    stage.appendChild(reveal);
  }
  render();
}

/* 5) DEBATES — YES/NO and FOR/AGAINST tables -------------------------- */
function buildDebates(area) {
  area.appendChild(el('h2', { class: 'serif' }, 'Debate banks'));
  area.appendChild(el('p', { class: 'muted', style: 'font-size:.9rem; margin-bottom:16px' },
    'Two-sided arguments — pick a debate to drill. Read one side, try to recall the other.'));

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
    const col = el('div', { class: 'compare-col', style: 'border-top: 3px solid ' + colour },
      el('h4', { style: 'color: ' + colour }, h));
    // Build content from the rows (collect col h)
    const reveal = el('div', { class: 'reveal' });
    const ul = el('ul', { style: 'list-style: none; padding: 0; margin: 0; display: grid; gap: 8px' });
    d.rows.forEach(r => {
      const cell = r[hi];
      if (!cell) return;
      cell.split('\n').forEach(line => {
        if (line.trim()) ul.appendChild(el('li', { style: 'padding-left: 10px; border-left: 2px solid ' + colour + '; font-size: 0.9rem' }, line.trim()));
      });
    });
    reveal.addEventListener('click', () => {
      if (reveal.classList.contains('revealed')) return;
      reveal.classList.add('revealed'); reveal.innerHTML = '';
      reveal.appendChild(ul);
    });
    col.appendChild(reveal);
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
    'All 41 structured tables from your notes — handy for quick lookups during essay practice.'));

  // Group by area
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
