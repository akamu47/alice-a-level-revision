/* =========================================================================
   English revision modes — Paradise Lost Book 9 + Plath & Hughes
   ========================================================================= */

let DATA = null;
const DECK_ID = 'eng';

// Show countdown for exam
(function showExamCountdown() {
  const exam = window.EXAMS.find(e => e.subject === 'eng');
  if (!exam) return;
  const t = timeUntil(exam.date);
  const el = document.getElementById('examCountdown');
  if (t.past) { el.textContent = 'Done — well played'; return; }
  el.textContent = t.days + ' day' + (t.days === 1 ? '' : 's') + ' to go';
})();

// Load data
fetch('../assets/data/english.json?v=' + window.APP_VERSION)
  .then(r => r.json())
  .then(d => { DATA = d; bindModePicker(); })
  .catch(err => {
    document.getElementById('revisionArea').innerHTML = '<p style="color:red">Failed to load notes: ' + err + '</p>';
    document.getElementById('revisionArea').style.display = 'block';
  });

function bindModePicker() {
  document.querySelectorAll('.mode-card[data-mode]').forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const mode = card.dataset.mode;
      switchMode(mode);
    });
  });
}

function switchMode(mode) {
  document.getElementById('modePicker').style.display = 'none';
  const area = document.getElementById('revisionArea');
  area.style.display = 'block';
  area.innerHTML = '';

  // Back button
  const back = el('button', { class: 'btn btn-ghost', onclick: () => {
    document.getElementById('modePicker').style.display = 'block';
    area.style.display = 'none';
    area.innerHTML = '';
  }}, '← back to modes');
  area.appendChild(back);

  if (mode === 'critics')   buildCritics(area);
  else if (mode === 'context') buildContext(area);
  else if (mode === 'sections') buildSections(area);
  else if (mode === 'themes')   buildThemes(area);
  else if (mode === 'plath')    buildPlath(area);
  else if (mode === 'dashboard') buildDashboard(area);
}

/* ----------------------------------------------------------------------
   1) CRITICS — quote shown, recall the author. Fuzzy match.
   Each critic is rendered with a unique colour + emoji as a memory hook.
   ---------------------------------------------------------------------- */
function buildCritics(area) {
  const critics = DATA.critics;
  // Cards in spaced-repetition order: shaky first, then unrated, then okay, then solid
  const order = sortBySpacing('critics', critics, c => c.quote.slice(0, 40));
  let i = 0;

  const stage = el('div', { class: 'card-stage fade-in' });
  area.appendChild(el('h2', { class: 'serif' }, 'Critics quotefall'));
  area.appendChild(el('p', { class: 'muted', style: 'font-size:.9rem; margin-bottom:12px' },
    'Read the quote, name the critic. Close enough is fine. ',
    el('span', { class: 'kbd' }, 'Enter'), ' to check.'));
  area.appendChild(el('div', { class: 'progress-bar' }, el('div', { class: 'fill', id: 'critProgress', style: 'width: 0%' })));
  area.appendChild(stage);

  function render() {
    if (i >= order.length) {
      stage.innerHTML = '';
      stage.appendChild(el('div', { style: 'text-align:center; padding: 40px 0' },
        el('div', { style: 'font-size: 3rem' }, '✨'),
        el('h3', { style: 'margin: 12px 0' }, 'Round complete'),
        el('p', { class: 'muted' }, 'Want to go again? Cards you marked shaky come up first.'),
        el('button', { class: 'btn btn-primary', style: 'margin-top: 20px',
          onclick: () => { area.innerHTML = ''; const back = area.previousElementSibling; buildCritics(area); }
        }, 'Round 2 →')
      ));
      return;
    }
    const c = order[i];
    const cardId = c.quote.slice(0, 40);
    const conf = getConfidence('critics', cardId);
    document.getElementById('critProgress').style.width = ((i / order.length) * 100) + '%';

    stage.innerHTML = '';

    const top = el('div', {},
      el('div', { style: 'display:flex; justify-content:space-between; align-items:center; margin-bottom:16px' },
        el('span', { class: 'tag eng' }, 'Critic ' + (i + 1) + ' / ' + order.length),
        conf ? el('span', { class: 'heat-dot ' + conf.level, title: 'last: ' + conf.level }) : el('span')
      ),
      el('div', { class: 'quote-text', style: 'margin-bottom: 24px' }, '"' + c.quote + '"')
    );

    const input = el('input', { type: 'text', placeholder: 'Who said this?', autofocus: 'true' });
    const feedback = el('div', { id: 'critFeedback', style: 'margin-top: 12px; min-height: 28px' });
    const submitBtn = el('button', { class: 'btn btn-primary', style: 'margin-top: 12px' }, 'Check');

    function check() {
      const guess = input.value.trim();
      if (!guess) return;
      const ok = closeMatch(guess, c.author, 0.7);
      const hook = critic_hook(c.author);
      feedback.innerHTML = '';
      if (ok) {
        feedback.appendChild(el('div', { style: 'color: var(--solid); font-weight: 500' }, '✓ Yes — ',
          el('span', { class: 'critic-chip', style: '--chip-bg: ' + hook.colour },
            el('span', { class: 'emoji' }, hook.emoji), c.author)));
      } else {
        feedback.appendChild(el('div', {},
          el('div', { style: 'color: var(--shaky); font-weight: 500' }, '✗ Not quite. Answer: ',
            el('span', { class: 'critic-chip', style: '--chip-bg: ' + hook.colour },
              el('span', { class: 'emoji' }, hook.emoji), c.author))));
      }
      // After feedback, show confidence buttons
      showConfidenceRow(stage, 'critics', cardId, () => { i++; render(); });
      submitBtn.disabled = true;
      input.disabled = true;
    }
    submitBtn.addEventListener('click', check);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });

    stage.appendChild(top);
    stage.appendChild(input);
    stage.appendChild(submitBtn);
    stage.appendChild(feedback);
    setTimeout(() => input.focus(), 50);
  }
  render();
}

