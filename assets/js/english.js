/* =========================================================================
   English revision modes — Paradise Lost Book 9 + Plath & Hughes
   v2 — blurt-first recall, hint/don't-know, cloze, fixed empty reveals,
        Plath/Hughes colour-coded with separated text vs critic quotes.
   ========================================================================= */

let DATA = null;
const DECK_ID = 'eng';

// Show countdown for exam
(function showExamCountdown() {
  const exam = window.EXAMS.find(e => e.subject === 'eng');
  if (!exam) return;
  const t = timeUntil(exam.date);
  const eL = document.getElementById('examCountdown');
  if (t.past) { eL.textContent = 'Done — well played'; return; }
  eL.textContent = t.days + ' day' + (t.days === 1 ? '' : 's') + ' to go';
})();

// Load data
fetch('../assets/data/english.json?v=' + window.APP_VERSION)
  .then(r => r.json())
  .then(d => { DATA = d; bindModePicker(); ensureClozeCard(); })
  .catch(err => {
    const area = document.getElementById('revisionArea');
    area.innerHTML = '';
    const p = document.createElement('p');
    p.style.color = 'red';
    p.textContent = 'Failed to load notes: ' + err;
    area.appendChild(p);
    area.style.display = 'block';
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

// Inject the new "Cloze" mode card if english.html doesn't have one yet.
function ensureClozeCard() {
  const picker = document.getElementById('modePicker');
  if (!picker) return;
  const grid = picker.querySelector('.mode-grid');
  if (!grid) return;
  if (grid.querySelector('[data-mode="cloze"]')) return;
  const card = el('a', { class: 'mode-card', 'data-mode': 'cloze' },
    el('span', { class: 'icon' }, '🧩'),
    el('h3', {}, 'Cloze quote drill'),
    el('p', {}, 'Fill in the missing words. Whole-gap and first-two-words variants.')
  );
  card.addEventListener('click', e => { e.preventDefault(); switchMode('cloze'); });
  grid.appendChild(card);
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
  else if (mode === 'cloze')    buildCloze(area);
  else if (mode === 'flashcards') window.buildFlashcards(area, 'eng');
  else if (mode === 'dashboard') buildDashboard(area);
}

/* Universal confidence row (✓ shaky | okay | solid) */
function showConfidenceRow(stage, deckId, cardId, onPicked) {
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
   1) CRITICS — quote shown, recall the author. Now with hint/don't-know.
   ---------------------------------------------------------------------- */
function buildCritics(area) {
  const critics = DATA.critics;
  const order = sortBySpacing('critics', critics, c => c.quote.slice(0, 40));
  let i = 0;

  area.appendChild(el('h2', { class: 'serif' }, 'Critics quotefall'));
  area.appendChild(el('p', { class: 'muted', style: 'font-size:.9rem; margin-bottom:12px' },
    'Read the quote, name the critic. Try to recall before clicking — even if you can only get a partial name.'));
  area.appendChild(el('div', { class: 'progress-bar' }, el('div', { class: 'fill', id: 'critProgress', style: 'width: 0%' })));
  const stage = el('div', { class: 'card-stage fade-in' });
  area.appendChild(stage);

  function render() {
    if (i >= order.length) {
      stage.innerHTML = '';
      stage.appendChild(el('div', { style: 'text-align:center; padding: 40px 0' },
        el('div', { style: 'font-size: 3rem' }, '✨'),
        el('h3', { style: 'margin: 12px 0' }, 'Round complete'),
        el('p', { class: 'muted' }, 'Want to go again? Cards you marked shaky come up first.'),
        el('button', { class: 'btn btn-primary', style: 'margin-top: 20px',
          onclick: () => { area.innerHTML = ''; buildCritics(area); }
        }, 'Round 2 →')
      ));
      return;
    }
    const c = order[i];
    const cardId = c.quote.slice(0, 40);
    const conf = getConfidence('critics', cardId);
    document.getElementById('critProgress').style.width = ((i / order.length) * 100) + '%';

    stage.innerHTML = '';
    stage.appendChild(el('div', { style: 'display:flex; justify-content:space-between; align-items:center; margin-bottom:14px' },
      el('span', { class: 'tag eng' }, 'Critic ' + (i + 1) + ' / ' + order.length),
      conf ? el('span', { class: 'heat-dot ' + conf.level, title: 'last: ' + conf.level }) : el('span')
    ));
    stage.appendChild(el('div', { class: 'quote-text', style: 'margin-bottom: 10px' }, '"' + c.quote + '"'));

    stage.appendChild(blurtRecall({
      prompt: 'Who said this? Type the critic\u2019s name (close enough is fine).',
      placeholder: 'e.g. Stanley Fish',
      targets: [{ text: c.author }],
      hint: lvl => {
        if (lvl === 1) return '🔡 Initials: ' + c.author.split(/\s+/).map(w => w[0] || '').join('. ') + '.';
        if (lvl === 2) return '✏️ First name: ' + c.author.split(/\s+/)[0];
        return '📖 Full name will be revealed when you check or skip.';
      },
      reveal: () => {
        const hook = critic_hook(c.author);
        const wrap = el('div', {});
        wrap.appendChild(el('div', { class: 'stagger-item', style: 'font-size: 1.4rem; margin-bottom: 10px' },
          el('span', { class: 'critic-chip', style: '--chip-bg: ' + hook.colour },
            el('span', { class: 'emoji' }, hook.emoji), c.author)));
        if (c.attribution) {
          wrap.appendChild(el('div', { class: 'stagger-item muted', style: 'font-size: 0.88rem' }, c.attribution));
        }
        return wrap;
      },
      onComplete: ({ score }) => {
        showConfidenceRow(stage, 'critics', cardId, () => { i++; render(); });
      }
    }));
  }
  render();
}

/* ----------------------------------------------------------------------
   2) CONTEXT — broad term shown, blurt the bullets, then reveal.
   ---------------------------------------------------------------------- */
function buildContext(area) {
  const blocks = DATA.context;
  const order = sortBySpacing('context', blocks, b => b.term);
  let i = 0;

  area.appendChild(el('h2', { class: 'serif' }, 'Context recall'));
  area.appendChild(el('p', { class: 'muted', style: 'font-size:.9rem; margin-bottom:12px' },
    'Term shown. Blurt the bullets you remember (don\u2019t worry about exact wording), then check.'));
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

    stage.appendChild(blurtRecall({
      prompt: 'What are the key bullets here?',
      targets: (b.bullets || []).map(bx => ({ text: bx })),
      hint: lvl => {
        if (lvl === 1) return '💡 ' + (b.bullets ? b.bullets.length : 0) + ' bullets to recall.';
        if (lvl === 2 && b.bullets && b.bullets[0]) return '✏️ First bullet starts: \u201c' + b.bullets[0].split(/\s+/).slice(0, 3).join(' ') + '\u2026\u201d';
        return '📖 Click Check or Don\u2019t know to see them.';
      },
      reveal: () => {
        const wrap = el('div', {});
        (b.bullets || []).forEach(bx => {
          wrap.appendChild(el('div', { class: 'stagger-item', style: 'padding: 8px 12px; line-height: 1.5' }, bx));
        });
        if (!wrap.children.length) wrap.appendChild(el('div', { class: 'muted' }, '(no bullets)'));
        return wrap;
      },
      onComplete: () => {
        showConfidenceRow(stage, 'context', b.term, () => { i++; render(); });
      }
    }));
  }
  render();
}

/* ----------------------------------------------------------------------
   3) SECTIONS ↔ QUOTES (Book 9 line map)
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

      stage.appendChild(blurtRecall({
        prompt: 'Recall the key quotes from this section.',
        targets: (s.quotes || []).map(q => ({ text: q })),
        hint: lvl => {
          if (lvl === 1) return '💡 ' + s.quotes.length + ' quote' + (s.quotes.length === 1 ? '' : 's') + ' from this section.';
          if (lvl === 2 && s.quotes[0]) return '✏️ First quote starts: \u201c' + s.quotes[0].split(/\s+/).slice(0, 2).join(' ') + '\u2026\u201d';
          return '📖 Click Check to see them all.';
        },
        reveal: () => {
          const wrap = el('div', {});
          s.quotes.forEach(q => {
            wrap.appendChild(el('div', { class: 'stagger-item quote-text', style: 'padding-left: 14px; margin-bottom: 8px' }, '"' + q + '"'));
          });
          if (!wrap.children.length) wrap.appendChild(el('div', { class: 'muted' }, '(no quotes for this section)'));
          return wrap;
        },
        onComplete: () => {
          showConfidenceRow(stage, 'sec_s2q', s.lines, () => { i++; render(); });
        }
      }));
    };
    render();
  } else if (mode === 'q2s') {
    // Multiple choice — already self-checking; add a Don't know button via blurt.
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
      const wrong = shuffle(DATA.sections.filter(s => s.lines !== item.section.lines)).slice(0, 3);
      const choices = shuffle([item.section, ...wrong]);
      const choicesEl = el('div', { style: 'display: grid; gap: 8px; margin-top: 12px' });
      let answered = false;
      choices.forEach(c => {
        const btn = el('button', { class: 'btn btn-ghost', style: 'justify-content: flex-start; text-align: left; padding: 12px 16px' },
          el('span', { class: 'kbd', style: 'margin-right: 10px' }, c.lines), c.title);
        btn.addEventListener('click', () => {
          if (answered) return;
          answered = true;
          choicesEl.querySelectorAll('button').forEach(b => b.disabled = true);
          if (c.lines === item.section.lines) {
            btn.style.background = 'var(--solid-bg)'; btn.style.borderColor = 'var(--solid)'; btn.style.color = 'var(--solid)';
          } else {
            btn.style.background = 'var(--shaky-bg)'; btn.style.borderColor = 'var(--shaky)'; btn.style.color = 'var(--shaky)';
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
      // Hint / Don't know strip
      const aux = el('div', { style: 'display:flex; gap:8px; margin-top: 14px' });
      const hintBtn = el('button', { class: 'btn btn-ghost' }, '💡 Hint');
      hintBtn.addEventListener('click', () => {
        // Highlight a wrong choice as definitely wrong
        const wrongBtns = Array.from(choicesEl.querySelectorAll('button')).filter(b => !b.textContent.includes(item.section.lines));
        if (wrongBtns[0]) {
          wrongBtns[0].disabled = true;
          wrongBtns[0].style.opacity = '0.4';
          wrongBtns[0].style.textDecoration = 'line-through';
        }
      });
      const skipBtn = el('button', { class: 'btn btn-ghost' }, '? Don\u2019t know');
      skipBtn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        choicesEl.querySelectorAll('button').forEach(b => {
          b.disabled = true;
          if (b.textContent.includes(item.section.lines)) {
            b.style.background = 'var(--solid-bg)'; b.style.borderColor = 'var(--solid)'; b.style.color = 'var(--solid)';
          }
        });
        showConfidenceRow(stage, 'sec_q2s', item.quote.slice(0, 30), () => { i++; render(); });
      });
      aux.appendChild(hintBtn); aux.appendChild(skipBtn);
      stage.appendChild(aux);
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
   4) THEMES — Pick a theme, blurt sub-themes & quotes & analysis
   ---------------------------------------------------------------------- */
function buildThemes(area) {
  area.appendChild(el('h2', { class: 'serif' }, 'Theme builder'));
  area.appendChild(el('p', { class: 'muted', style: 'font-size:.9rem; margin-bottom:16px' },
    'Pick a theme. For each sub-theme: try to recall the supporting quote and analysis before revealing.'));

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
  const heading = area.querySelector('h2'); const desc = area.querySelector('p.muted'); const grid = area.querySelector('.mode-grid');
  if (heading) heading.remove(); if (desc) desc.remove(); if (grid) grid.remove();

  const hook = theme_hook(theme.label);
  area.appendChild(el('div', { style: 'display:flex; align-items:center; gap:12px; margin-bottom:8px' },
    el('span', { style: 'font-size: 2rem; background:' + hook.colour + '20; color:' + hook.colour + '; width:56px; height:56px; display:flex; align-items:center; justify-content:center; border-radius:14px' }, hook.emoji),
    el('div', {}, el('h2', { class: 'serif', style: 'margin:0' }, theme.label),
                  el('p', { class: 'muted', style: 'font-size: .85rem; margin:0' }, theme.headline.slice(0, 100) + (theme.headline.length > 100 ? '...' : '')))
  ));

  theme.subthemes.forEach((sub, idx) => {
    const block = el('div', { class: 'card-stage fade-in', style: 'margin-bottom: 14px; min-height: auto' });
    block.appendChild(el('div', { style: 'display:flex; align-items:center; gap:8px; margin-bottom: 8px' },
      el('span', { class: 'tag eng' }, 'sub ' + (idx + 1) + '/' + theme.subthemes.length)));
    block.appendChild(el('h3', { class: 'serif', style: 'font-size: 1.1rem; margin: 4px 0 12px' }, sub.name));

    if (!sub.items || !sub.items.length) {
      block.appendChild(el('p', { class: 'muted' }, '(no quotes for this sub-theme)'));
      area.appendChild(block);
      return;
    }

    // 1) Blurt the QUOTES first — then reveal them.
    block.appendChild(phPart({
      label: '📝 Quotes for this sub-theme',
      prompt: 'Blurt the supporting quote' + (sub.items.length === 1 ? '' : 's') + ' (any keywords).',
      placeholder: 'Words you remember from the quote\u2026',
      targets: sub.items.map(it => ({ text: it.quote })),
      hint: lvl => {
        if (lvl === 1) return '💡 ' + sub.items.length + ' supporting quote' + (sub.items.length === 1 ? '' : 's') + '.';
        if (lvl === 2 && sub.items[0]) return '✏️ Starts: \u201c' + sub.items[0].quote.split(/\s+/).slice(0, 2).join(' ') + '\u2026\u201d';
        return '📖 Click Check to reveal.';
      },
      reveal: () => {
        const wrap = el('div', {});
        sub.items.forEach(item => {
          wrap.appendChild(el('div', { class: 'stagger-item pq-text-quote', style: 'margin-bottom: 6px' }, '\u201c' + item.quote + '\u201d'));
        });
        return wrap;
      }
    }));

    // 2) For each quote that has analysis bullets — separate blurt for the analysis.
    sub.items.forEach((item, qi) => {
      const analysis = item.analysis || [];
      if (!analysis.length) return;
      const allText = analysis.join(' ');
      const shortQ = '\u201c' + item.quote.split(/\s+/).slice(0, 6).join(' ') + (item.quote.split(/\s+/).length > 6 ? '\u2026' : '') + '\u201d';
      block.appendChild(phPart({
        label: '🔍 Analysis: ' + shortQ,
        prompt: 'What\u2019s the analysis / why does this quote matter?',
        placeholder: 'Devices, effect, links\u2026',
        targets: [{ text: allText }],
        hint: lvl => {
          if (lvl === 1) return '💡 ' + analysis.length + ' analytical point' + (analysis.length === 1 ? '' : 's') + '.';
          if (lvl === 2) return '✏️ Starts: \u201c' + (analysis[0] || '').split(/\s+/).slice(0, 3).join(' ') + '\u2026\u201d';
          return '📖 Click Check to reveal.';
        },
        reveal: () => {
          const wrap = el('div', { class: 'stagger-item', style: 'background: var(--bg); border-radius: 6px; padding: 8px 12px' });
          analysis.forEach(a => wrap.appendChild(el('p', { style: 'font-size: 0.92rem; margin: 4px 0; color: var(--ink-soft); line-height: 1.5' }, '· ' + a)));
          return wrap;
        }
      }));
    });

    // Confidence row at the bottom of the sub-theme
    const confId = theme.label + '::' + sub.name.slice(0, 30);
    showConfidenceRow(block, 'themes', confId, () => {});

    area.appendChild(block);
  });
}

/* ----------------------------------------------------------------------
   5) PLATH & HUGHES — colour-coded comparison with separated quote types
   ---------------------------------------------------------------------- */
function buildPlath(area) {
  area.appendChild(el('h2', { class: 'serif' }, 'Plath & Hughes — comparison'));
  area.appendChild(el('p', { class: 'muted', style: 'font-size:.9rem; margin-bottom:16px' },
    'Pick a theme. Try to recall the poems, key text quotes, and a critic\u2019s view for each side. Yellow = primary text quotes (the poet\u2019s words). Purple = critic quotes.'));

  const themes = DATA.plath_hughes && DATA.plath_hughes.themes;
  if (!themes || !themes.length) {
    area.appendChild(el('p', {}, 'No comparison notes yet.'));
    return;
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

    // PLATH column
    compare.appendChild(buildPHColumn('plath', '🌹 Plath', t.plath || {}, t.theme));
    // HUGHES column
    compare.appendChild(buildPHColumn('hughes', '🐺 Hughes', t.hughes || {}, t.theme));

    stage.appendChild(compare);

    // Comparison sentence frame
    const firstPlathTQ = (t.plath && t.plath.text_quotes && t.plath.text_quotes[0]) || '\u2026';
    const firstHughesTQ = (t.hughes && t.hughes.text_quotes && t.hughes.text_quotes[0]) || '\u2026';
    stage.appendChild(el('div', { class: 'hint', style: 'margin-top: 20px' },
      el('strong', {}, 'Sentence frame: '),
      'Both Plath and Hughes explore ', el('em', {}, t.theme || 'the theme'),
      ', but where Plath presents it as ____ (e.g. "', firstPlathTQ, '"), Hughes treats it as ____ ("', firstHughesTQ, '").'
    ));

    const confId = 'plath::' + t.theme;
    const confWrap = el('div', { class: 'card-stage', style: 'margin-top: 16px; min-height: auto' });
    confWrap.appendChild(el('p', { class: 'muted', style: 'text-align: center; font-size: .85rem' }, 'How well do you know this comparison?'));
    showConfidenceRow(confWrap, 'plath', confId, () => {});
    stage.appendChild(confWrap);
  }

  select.addEventListener('change', () => renderTheme(parseInt(select.value)));
  renderTheme(0);
}

/* Build one side (Plath OR Hughes) with proper colour-coded sections.
   v3 — each part (poems, text quotes, critic quotes, context, full notes) is
   its own blurt-then-reveal mini-section, mirroring how Alice has them in
   her notes. She blurts each part, checks against the reveal, then moves on. */
function buildPHColumn(side, title, data, themeLabel) {
  const col = el('div', { class: 'compare-col ' + side });
  col.appendChild(el('h4', {}, title));

  const poems = data.poems || [];
  const textQuotes = data.text_quotes || [];
  const criticQuotes = data.critic_quotes || [];
  const context = data.context || [];
  const bullets = data.bullets || [];

  // If absolutely nothing to show, render a clear empty-state message
  if (!poems.length && !textQuotes.length && !criticQuotes.length && !context.length && !bullets.length) {
    col.appendChild(el('div', { class: 'muted', style: 'padding: 16px 0; font-style: italic; text-align: center' },
      '(no notes for ' + side + ' on \u201c' + themeLabel + '\u201d)'));
    return col;
  }

  const sideName = side === 'plath' ? 'Plath' : 'Hughes';

  // 1) POEMS — which poems treat this theme on this side?
  if (poems.length) {
    col.appendChild(phPart({
      label: '📜 Poems',
      prompt: 'Which ' + sideName + ' poem' + (poems.length === 1 ? '' : 's') + ' treat' + (poems.length === 1 ? 's' : '') + ' this theme?',
      placeholder: 'e.g. Lesbos, Wuthering\u2026',
      targets: poems.map(p => ({ text: p })),
      hint: lvl => {
        if (lvl === 1) return '💡 ' + poems.length + ' poem' + (poems.length === 1 ? '' : 's') + ' to recall.';
        if (lvl === 2) return '🔡 First letter' + (poems.length === 1 ? '' : 's') + ': ' + poems.map(p => p[0]).join(' · ');
        return '📖 Click Check to reveal.';
      },
      reveal: () => {
        const wrap = el('div', { class: 'stagger-item' });
        poems.forEach(p => wrap.appendChild(el('span', { class: 'pq-poem-title' }, '\u2018' + p + '\u2019')));
        return wrap;
      }
    }));
  }

  // 2) TEXT QUOTES — the poet's own words (yellow)
  if (textQuotes.length) {
    col.appendChild(phPart({
      label: '📝 ' + sideName + '\u2019s words',
      prompt: 'Blurt a key quote from ' + sideName + ' for this theme.',
      placeholder: 'Any words you remember\u2026',
      targets: textQuotes.map(q => ({ text: q })),
      hint: lvl => {
        if (lvl === 1) return '💡 ' + textQuotes.length + ' text quote' + (textQuotes.length === 1 ? '' : 's') + ' to recall.';
        if (lvl === 2 && textQuotes[0]) return '✏️ Starts: \u201c' + textQuotes[0].split(/\s+/).slice(0, 2).join(' ') + '\u2026\u201d';
        return '📖 Click Check to reveal them all.';
      },
      reveal: () => {
        const wrap = el('div', { class: 'stagger-item' });
        textQuotes.forEach(q => wrap.appendChild(el('div', { class: 'pq-text-quote' }, '\u201c' + q + '\u201d')));
        return wrap;
      }
    }));
  }

  // 3) CRITIC QUOTES (purple)
  if (criticQuotes.length) {
    col.appendChild(phPart({
      label: '🎓 Critic quotes',
      prompt: 'Blurt a critic\u2019s view on ' + sideName + ' for this theme (any words).',
      placeholder: 'Critic\u2019s argument or name\u2026',
      targets: criticQuotes.map(c => ({ text: (c.quote || '') + ' ' + (c.critic || '') })),
      hint: lvl => {
        if (lvl === 1) return '💡 ' + criticQuotes.length + ' critic quote' + (criticQuotes.length === 1 ? '' : 's') + '.';
        if (lvl === 2 && criticQuotes[0]) {
          const c = criticQuotes[0];
          return '✏️ One says \u201c' + (c.quote || '').split(/\s+/).slice(0, 3).join(' ') + '\u2026\u201d';
        }
        return '📖 Click Check to reveal.';
      },
      reveal: () => {
        const wrap = el('div', { class: 'stagger-item' });
        criticQuotes.forEach(c => {
          const card = el('div', { class: 'pq-critic-quote' });
          card.appendChild(el('span', {}, c.quote || ''));
          if (c.critic) card.appendChild(el('span', { class: 'pq-critic-attrib' }, '— ' + c.critic));
          wrap.appendChild(card);
        });
        return wrap;
      }
    }));
  }

  // 4) CONTEXT (red)
  if (context.length) {
    col.appendChild(phPart({
      label: '🌍 Context',
      prompt: 'What context links ' + sideName + ' to this theme? (biographical / historical)',
      placeholder: 'Any context you remember\u2026',
      targets: context.map(c => ({ text: c })),
      hint: lvl => {
        if (lvl === 1) return '💡 ' + context.length + ' context point' + (context.length === 1 ? '' : 's') + '.';
        if (lvl === 2 && context[0]) return '✏️ Starts: \u201c' + context[0].split(/\s+/).slice(0, 3).join(' ') + '\u2026\u201d';
        return '📖 Click Check to reveal.';
      },
      reveal: () => {
        const wrap = el('div', { class: 'stagger-item' });
        context.forEach(c => wrap.appendChild(el('div', { class: 'pq-context' }, c)));
        return wrap;
      }
    }));
  }

  // 5) FULL NOTES bullets — collapsible, no blurt (it's the long-form notes)
  if (bullets.length) {
    const det = el('details', { style: 'margin-top: 10px; padding: 10px 12px; border: 1px dashed var(--line); border-radius: 8px' },
      el('summary', { class: 'muted', style: 'font-size: 0.85rem; cursor: pointer' }, '📖 Full analysis notes (' + bullets.length + ' bullets)'));
    const ul = el('ul', { style: 'font-size: 0.85rem; padding: 8px 0 0 16px; line-height: 1.5; color: var(--ink-soft); margin: 0' });
    bullets.forEach(b => ul.appendChild(el('li', { style: 'margin-bottom: 4px' }, b)));
    det.appendChild(ul);
    col.appendChild(det);
  }

  return col;
}

/* phPart — helper that wraps blurtRecall in a labelled mini-section,
   so each part of a column or sub-theme reads like a chunk from Alice\u2019s
   notes: a heading, a blurt box, then a reveal. */
function phPart(opts) {
  const wrap = el('div', { class: 'ph-part', style: 'margin: 14px 0; padding: 12px 14px; background: var(--bg); border-radius: 8px; border: 1px solid var(--line-soft)' });
  if (opts.label) wrap.appendChild(el('div', { class: 'ph-part-label', style: 'font-family: var(--font-display); font-size: 0.95rem; font-weight: 500; margin-bottom: 8px; color: var(--ink)' }, opts.label));
  wrap.appendChild(blurtRecall({
    prompt: opts.prompt,
    placeholder: opts.placeholder,
    targets: opts.targets,
    hint: opts.hint,
    reveal: opts.reveal,
    onComplete: () => {}
  }));
  return wrap;
}

/* ----------------------------------------------------------------------
   6) CLOZE — fill-in-the-blank for poetry quotes (Book 9 + Plath/Hughes)
   ---------------------------------------------------------------------- */
function buildCloze(area) {
  area.appendChild(el('h2', { class: 'serif' }, 'Cloze quote drill'));
  area.appendChild(el('p', { class: 'muted', style: 'font-size:.9rem; margin-bottom:12px' },
    'Fill in the missing words. Two variants per quote: whole-gap (you supply the entire line), and first-two-words (we prime you, you complete it).'));

  // Build a flat pool of quotes (Book 9 + Plath/Hughes text quotes)
  const pool = [];
  (DATA.sections || []).forEach(s => (s.quotes || []).forEach(q => pool.push({ text: q, src: 'PL ' + s.lines })));
  if (DATA.plath_hughes && DATA.plath_hughes.themes) {
    DATA.plath_hughes.themes.forEach(t => {
      ((t.plath && t.plath.text_quotes) || []).forEach(q => pool.push({ text: q, src: 'Plath · ' + t.theme }));
      ((t.hughes && t.hughes.text_quotes) || []).forEach(q => pool.push({ text: q, src: 'Hughes · ' + t.theme }));
    });
  }
  const order = shuffle(pool);
  let i = 0;

  area.appendChild(el('div', { class: 'progress-bar' }, el('div', { class: 'fill', id: 'clozeProgress', style: 'width: 0%' })));
  const stage = el('div', { class: 'card-stage fade-in' });
  area.appendChild(stage);

  function render() {
    if (i >= order.length) { stage.innerHTML = '<div style="text-align:center; padding: 40px 0"><h3>✨ Done</h3></div>'; return; }
    const item = order[i];
    document.getElementById('clozeProgress').style.width = ((i / order.length) * 100) + '%';
    stage.innerHTML = '';

    // Alternate variants: even = first-two-words, odd = whole gap
    const variant = (i % 2 === 0) ? 'first-two-words' : 'whole';
    stage.appendChild(el('span', { class: 'tag eng' }, item.src + ' · ' + (variant === 'whole' ? 'whole gap' : 'first 2 words shown')));

    const words = item.text.split(/\s+/);
    const firstTwo = words.slice(0, 2).join(' ');
    const rest = words.slice(2).join(' ');

    // Prompt
    if (variant === 'whole') {
      stage.appendChild(el('p', { class: 'muted', style: 'margin: 12px 0' }, 'Type the full quote.'));
    } else {
      stage.appendChild(el('div', { class: 'cloze', style: 'margin: 16px 0' },
        el('span', { class: 'cloze-shown' }, '\u201c' + firstTwo + ' '),
        el('span', { class: 'cloze-gap' }, '_'.repeat(Math.min(50, rest.length || 12))),
        el('span', { class: 'cloze-shown' }, '\u201d')
      ));
      stage.appendChild(el('p', { class: 'muted', style: 'margin-top: 8px' }, 'Complete the rest of the quote.'));
    }

    stage.appendChild(blurtRecall({
      prompt: '',
      placeholder: variant === 'whole' ? 'Type the full quote\u2026' : 'Continue from "' + firstTwo + ' \u2026"',
      targets: variant === 'whole' ? [{ text: item.text }] : [{ text: rest }],
      hint: lvl => {
        const tgt = variant === 'whole' ? item.text : rest;
        if (lvl === 1) return '🔡 ' + tgt.split(/\s+/).map(w => w[0] || '').join(' ');
        if (lvl === 2) return '✏️ Starts: \u201c' + tgt.split(/\s+/).slice(0, 2).join(' ') + '\u2026\u201d';
        return '📖 Half: \u201c' + tgt.slice(0, Math.floor(tgt.length / 2)) + '\u2026\u201d';
      },
      reveal: () => {
        const wrap = el('div', {});
        wrap.appendChild(el('div', { class: 'stagger-item quote-text', style: 'padding: 10px 14px; background: rgba(255, 235, 100, 0.15); border-left: 3px solid #E0C84A; border-radius: 4px' }, '\u201c' + item.text + '\u201d'));
        wrap.appendChild(el('div', { class: 'stagger-item muted', style: 'font-size: 0.85rem; margin-top: 6px' }, 'Source: ' + item.src));
        return wrap;
      },
      onComplete: () => {
        const confId = 'cloze::' + item.text.slice(0, 30);
        showConfidenceRow(stage, 'cloze', confId, () => { i++; render(); });
      }
    }));
  }
  render();
}

/* ----------------------------------------------------------------------
   7) DASHBOARD — heat map of all decks
   ---------------------------------------------------------------------- */
function buildDashboard(area) {
  area.appendChild(el('h2', { class: 'serif' }, 'Where you are'));
  area.appendChild(el('p', { class: 'muted', style: 'font-size:.9rem; margin-bottom:16px' },
    'Green = solid · Amber = okay · Red = shaky · Grey = unseen.'));

  const decks = [
    { id: 'critics', label: 'Critics',     ids: DATA.critics.map(c => c.quote.slice(0, 40)) },
    { id: 'context', label: 'Context',     ids: DATA.context.map(c => c.term) },
    { id: 'sec_s2q', label: 'Sections → quotes', ids: DATA.sections.map(s => s.lines) },
    { id: 'sec_q2s', label: 'Quotes → section',  ids: [] },
    { id: 'themes',  label: 'Themes',      ids: DATA.themes.flatMap(t => t.subthemes.map(s => t.label + '::' + s.name.slice(0, 30))) },
    { id: 'plath',   label: 'Plath & Hughes', ids: ((DATA.plath_hughes && DATA.plath_hughes.themes) || []).map(t => 'plath::' + t.theme) },
    { id: 'cloze',   label: 'Cloze quotes', ids: [] },
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
