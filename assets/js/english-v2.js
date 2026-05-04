/* =============================================================================
   English V2 — three blurting flows tuned to Alice's exact request:
     1. Paradise Lost · Themes  → blank table per sub-theme, fill quotes + analysis
     2. Sections ↔ Quotes       → two-way drill
     3. Plath/Hughes · Topic    → 5-step blurt (poems → quotes → critics → context → analysis)

   This page is independent of the existing English page. It reads the same
   `assets/data/english.json` but does not modify it or any other page.
   ============================================================================= */
(function () {
  const SUBJECT = 'eng-v2';
  let DATA = null;

  // ---- bootstrap -----------------------------------------------------------
  document.addEventListener('DOMContentLoaded', async () => {
    // Countdown
    const exams = (typeof getExams === 'function') ? getExams() : [];
    const ex = exams.find(e => e.subject === 'eng' && /Poetry/i.test(e.title));
    if (ex) {
      const cd = document.getElementById('examCountdown');
      if (cd) startCountdown(new Date(ex.date), [cd]);
    }

    // Load data
    try {
      const res = await fetch('../assets/data/english.json?v=' + (window.APP_VERSION || ''));
      DATA = await res.json();
    } catch (e) {
      console.error('Could not load english.json', e);
    }

    // Mode card binding
    document.querySelectorAll('[data-mode]').forEach(card => {
      card.addEventListener('click', (ev) => {
        ev.preventDefault();
        const mode = card.getAttribute('data-mode');
        enterMode(mode);
      });
    });
  });

  function enterMode(mode) {
    document.getElementById('modePicker').style.display = 'none';
    const area = document.getElementById('revisionArea');
    area.style.display = '';
    area.innerHTML = '';
    const back = el('button', { class: 'btn btn-ghost', style: 'margin-bottom: 12px' }, '← back to modes');
    back.addEventListener('click', () => {
      area.innerHTML = '';
      area.style.display = 'none';
      document.getElementById('modePicker').style.display = '';
    });
    area.appendChild(back);
    if (mode === 'pl-themes') renderPLThemes(area);
    else if (mode === 'sections') renderSections(area);
    else if (mode === 'ph-topics') renderPHTopics(area);
  }

  // ===========================================================================
  // FLOW 1 — Paradise Lost · Themes
  // ===========================================================================
  function renderPLThemes(area) {
    const themes = (DATA && DATA.themes) || [];
    if (!themes.length) {
      area.appendChild(el('p', { class: 'muted' }, 'No themes loaded.'));
      return;
    }

    area.appendChild(el('h2', { class: 'serif' }, '🎭 Paradise Lost · Themes'));
    area.appendChild(el('p', { class: 'muted', style: 'margin-bottom: 14px' },
      'Pick a theme, then a sub-theme. The table stays blank until you blurt — but you can see how many quote rows you need to fill.'));

    // Theme list
    const themeGrid = el('div', { class: 'v2-grid' });
    themes.forEach(t => {
      const totalQuotes = (t.subthemes || []).reduce((n, st) => n + (st.items || []).length, 0);
      const card = el('a', { class: 'v2-card', href: '#' },
        el('span', { class: 'v2-card-title' }, t.label || '(untitled)'),
        el('p', { class: 'v2-card-meta' },
          (t.subthemes ? t.subthemes.length : 0) + ' sub-theme' + (t.subthemes && t.subthemes.length === 1 ? '' : 's')
          + ' · ' + totalQuotes + ' quote' + (totalQuotes === 1 ? '' : 's'))
      );
      card.addEventListener('click', (e) => {
        e.preventDefault();
        renderPLSubthemePicker(area, t);
      });
      themeGrid.appendChild(card);
    });
    area.appendChild(themeGrid);
  }

  function renderPLSubthemePicker(area, theme) {
    resetArea(area, '← back to themes', () => renderPLThemes(area));
    area.appendChild(el('h2', { class: 'serif' }, '🎭 ' + theme.label));
    if (theme.headline) {
      area.appendChild(el('p', { class: 'muted', style: 'margin-bottom: 16px; font-style: italic' }, theme.headline));
    }
    const grid = el('div', { class: 'v2-grid' });
    (theme.subthemes || []).forEach((st, i) => {
      const n = (st.items || []).length;
      const card = el('a', { class: 'v2-card', href: '#' },
        el('span', { class: 'v2-card-title' }, 'Sub-theme ' + (i + 1)),
        el('p', { class: 'v2-card-body' }, st.name || '(no description)'),
        el('p', { class: 'v2-card-meta' }, n + ' quote' + (n === 1 ? '' : 's') + ' to fill')
      );
      card.addEventListener('click', (e) => {
        e.preventDefault();
        renderPLBlurtTable(area, theme, st);
      });
      grid.appendChild(card);
    });
    area.appendChild(grid);
  }

  function renderPLBlurtTable(area, theme, subtheme) {
    resetArea(area, '← back to sub-themes', () => renderPLSubthemePicker(area, theme));
    area.appendChild(el('h2', { class: 'serif' }, '🎭 ' + theme.label));
    area.appendChild(el('p', { class: 'v2-subhead' }, subtheme.name));

    const items = subtheme.items || [];
    if (!items.length) {
      area.appendChild(el('p', { class: 'muted' }, 'No quotes for this sub-theme yet.'));
      return;
    }

    area.appendChild(el('p', { class: 'muted', style: 'margin: 6px 0 12px' },
      'Fill in each quote, then its analysis. The table preserves the original structure so you know how many quotes to recall.'));

    // Build the editable table
    const table = el('table', { class: 'v2-blurt-table' });
    const thead = el('thead', {},
      el('tr', {},
        el('th', { style: 'width: 4ch' }, '#'),
        el('th', {}, 'Quote'),
        el('th', {}, 'Analysis')
      )
    );
    table.appendChild(thead);
    const tbody = el('tbody');
    const inputs = []; // [{quote, analysis}]
    items.forEach((it, i) => {
      const qTa = el('textarea', { class: 'v2-cell-input', rows: '2', placeholder: 'Quote…' });
      const aTa = el('textarea', { class: 'v2-cell-input', rows: '3', placeholder: 'Analysis bullets…' });
      const tr = el('tr', {},
        el('td', { class: 'v2-rownum' }, String(i + 1)),
        el('td', {}, qTa),
        el('td', {}, aTa)
      );
      tbody.appendChild(tr);
      inputs.push({ quote: qTa, analysis: aTa });
    });
    table.appendChild(tbody);
    area.appendChild(table);

    // Buttons
    const btnRow = el('div', { class: 'v2-btn-row' });
    const checkBtn = el('button', { class: 'btn btn-primary' }, '✓ Check all');
    const dontKnowBtn = el('button', { class: 'btn btn-ghost' }, '? Show answer');
    const clearBtn = el('button', { class: 'btn btn-ghost' }, '⟲ Clear');
    btnRow.appendChild(checkBtn); btnRow.appendChild(dontKnowBtn); btnRow.appendChild(clearBtn);
    area.appendChild(btnRow);

    const reveal = el('div', { class: 'v2-reveal' });
    area.appendChild(reveal);

    let resolved = false;

    function showAnswers(showScores) {
      if (resolved) return;
      resolved = true;
      checkBtn.disabled = true;
      dontKnowBtn.disabled = true;
      // Reveal each row inline (replace inputs with answer + their guess)
      items.forEach((it, i) => {
        const inp = inputs[i];
        const guess = (inp.quote.value || '').trim();
        const sim = showScores ? similarity(guess, it.quote || '') : null;
        const cellQ = inp.quote.parentElement;
        const cellA = inp.analysis.parentElement;
        cellQ.innerHTML = '';
        cellA.innerHTML = '';

        // Quote cell: show answer, then user guess + score chip
        cellQ.appendChild(el('div', { class: 'v2-answer v2-quote' }, '“' + (it.quote || '') + '”'));
        if (guess) {
          const chip = scoreChip(sim, guess);
          cellQ.appendChild(chip);
        } else if (showScores) {
          cellQ.appendChild(el('div', { class: 'v2-your blurt-score-pill no' }, 'You left this blank.'));
        }

        // Analysis cell: list of bullets
        const ul = el('ul', { class: 'v2-answer-list' });
        (it.analysis || []).forEach(b => ul.appendChild(el('li', {}, b)));
        cellA.appendChild(ul);
        const yourA = (inp.analysis.value || '').trim();
        if (yourA) {
          cellA.appendChild(el('div', { class: 'v2-your-block' },
            el('div', { class: 'v2-your-label' }, 'Your answer:'),
            el('div', { class: 'v2-your-text' }, yourA)
          ));
        }
      });
      reveal.innerHTML = '';
      reveal.appendChild(el('p', { class: 'v2-done' },
        showScores ? '✓ Compare your version to the answer for each row.' : 'Re-read carefully, then come back.'));
    }

    checkBtn.addEventListener('click', () => showAnswers(true));
    dontKnowBtn.addEventListener('click', () => showAnswers(false));
    clearBtn.addEventListener('click', () => {
      inputs.forEach(({ quote, analysis }) => { quote.value = ''; analysis.value = ''; });
    });
  }

  // ===========================================================================
  // FLOW 2 — Sections ↔ Quotes (two-way)
  // ===========================================================================
  function renderSections(area) {
    const sections = (DATA && DATA.sections) || [];
    if (!sections.length) {
      area.appendChild(el('p', { class: 'muted' }, 'No sections loaded.'));
      return;
    }
    area.appendChild(el('h2', { class: 'serif' }, '🗺️ Sections ↔ Quotes'));

    // Direction picker
    const dirRow = el('div', { class: 'v2-segmented' });
    const btnA = el('button', { class: 'btn btn-primary v2-seg-btn active', 'data-dir': 'sec-to-q' }, 'Section → quotes');
    const btnB = el('button', { class: 'btn btn-ghost v2-seg-btn', 'data-dir': 'q-to-sec' }, 'Quote → which section?');
    dirRow.appendChild(btnA); dirRow.appendChild(btnB);
    area.appendChild(dirRow);

    const drillBox = el('div');
    area.appendChild(drillBox);

    function setDir(dir) {
      [btnA, btnB].forEach(b => {
        const on = b.getAttribute('data-dir') === dir;
        b.classList.toggle('active', on);
        b.classList.toggle('btn-primary', on);
        b.classList.toggle('btn-ghost', !on);
      });
      drillBox.innerHTML = '';
      if (dir === 'sec-to-q') renderSecToQuotes(drillBox, sections);
      else renderQuoteToSec(drillBox, sections);
    }
    btnA.addEventListener('click', () => setDir('sec-to-q'));
    btnB.addEventListener('click', () => setDir('q-to-sec'));
    setDir('sec-to-q');
  }

  function renderSecToQuotes(box, sections) {
    box.appendChild(el('p', { class: 'muted', style: 'margin: 12px 0 10px' },
      'Pick a section. Recall as many of its quotes as you can.'));
    const grid = el('div', { class: 'v2-grid' });
    sections.forEach(sec => {
      const card = el('a', { class: 'v2-card', href: '#' },
        el('span', { class: 'v2-card-title' }, sec.title || sec.lines || 'Section'),
        el('p', { class: 'v2-card-meta' }, (sec.lines ? 'Lines ' + sec.lines + ' · ' : '') + ((sec.quotes || []).length) + ' quotes')
      );
      card.addEventListener('click', (e) => {
        e.preventDefault();
        renderSecDrill(box, sections, sec);
      });
      grid.appendChild(card);
    });
    box.appendChild(grid);
  }

  function renderSecDrill(box, sections, sec) {
    box.innerHTML = '';
    const back = el('button', { class: 'btn btn-ghost', style: 'margin-bottom: 10px' }, '← back to sections');
    back.addEventListener('click', () => renderSecToQuotes(box, sections));
    box.appendChild(back);

    box.appendChild(el('h3', { class: 'serif' }, '🗺️ ' + (sec.title || sec.lines)));
    if (sec.lines) box.appendChild(el('p', { class: 'muted' }, 'Lines ' + sec.lines));

    const quotes = sec.quotes || [];
    const widget = blurtRecall({
      prompt: 'Blurt every quote you can recall from this section. Type each on its own line.',
      placeholder: 'One quote per line…',
      targets: quotes.map(q => ({ label: 'q', text: q })),
      reveal: () => {
        const wrap = el('div');
        wrap.appendChild(el('div', { class: 'v2-reveal-head' }, quotes.length + ' quote' + (quotes.length === 1 ? '' : 's') + ' from this section:'));
        quotes.forEach(q => wrap.appendChild(el('div', { class: 'v2-quote-line stagger-item' }, '“' + q + '”')));
        return wrap;
      }
    });
    box.appendChild(widget);
  }

  function renderQuoteToSec(box, sections) {
    box.appendChild(el('p', { class: 'muted', style: 'margin: 12px 0 10px' },
      'A random quote — name the section it comes from.'));

    // Pool (quote → section)
    const pool = [];
    sections.forEach(sec => (sec.quotes || []).forEach(q => pool.push({ quote: q, sec })));
    if (!pool.length) { box.appendChild(el('p', { class: 'muted' }, 'No quotes available.')); return; }

    const stage = el('div');
    box.appendChild(stage);
    const nextBtn = el('button', { class: 'btn btn-ghost', style: 'margin-top: 10px' }, '↻ Another quote');
    nextBtn.addEventListener('click', () => roll());
    box.appendChild(nextBtn);

    function roll() {
      stage.innerHTML = '';
      const item = pool[Math.floor(Math.random() * pool.length)];
      stage.appendChild(el('div', { class: 'v2-quote-card' }, '“' + item.quote + '”'));
      const widget = blurtRecall({
        prompt: 'Which section is this from?',
        placeholder: 'Section title or line numbers…',
        targets: [
          { label: 'title', text: item.sec.title || '' },
          { label: 'lines', text: item.sec.lines || '' }
        ].filter(t => t.text),
        reveal: () => {
          const wrap = el('div');
          wrap.appendChild(el('div', { class: 'v2-answer stagger-item' },
            (item.sec.title || '(untitled)') + (item.sec.lines ? ' · lines ' + item.sec.lines : '')));
          // Other quotes in that section
          const others = (item.sec.quotes || []).filter(q => q !== item.quote);
          if (others.length) {
            wrap.appendChild(el('div', { class: 'v2-reveal-head stagger-item', style: 'margin-top: 10px' }, 'Other quotes from this section:'));
            others.forEach(q => wrap.appendChild(el('div', { class: 'v2-quote-line stagger-item' }, '“' + q + '”')));
          }
          return wrap;
        }
      });
      stage.appendChild(widget);
    }
    roll();
  }

  // ===========================================================================
  // FLOW 3 — Plath/Hughes · Topic compare (5-step blurt)
  // ===========================================================================
  function renderPHTopics(area) {
    const themes = (DATA && DATA.plath_hughes && DATA.plath_hughes.themes) || [];
    if (!themes.length) {
      area.appendChild(el('p', { class: 'muted' }, 'No Plath/Hughes themes loaded.'));
      return;
    }
    area.appendChild(el('h2', { class: 'serif' }, '🖋️ Plath &amp; Hughes · Topic compare'));
    area.appendChild(el('p', { class: 'muted', style: 'margin-bottom: 14px' },
      'Pick a topic. You\u2019ll blurt each layer in turn: poems → key quotes → critics → context → analysis &amp; comparison.'));

    const grid = el('div', { class: 'v2-grid' });
    themes.forEach(t => {
      const pPoems = ((t.plath && t.plath.poems) || []).length;
      const hPoems = ((t.hughes && t.hughes.poems) || []).length;
      const card = el('a', { class: 'v2-card', href: '#' },
        el('span', { class: 'v2-card-title' }, t.theme || '(untitled)'),
        el('p', { class: 'v2-card-meta' }, 'Plath: ' + pPoems + ' · Hughes: ' + hPoems + ' poem' + (pPoems + hPoems === 1 ? '' : 's'))
      );
      card.addEventListener('click', (e) => {
        e.preventDefault();
        renderPHFlow(area, t, themes);
      });
      grid.appendChild(card);
    });
    area.appendChild(grid);
  }

  function renderPHFlow(area, theme, allThemes) {
    resetArea(area, '← back to topics', () => renderPHTopics(area));
    area.appendChild(el('h2', { class: 'serif' }, '🖋️ ' + (theme.theme || '')));

    // Step indicator
    const steps = ['Poems', 'Key quotes', 'Critics', 'Context', 'Analysis & comparison'];
    let cur = 0;
    const stepBar = el('div', { class: 'v2-stepbar' });
    steps.forEach((s, i) => {
      stepBar.appendChild(el('div', { class: 'v2-step', 'data-i': String(i) },
        el('span', { class: 'v2-step-num' }, String(i + 1)),
        el('span', { class: 'v2-step-label' }, s)
      ));
    });
    area.appendChild(stepBar);

    const stage = el('div', { class: 'v2-ph-stage' });
    area.appendChild(stage);

    function paintBar() {
      stepBar.querySelectorAll('.v2-step').forEach((node) => {
        const i = parseInt(node.getAttribute('data-i'), 10);
        node.classList.toggle('done', i < cur);
        node.classList.toggle('current', i === cur);
      });
    }

    function go(next) {
      if (typeof next === 'number') cur = next;
      paintBar();
      stage.innerHTML = '';
      if (cur === 0) stepPoems();
      else if (cur === 1) stepQuotes();
      else if (cur === 2) stepCritics();
      else if (cur === 3) stepContext();
      else if (cur === 4) stepAnalysis();
    }

    function stepFooter(label) {
      const row = el('div', { class: 'v2-btn-row' });
      const next = el('button', { class: 'btn btn-primary' }, label || 'Next step →');
      next.addEventListener('click', () => go(cur + 1));
      row.appendChild(next);
      if (cur > 0) {
        const back = el('button', { class: 'btn btn-ghost' }, '← previous');
        back.addEventListener('click', () => go(cur - 1));
        row.appendChild(back);
      }
      return row;
    }

    function stepPoems() {
      stage.appendChild(el('h3', { class: 'serif' }, 'Step 1 · Which two poems?'));
      stage.appendChild(el('p', { class: 'muted' },
        'For this topic, name the Plath poem and the Hughes poem you would compare.'));
      const pPoems = (theme.plath && theme.plath.poems) || [];
      const hPoems = (theme.hughes && theme.hughes.poems) || [];
      const widget = blurtRecall({
        prompt: 'Type both — Plath: …  Hughes: …',
        placeholder: 'Plath: «poem»\nHughes: «poem»',
        targets: [...pPoems, ...hPoems].map(p => ({ label: 'poem', text: p })),
        reveal: () => phTwoCol(
          { side: 'Plath', poems: pPoems },
          { side: 'Hughes', poems: hPoems },
          (s) => el('div', { class: 'v2-poem-pill stagger-item' }, s)
        )
      });
      stage.appendChild(widget);
      stage.appendChild(stepFooter());
    }

    function stepQuotes() {
      stage.appendChild(el('h3', { class: 'serif' }, 'Step 2 · Key quotes from each'));
      stage.appendChild(el('p', { class: 'muted' },
        'Blurt as many key quotes as you can — for both Plath and Hughes — on this topic.'));
      const pQs = (theme.plath && theme.plath.text_quotes) || [];
      const hQs = (theme.hughes && theme.hughes.text_quotes) || [];
      const widget = blurtRecall({
        prompt: 'One quote per line. Mix sides — we\u2019ll show the answer split by poet.',
        placeholder: 'Plath quote…\nPlath quote…\nHughes quote…',
        targets: [...pQs, ...hQs].map(q => ({ label: 'q', text: q })),
        reveal: () => phTwoCol(
          { side: 'Plath', poems: pQs },
          { side: 'Hughes', poems: hQs },
          (s) => el('div', { class: 'v2-quote-line stagger-item' }, '“' + s + '”')
        )
      });
      stage.appendChild(widget);
      stage.appendChild(stepFooter());
    }

    function stepCritics() {
      stage.appendChild(el('h3', { class: 'serif' }, 'Step 3 · Key critics'));
      stage.appendChild(el('p', { class: 'muted' },
        'Critics you\u2019d cite — try to recall both the critic and a snippet of what they say.'));
      const pCs = (theme.plath && theme.plath.critic_quotes) || [];
      const hCs = (theme.hughes && theme.hughes.critic_quotes) || [];
      const flatCritics = [...pCs.map(c => c.critic), ...hCs.map(c => c.critic), ...pCs.map(c => c.quote), ...hCs.map(c => c.quote)].filter(Boolean);
      const widget = blurtRecall({
        prompt: 'Name the critics and a phrase from what they say.',
        placeholder: 'Critic name — quote…',
        targets: flatCritics.map(t => ({ label: 'crit', text: t })),
        reveal: () => phTwoCol(
          { side: 'Plath', poems: pCs },
          { side: 'Hughes', poems: hCs },
          (c) => {
            const wrap = el('div', { class: 'v2-critic-card stagger-item' });
            if (c.critic) wrap.appendChild(el('div', { class: 'v2-critic-name' }, c.critic.replace(/\s*\u2013\s*$/, '').trim() || '(uncredited)'));
            if (c.quote) wrap.appendChild(el('div', { class: 'v2-critic-quote' }, '\u201c' + c.quote + '\u201d'));
            return wrap;
          }
        )
      });
      stage.appendChild(widget);
      stage.appendChild(stepFooter());
    }

    function stepContext() {
      stage.appendChild(el('h3', { class: 'serif' }, 'Step 4 · Context'));
      stage.appendChild(el('p', { class: 'muted' },
        'Biographical, historical or formal context you\u2019d weave in.'));
      const pCtx = (theme.plath && theme.plath.context) || [];
      const hCtx = (theme.hughes && theme.hughes.context) || [];
      const widget = blurtRecall({
        prompt: 'List context points for each side.',
        placeholder: 'Plath context…\nHughes context…',
        targets: [...pCtx, ...hCtx].map(t => ({ label: 'ctx', text: t })),
        reveal: () => phTwoCol(
          { side: 'Plath', poems: pCtx },
          { side: 'Hughes', poems: hCtx },
          (s) => el('div', { class: 'v2-context-line stagger-item' }, s)
        )
      });
      stage.appendChild(widget);
      stage.appendChild(stepFooter('Final step →'));
    }

    function stepAnalysis() {
      stage.appendChild(el('h3', { class: 'serif' }, 'Step 5 · Analysis &amp; comparison'));
      stage.appendChild(el('p', { class: 'muted' },
        'Now write the comparative analysis. What is the similar/different argument? Reveal to see the bullets you wrote earlier.'));
      const pBullets = (theme.plath && theme.plath.bullets) || [];
      const hBullets = (theme.hughes && theme.hughes.bullets) || [];
      const widget = blurtRecall({
        prompt: 'Write a paragraph or bullet points comparing the two on this topic.',
        placeholder: 'In Plath\u2019s X, … whereas in Hughes\u2019 Y, …',
        targets: [...pBullets, ...hBullets].map(t => ({ label: 'b', text: t })),
        reveal: () => phTwoCol(
          { side: 'Plath', poems: pBullets },
          { side: 'Hughes', poems: hBullets },
          (s) => el('div', { class: 'v2-bullet-line stagger-item' }, s)
        )
      });
      stage.appendChild(widget);

      const row = el('div', { class: 'v2-btn-row' });
      const restart = el('button', { class: 'btn btn-primary' }, '↻ Try another topic');
      restart.addEventListener('click', () => renderPHTopics(area));
      const back = el('button', { class: 'btn btn-ghost' }, '← previous');
      back.addEventListener('click', () => go(cur - 1));
      row.appendChild(restart); row.appendChild(back);
      stage.appendChild(row);
    }

    go(0);
  }

  // Two-column reveal helper used across PH flow
  function phTwoCol(left, right, itemRenderer) {
    const wrap = el('div', { class: 'v2-twocol' });
    [left, right].forEach(side => {
      const col = el('div', { class: 'v2-col' });
      col.appendChild(el('div', { class: 'v2-col-head stagger-item' }, side.side));
      const items = side.poems || [];
      if (!items.length) col.appendChild(el('div', { class: 'muted stagger-item' }, '(none recorded)'));
      else items.forEach(it => col.appendChild(itemRenderer(it)));
      wrap.appendChild(col);
    });
    return wrap;
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================
  function resetArea(area, backLabel, onBack) {
    area.innerHTML = '';
    const top = el('button', { class: 'btn btn-ghost', style: 'margin-bottom: 12px' }, '← back to modes');
    top.addEventListener('click', () => {
      area.innerHTML = '';
      area.style.display = 'none';
      document.getElementById('modePicker').style.display = '';
    });
    area.appendChild(top);
    if (backLabel) {
      const back = el('button', { class: 'btn btn-ghost', style: 'margin: 0 0 12px 8px' }, backLabel);
      back.addEventListener('click', onBack);
      area.appendChild(back);
    }
  }

  function scoreChip(sim, guess) {
    let cls = 'no', txt = 'Not quite';
    if (sim >= 0.75) { cls = 'good'; txt = '✓ Strong — ' + Math.round(sim * 100) + '%'; }
    else if (sim >= 0.40) { cls = 'close'; txt = '~ Close — ' + Math.round(sim * 100) + '%'; }
    else if (sim > 0) { cls = 'no'; txt = '✗ ' + Math.round(sim * 100) + '%'; }
    return el('div', { class: 'v2-your-block' },
      el('div', { class: 'v2-your-label' }, 'Your guess:'),
      el('div', { class: 'v2-your-text' }, '“' + guess + '”'),
      el('span', { class: 'blurt-score-pill ' + cls, style: 'margin-top: 4px' }, txt)
    );
  }
})();