function showConfidenceRow(stage, deckId, cardId, onPicked) {
  // Remove any existing
  const existing = stage.querySelector('.confidence-row');
  if (existing) existing.remove();
  const hint = el('p', { class: 'muted', style: 'text-align:center; font-size:.85rem; margin-top:24px' },
    'How well do you know this one?');
  stage.appendChild(hint);
  const row = el('div', { class: 'confidence-row' },
    el('button', { class: 'confidence-btn shaky', onclick: () => { setConfidence(deckId, cardId, 'shaky'); onPicked(); } }, '🟥 shaky'),
    el('button', { class: 'confidence-btn okay',  onclick: () => { setConfidence(deckId, cardId, 'okay');  onPicked(); } }, '🟧 okay'),
    el('button', { class: 'confidence-btn solid', onclick: () => { setConfidence(deckId, cardId, 'solid'); onPicked(); } }, '🟩 solid')
  );
  stage.appendChild(row);
}

// Sort cards: shaky cards come first (they need most repetition), then unseen,
// then okay, then solid.
function sortBySpacing(subdeck, cards, idFn) {
  const map = recall(`confidence_${subdeck}`, {});
  const score = c => {
    const conf = map[idFn(c)];
    if (!conf) return 1; // unseen — show early
    if (conf.level === 'shaky') return 0;
    if (conf.level === 'okay')  return 2;
    return 3; // solid — show last
  };
  return cards.slice().sort((a, b) => score(a) - score(b));
}

/* ----------------------------------------------------------------------
   2) CONTEXT — broad term shown, recall bullets, self-rate
   ---------------------------------------------------------------------- */
function buildContext(area) {
  const blocks = DATA.context;
  const order = sortBySpacing('context', blocks, b => b.term);
  let i = 0;

  area.appendChild(el('h2', { class: 'serif' }, 'Context recall'));
  area.appendChild(el('p', { class: 'muted', style: 'font-size:.9rem; margin-bottom:12px' },
    'Remember the bullets under each term. Close to the meaning is fine. Tap to reveal.'));
  area.appendChild(el('div', { class: 'progress-bar' }, el('div', { class: 'fill', id: 'ctxProgress', style: 'width: 0%' })));
  const stage = el('div', { class: 'card-stage fade-in' });
  area.appendChild(stage);

  function render() {
    if (i >= order.length) { stage.innerHTML = '<div style="text-align:center; padding: 40px 0"><div style="font-size: 3rem">✨</div><h3>Done</h3></div>'; return; }
    const b = order[i];
    document.getElementById('ctxProgress').style.width = ((i / order.length) * 100) + '%';
    stage.innerHTML = '';
    stage.appendChild(el('span', { class: 'tag eng' }, 'Context ' + (i + 1) + '/' + order.length));
    stage.appendChild(el('h2', { class: 'serif', style: 'margin: 12px 0 8px; font-size: 1.8rem' }, b.term));
    stage.appendChild(el('p', { class: 'muted', style: 'margin-bottom: 16px; font-size: .9rem' }, 'What are the key bullets here?'));
    const reveal = el('div', { class: 'reveal' }, '');
    const bulletsList = el('ul', { style: 'margin: 0; padding-left: 20px; line-height: 1.7' },
      ...b.bullets.map(bx => el('li', {}, bx))
    );
    reveal.addEventListener('click', () => {
      if (reveal.classList.contains('revealed')) return;
      reveal.classList.add('revealed');
      reveal.innerHTML = '';
      reveal.appendChild(bulletsList);
      showConfidenceRow(stage, 'context', b.term, () => { i++; render(); });
    });
    stage.appendChild(reveal);
  }
  render();
}

/* ----------------------------------------------------------------------
   3) SECTIONS ↔ QUOTES (Book 9 line map)
   Two sub-modes: section title → recall quotes; OR quote → which section?
   ---------------------------------------------------------------------- */
function buildSections(area) {
  area.appendChild(el('h2', { class: 'serif' }, 'Section ↔ quote map'));
  area.appendChild(el('p', { class: 'muted', style: 'font-size:.9rem; margin-bottom:16px' },
    'Build a mental map of Book 9. Two directions to drill:'));

  const subModePicker = el('div', { class: 'mode-grid' });
  subModePicker.appendChild(el('a', { class: 'mode-card', onclick: () => startSectionMode('s2q', area) },
    el('span', { class: 'icon' }, '📍'),
    el('h3', {}, 'Section → quotes'),
    el('p', {}, '"Satan enters Eden (48–98)" → recall the quotes from this section.')
  ));
  subModePicker.appendChild(el('a', { class: 'mode-card', onclick: () => startSectionMode('q2s', area) },
    el('span', { class: 'icon' }, '🔍'),
    el('h3', {}, 'Quote → section'),
    el('p', {}, 'Random quote → which section is it from?')
  ));
  subModePicker.appendChild(el('a', { class: 'mode-card', onclick: () => showAllSections(area) },
    el('span', { class: 'icon' }, '🗺️'),
    el('h3', {}, 'Browse the map'),
    el('p', {}, 'Read through the whole 1102-line structure.')
  ));
  area.appendChild(subModePicker);
}

function startSectionMode(mode, area) {
  // Remove the sub-picker and start
  area.querySelector('.mode-grid').remove();
  const stage = el('div', { class: 'card-stage fade-in' });
  area.appendChild(el('div', { class: 'progress-bar' }, el('div', { class: 'fill', id: 'secProgress', style: 'width: 0%' })));
  area.appendChild(stage);

  if (mode === 's2q') {
    const order = sortBySpacing('sec_s2q', DATA.sections, s => s.lines);
    let i = 0;
    const render = () => {
      if (i >= order.length) { stage.innerHTML = '<div style="text-align:center; padding: 40px 0"><h3>✨ Done</h3></div>'; return; }
      const s = order[i];
      document.getElementById('secProgress').style.width = ((i / order.length) * 100) + '%';
      stage.innerHTML = '';
      stage.appendChild(el('span', { class: 'tag eng' }, 'Lines ' + s.lines));
      stage.appendChild(el('h2', { class: 'serif', style: 'margin: 12px 0 6px; font-size: 1.6rem' }, s.title));
      stage.appendChild(el('p', { class: 'muted', style: 'margin-bottom: 16px; font-size: .9rem' }, 'Recall the key quotes from this section.'));
      const reveal = el('div', { class: 'reveal' });
      const quoteList = el('ul', { style: 'list-style: none; padding: 0; margin: 0; display: grid; gap: 10px' },
        ...s.quotes.map(q => el('li', { class: 'quote-text', style: 'padding-left: 18px; border-left: 2px solid var(--eng-soft)' }, '"' + q + '"'))
      );
      reveal.addEventListener('click', () => {
        if (reveal.classList.contains('revealed')) return;
        reveal.classList.add('revealed');
        reveal.innerHTML = '';
        reveal.appendChild(quoteList);
        showConfidenceRow(stage, 'sec_s2q', s.lines, () => { i++; render(); });
      });
      stage.appendChild(reveal);
    };
    render();
  } else if (mode === 'q2s') {
    // Build a flat list of all (quote, section) pairs
    const allQuotes = [];
    DATA.sections.forEach(s => s.quotes.forEach(q => allQuotes.push({ quote: q, section: s })));
    const order = shuffle(allQuotes);
    let i = 0;
    const render = () => {
      if (i >= order.length) { stage.innerHTML = '<div style="text-align:center; padding: 40px 0"><h3>✨ Done</h3></div>'; return; }
      const item = order[i];
      document.getElementById('secProgress').style.width = ((i / order.length) * 100) + '%';
      stage.innerHTML = '';
      stage.appendChild(el('span', { class: 'tag eng' }, 'Quote ' + (i + 1) + '/' + order.length));
      stage.appendChild(el('div', { class: 'quote-text', style: 'margin: 14px 0 18px' }, '"' + item.quote + '"'));
      // Multiple choice from random sections
      const wrong = shuffle(DATA.sections.filter(s => s.lines !== item.section.lines)).slice(0, 3);
      const choices = shuffle([item.section, ...wrong]);
      const choicesEl = el('div', { style: 'display: grid; gap: 8px; margin-top: 12px' });
      choices.forEach(c => {
        const btn = el('button', { class: 'btn btn-ghost', style: 'justify-content: flex-start; text-align: left; padding: 12px 16px' },
          el('span', { class: 'kbd', style: 'margin-right: 10px' }, c.lines), c.title);
        btn.addEventListener('click', () => {
          choicesEl.querySelectorAll('button').forEach(b => b.disabled = true);
          if (c.lines === item.section.lines) {
            btn.style.background = 'var(--solid-bg)'; btn.style.borderColor = 'var(--solid)'; btn.style.color = 'var(--solid)';
          } else {
            btn.style.background = 'var(--shaky-bg)'; btn.style.borderColor = 'var(--shaky)'; btn.style.color = 'var(--shaky)';
            // also highlight correct
            choicesEl.querySelectorAll('button').forEach(b => {
              if (b.textContent.includes(item.section.lines)) {
                b.style.background = 'var(--solid-bg)'; b.style.borderColor = 'var(--solid)'; b.style.color = 'var(--solid)';
              }
            });
          }
          showConfidenceRow(stage, 'sec_q2s', item.quote.slice(0, 30), () => { i++; render(); });
        });
        choicesEl.appendChild(btn);
      });
      stage.appendChild(choicesEl);
    };
    render();
  }
}

function showAllSections(area) {
  area.querySelector('.mode-grid').remove();
  const wrap = el('div', {});
  DATA.sections.forEach(s => {
    const item = el('details', { style: 'background: var(--bg-elev); border: 1px solid var(--line); border-radius: var(--radius); padding: 14px 18px; margin-bottom: 8px' },
      el('summary', { style: 'cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 12px' },
        el('span', { class: 'kbd' }, s.lines),
        el('span', {}, s.title)),
      el('ul', { style: 'list-style: none; padding: 12px 0 0; margin: 0; display: grid; gap: 8px' },
        ...s.quotes.map(q => el('li', { class: 'quote-text', style: 'padding-left: 14px; border-left: 2px solid var(--eng-soft); font-size: 1rem' }, '"' + q + '"'))
      )
    );
    wrap.appendChild(item);
  });
  area.appendChild(wrap);
}

/* ----------------------------------------------------------------------
   4) THEMES — Pick a theme, recall sub-themes & quotes & analysis (3-stage)
   ---------------------------------------------------------------------- */
function buildThemes(area) {
  area.appendChild(el('h2', { class: 'serif' }, 'Theme builder'));
  area.appendChild(el('p', { class: 'muted', style: 'font-size:.9rem; margin-bottom:16px' },
    'Pick a theme. Try to fill in the sub-themes (the umbrella ideas), then the supporting quotes, then the analysis.'));

  const grid = el('div', { class: 'mode-grid' });
  DATA.themes.forEach(theme => {
    const hook = theme_hook(theme.label);
    const numQuotes = theme.subthemes.reduce((acc, st) => acc + st.items.length, 0);
    const card = el('a', { class: 'mode-card', onclick: () => openTheme(area, theme) },
      el('span', { class: 'icon', style: 'background:' + hook.colour + '20; color: ' + hook.colour + '; padding: 8px 10px; border-radius: 8px; display: inline-block' }, hook.emoji),
      el('h3', {}, theme.label),
      el('p', {}, theme.subthemes.length + ' sub-themes · ' + numQuotes + ' quotes')
    );
    grid.appendChild(card);
  });
  area.appendChild(grid);
}

function openTheme(area, theme) {
  // Remove the picker
  const heading = area.querySelector('h2'); const desc = area.querySelector('p.muted'); const grid = area.querySelector('.mode-grid');
  if (heading) heading.remove(); if (desc) desc.remove(); if (grid) grid.remove();

  const hook = theme_hook(theme.label);
  area.appendChild(el('div', { style: 'display:flex; align-items:center; gap:12px; margin-bottom:8px' },
    el('span', { style: 'font-size: 2rem; background:' + hook.colour + '20; color:' + hook.colour + '; width:56px; height:56px; display:flex; align-items:center; justify-content:center; border-radius:14px' }, hook.emoji),
    el('div', {}, el('h2', { class: 'serif', style: 'margin:0' }, theme.label),
                  el('p', { class: 'muted', style: 'font-size: .85rem; margin:0' }, theme.headline.slice(0, 100) + (theme.headline.length > 100 ? '...' : '')))
  ));
  area.appendChild(el('p', { class: 'muted', style: 'font-size: .9rem; margin-bottom: 12px' },
    'Stage 1: name the sub-themes. Stage 2: recall the quotes. Stage 3: read the analysis.'));

  // For each sub-theme, render a stage of progressive reveal
  theme.subthemes.forEach((sub, idx) => {
    const block = el('div', { class: 'card-stage fade-in', style: 'margin-bottom: 14px; min-height: auto' });
    block.appendChild(el('div', { style: 'display:flex; align-items:center; gap:8px; margin-bottom: 8px' },
      el('span', { class: 'tag eng' }, 'sub ' + (idx + 1) + '/' + theme.subthemes.length)));

    // Stage 1: sub-theme name (shown as reveal)
    const nameReveal = el('div', { class: 'reveal' });
    const nameContent = el('div', { class: 'serif', style: 'font-size: 1.1rem; font-weight: 500' }, sub.name);
    nameReveal.addEventListener('click', () => {
      if (nameReveal.classList.contains('revealed')) return;
      nameReveal.classList.add('revealed'); nameReveal.innerHTML = '';
      nameReveal.appendChild(nameContent);
      // After name revealed, show quote reveals
      sub.items.forEach((item, qi) => {
        const qReveal = el('div', { class: 'reveal', style: 'margin-top: 10px' });
        const qContent = el('div', {},
          el('div', { class: 'quote-text', style: 'margin-bottom: 8px' }, '"' + item.quote + '"'),
          el('div', { style: 'font-size: 0.9rem; color: var(--ink-mute); padding-top: 8px; border-top: 1px solid var(--line); margin-top: 6px' },
            ...item.analysis.map(a => el('p', { style: 'margin: 4px 0' }, '· ' + a)))
        );
        qReveal.addEventListener('click', () => {
          if (qReveal.classList.contains('revealed')) return;
          qReveal.classList.add('revealed'); qReveal.innerHTML = '';
          qReveal.appendChild(qContent);
        });
        block.appendChild(qReveal);
      });
      // Confidence at sub-theme level
      const confId = theme.label + '::' + sub.name.slice(0, 30);
      showConfidenceRow(block, 'themes', confId, () => {});
    });
    block.appendChild(nameReveal);
    area.appendChild(block);
  });
}

/* ----------------------------------------------------------------------
   5) PLATH & HUGHES — theme → recall poems & details from each
   ---------------------------------------------------------------------- */
function buildPlath(area) {
  area.appendChild(el('h2', { class: 'serif' }, 'Plath & Hughes — comparison'));
  area.appendChild(el('p', { class: 'muted', style: 'font-size:.9rem; margin-bottom:16px' },
    'Pick a theme. For each side: which poems would you use, what quotes, and what details?'));

  const themes = DATA.plath_hughes.themes;
  if (!themes || !themes.length) {
    area.appendChild(el('p', {}, 'No comparison notes yet.')); return;
  }

  const select = el('select', { style: 'max-width: 400px; margin-bottom: 16px' });
  themes.forEach((t, idx) => {
    select.appendChild(el('option', { value: idx }, t.theme || ('Theme ' + (idx + 1))));
  });
  area.appendChild(select);

  const stage = el('div', {});
  area.appendChild(stage);

  function renderTheme(idx) {
    const t = themes[idx];
    stage.innerHTML = '';
    stage.appendChild(el('h3', { style: 'margin: 8px 0 16px; font-family: var(--font-display); font-size: 1.4rem' }, t.theme));

    const compare = el('div', { class: 'compare' });

    // Plath column (reveal)
    const plathCol = el('div', { class: 'compare-col plath' },
      el('h4', {}, '🌹 Plath')
    );
    const plathReveal = el('div', { class: 'reveal' });
    const plathBody = el('div', {});
    if (t.plath.poems.length) {
      plathBody.appendChild(el('div', { style: 'margin-bottom: 8px' },
        el('strong', {}, 'Poems: '), t.plath.poems.join(' · ')));
    }
    if (t.plath.quotes.length) {
      const ul = el('ul', { style: 'list-style: none; padding: 8px 0 0; margin: 0; display: grid; gap: 6px' });
      t.plath.quotes.forEach(q => ul.appendChild(el('li', { class: 'quote-text', style: 'font-size: 0.95rem; padding-left: 12px; border-left: 2px solid var(--c8)' }, '"' + q + '"')));
      plathBody.appendChild(ul);
    }
    if (t.plath.bullets.length) {
      const det = el('details', { style: 'margin-top: 10px' }, el('summary', { class: 'muted', style: 'font-size: 0.85rem; cursor: pointer' }, 'full notes'));
      const ul = el('ul', { style: 'font-size: 0.85rem; padding: 8px 0 0 16px; line-height: 1.5; color: var(--ink-soft)' });
      t.plath.bullets.forEach(b => ul.appendChild(el('li', { style: 'margin-bottom: 4px' }, b)));
      det.appendChild(ul);
      plathBody.appendChild(det);
    }
    plathReveal.addEventListener('click', () => {
      if (plathReveal.classList.contains('revealed')) return;
      plathReveal.classList.add('revealed'); plathReveal.innerHTML = ''; plathReveal.appendChild(plathBody);
    });
    plathCol.appendChild(plathReveal);

    // Hughes column
    const hughesCol = el('div', { class: 'compare-col hughes' },
      el('h4', {}, '🐺 Hughes'));
    const hughesReveal = el('div', { class: 'reveal' });
    const hughesBody = el('div', {});
    if (t.hughes.poems.length) {
      hughesBody.appendChild(el('div', { style: 'margin-bottom: 8px' },
        el('strong', {}, 'Poems: '), t.hughes.poems.join(' · ')));
    }
    if (t.hughes.quotes.length) {
      const ul = el('ul', { style: 'list-style: none; padding: 8px 0 0; margin: 0; display: grid; gap: 6px' });
      t.hughes.quotes.forEach(q => ul.appendChild(el('li', { class: 'quote-text', style: 'font-size: 0.95rem; padding-left: 12px; border-left: 2px solid var(--c5)' }, '"' + q + '"')));
      hughesBody.appendChild(ul);
    }
    if (t.hughes.bullets.length) {
      const det = el('details', { style: 'margin-top: 10px' }, el('summary', { class: 'muted', style: 'font-size: 0.85rem; cursor: pointer' }, 'full notes'));
      const ul = el('ul', { style: 'font-size: 0.85rem; padding: 8px 0 0 16px; line-height: 1.5; color: var(--ink-soft)' });
      t.hughes.bullets.forEach(b => ul.appendChild(el('li', { style: 'margin-bottom: 4px' }, b)));
      det.appendChild(ul);
      hughesBody.appendChild(det);
    }
    hughesReveal.addEventListener('click', () => {
      if (hughesReveal.classList.contains('revealed')) return;
      hughesReveal.classList.add('revealed'); hughesReveal.innerHTML = ''; hughesReveal.appendChild(hughesBody);
    });
    hughesCol.appendChild(hughesReveal);

    compare.appendChild(plathCol);
    compare.appendChild(hughesCol);
    stage.appendChild(compare);

    // Comparison sentence frame — to practice essay structure
    stage.appendChild(el('div', { class: 'hint', style: 'margin-top: 20px' },
      el('strong', {}, 'Sentence frame: '),
      'Both Plath and Hughes explore ', el('em', {}, t.theme || 'the theme'),
      ', but where Plath presents it as ____ (e.g. "', (t.plath.quotes[0] || '...'), '"), Hughes treats it as ____ ("', (t.hughes.quotes[0] || '...'), '").'
    ));

    // Confidence
    const confId = 'plath::' + t.theme;
    const confWrap = el('div', { class: 'card-stage', style: 'margin-top: 16px; min-height: auto' });
    confWrap.appendChild(el('p', { class: 'muted', style: 'text-align: center; font-size: .85rem' }, 'How well do you know this comparison?'));
    showConfidenceRow(confWrap, 'plath', confId, () => {});
    stage.appendChild(confWrap);
  }

  select.addEventListener('change', () => renderTheme(parseInt(select.value)));
  renderTheme(0);
}

/* ----------------------------------------------------------------------
   6) DASHBOARD — heat map of all decks
   ---------------------------------------------------------------------- */
function buildDashboard(area) {
  area.appendChild(el('h2', { class: 'serif' }, 'Where you are'));
  area.appendChild(el('p', { class: 'muted', style: 'font-size:.9rem; margin-bottom:16px' },
    'Green = solid · Amber = okay · Red = shaky · Grey = unseen.'));

  const decks = [
    { id: 'critics', label: 'Critics',     ids: DATA.critics.map(c => c.quote.slice(0, 40)) },
    { id: 'context', label: 'Context',     ids: DATA.context.map(c => c.term) },
    { id: 'sec_s2q', label: 'Sections → quotes', ids: DATA.sections.map(s => s.lines) },
    { id: 'sec_q2s', label: 'Quotes → section',  ids: [] }, // dynamic
    { id: 'themes',  label: 'Themes',      ids: DATA.themes.flatMap(t => t.subthemes.map(s => t.label + '::' + s.name.slice(0, 30))) },
    { id: 'plath',   label: 'Plath & Hughes', ids: DATA.plath_hughes.themes.map(t => 'plath::' + t.theme) },
  ];

  decks.forEach(d => {
    const summary = getDeckSummary(d.id, d.ids);
    const total = d.ids.length || 1;
    const block = el('div', { class: 'card-stage', style: 'min-height: auto; margin-bottom: 12px; padding: 20px' });
    block.appendChild(el('div', { style: 'display: flex; justify-content: space-between; margin-bottom: 12px' },
      el('h3', { style: 'font-family: var(--font-display); font-weight: 500' }, d.label),
      el('span', { class: 'muted', style: 'font-size: .85rem' },
        summary.solid + ' / ' + total + ' solid')
    ));
    // Stacked bar
    const bar = el('div', { style: 'height: 14px; border-radius: 7px; overflow: hidden; display: flex; background: var(--line)' });
    const segs = [
      { c: 'var(--solid)', n: summary.solid },
      { c: 'var(--okay)',  n: summary.okay  },
      { c: 'var(--shaky)', n: summary.shaky },
    ];
    segs.forEach(s => {
      if (s.n > 0) bar.appendChild(el('div', { style: 'background:' + s.c + '; flex: ' + s.n + ' 0 0' }));
    });
    block.appendChild(bar);
    // Dots
    const dotRow = el('div', { style: 'margin-top: 10px; display: flex; flex-wrap: wrap; gap: 4px' });
    const map = recall(`confidence_${d.id}`, {});
    d.ids.forEach(id => {
      const conf = map[id];
      const cls = conf ? conf.level : '';
      dotRow.appendChild(el('span', { class: 'heat-dot ' + cls, title: id + (conf ? ' · ' + conf.level : ' · unseen') }));
    });
    block.appendChild(dotRow);
    area.appendChild(block);
  });
}
