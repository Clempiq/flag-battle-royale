/* =======================================================================
   LEADERBOARD — deux colonnes qui défilent :
     • GAUCHE  : CHAMPIONS  (titres gagnés, persistant entre les tournois)
     • DROITE  : QUALIFIÉS  (vainqueurs du round en cours, remis à zéro à chaque round)
   ======================================================================= */
window.Leaderboard = (function () {
  const $ = (id) => document.getElementById(id);

  // une colonne = { track, viewport, html, singleH, offset, scrolling }
  const cols = {};

  function makeCol(name, trackId, viewportId) {
    const track = $(trackId), viewport = $(viewportId);
    if (!track || !viewport) return;
    cols[name] = { track, viewport, html: '', singleH: 0, offset: 0, scrolling: false };
  }

  function setCol(name, html, count) {
    const c = cols[name]; if (!c) return;
    c.html = html;
    c.track.style.transform = 'translateY(0)';
    c.track.innerHTML = html;
    c.singleH = c.track.scrollHeight;
    if (count && c.singleH > c.viewport.clientHeight + 4) {
      c.track.innerHTML = html + html;           // doublé pour une boucle sans couture
      c.scrolling = true;
      if (c.offset > c.singleH) c.offset = 0;
    } else {
      c.scrolling = false; c.offset = 0; c.track.style.transform = 'translateY(0)';
    }
    c.viewport.classList.toggle('scrolling', c.scrolling);  // fondu haut/bas seulement si ça défile
  }

  /* ---------- CHAMPIONS (gauche) ---------- */
  function championRow(s, i) {
    const rank = i + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
    const flag = `<img class="lb-flag" src="${window.itemImage(s.code)}" alt="" onerror="this.style.visibility='hidden'">`;
    return `<div class="lb-row${rank <= 3 ? ' top' : ''}"><span class="lb-rank">${medal}</span>${flag}<span class="lb-name">${s.name}</span><span class="lb-count">${s.titles}</span></div>`;
  }
  function updateChampions(stats) {
    if (!CONFIG.SHOW_LEADERBOARD || !cols.champ) return;
    const list = Object.values(stats || {}).filter(s => s.titles > 0)
      .sort((a, b) => (b.titles - a.titles) || (b.wins - a.wins) || a.name.localeCompare(b.name));
    const html = list.length ? list.map(championRow).join('')
      : `<div class="lb-empty">Waiting for the<br>first champion 👑</div>`;
    setCol('champ', html, list.length);
    updateChampStrip(list);
  }

  /* ---------- bandeau champions sur une ligne (mode express) ---------- */
  function updateChampStrip(list) {
    const el = $('champStrip'); if (!el) return;
    if (!CONFIG.ALL_IN_ONE || !CONFIG.SHOW_LEADERBOARD || !CONFIG.CHAMPIONS_STRIP) { el.style.display = 'none'; return; }
    el.style.display = 'flex';
    const medals = ['🥇', '🥈', '🥉'];
    if (!list.length) { el.innerHTML = `<span class="cs-lead">🏆 CHAMPIONS</span><span class="cs-empty">waiting for the first champion…</span>`; return; }
    el.innerHTML = `<span class="cs-lead">🏆</span>` + list.slice(0, 5).map((s, i) =>
      `<span class="cs-item${i === 0 ? ' first' : ''}">${medals[i] || (i + 1)}` +
      `<img src="${window.itemImage(s.code)}" alt="" onerror="this.style.display='none'">` +
      `<b>${s.name}</b><i>${s.titles}</i></span>`).join('');
  }

  /* ---------- QUALIFIÉS (droite) ---------- */
  function qualRow(e) {
    const flag = `<img class="lb-flag" src="${window.itemImage(e[0])}" alt="" onerror="this.style.visibility='hidden'">`;
    return `<div class="lb-row"><span class="q-check">✓</span>${flag}<span class="lb-name">${e[1]}</span></div>`;
  }
  function updateQualified(winners) {
    if (!CONFIG.SHOW_QUALIFIED || !cols.qual) return;
    const c = $('qCount'); if (c) c.textContent = (winners && winners.length) || 0;
    const list = (winners || []).slice().reverse();  // le plus récent en haut
    const html = list.length ? list.map(qualRow).join('')
      : `<div class="lb-empty">Round in progress…</div>`;
    setCol('qual', html, list.length);
  }

  /* ---------- DERNIERS ÉLIMINÉS (gauche, bas — mode express) ---------- */
  function updateEliminated(list) {
    if (!cols.elim) return;
    const l = (list || []).slice(0, 14);
    const html = l.length
      ? l.map((e, i) => `<div class="lb-row out${i === 0 ? ' fresh' : ''}">` +
          `<img class="lb-flag" src="${window.itemImage(e[0])}" alt="" onerror="this.style.visibility='hidden'">` +
          `<span class="lb-name">${e[1]}</span></div>`).join('')
      : `<div class="lb-empty">No one yet…</div>`;
    setCol('elim', html, 0);   // pas de défilement : on garde les plus récents en haut
  }

  /* ---------- SURVIVANTS (droite — mode express) ---------- */
  function updateSurvivors(list, total) {
    if (!cols.qual) return;
    const n = (list || []).length;
    const c = $('qCount'); if (c) c.textContent = n;
    const seuil = CONFIG.SURVIVORS_AT || 16;
    if (n > seuil) {
      setCol('qual', `<div class="lb-empty"><b class="surv-big">${n}</b><br>STILL IN<br><span class="surv-sub">of ${total}</span></div>`, 0);
      return;
    }
    const html = list.slice().sort((a, b) => a[1].localeCompare(b[1])).map(e =>
      `<div class="lb-row alive"><span class="q-check">•</span>` +
      `<img class="lb-flag" src="${window.itemImage(e[0])}" alt="" onerror="this.style.visibility='hidden'">` +
      `<span class="lb-name">${e[1]}</span></div>`).join('');
    setCol('qual', html, n);
  }

  /* ---------- boucle de défilement (les deux colonnes) ---------- */
  let last = performance.now();
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const sp = CONFIG.LEADERBOARD_SCROLL || 18;
    for (const k in cols) {
      const c = cols[k];
      if (c.scrolling && c.singleH > 0) {
        c.offset += sp * dt;
        if (c.offset >= c.singleH) c.offset -= c.singleH;
        c.track.style.transform = `translateY(${-c.offset}px)`;
      }
    }
  }

  function init() {
    const lb = $('leaderboard'), q = $('qualified'), lo = $('lastout');
    const express = !!CONFIG.ALL_IN_ONE;
    if (CONFIG.SHOW_LEADERBOARD) { if ($('lbTitle')) $('lbTitle').textContent = CONFIG.LEADERBOARD_TITLE; makeCol('champ', 'lbTrack', 'lbViewport'); }
    else if (lb) lb.style.display = 'none';
    if (CONFIG.SHOW_QUALIFIED) {
      if ($('qTitle')) $('qTitle').textContent = express ? CONFIG.SURVIVORS_TITLE : CONFIG.QUALIFIED_TITLE;
      makeCol('qual', 'qTrack', 'qViewport');
    } else if (q) q.style.display = 'none';
    // flux des éliminés : uniquement en mode express
    if (express && CONFIG.SHOW_LASTOUT) {
      if ($('loTitle')) $('loTitle').textContent = CONFIG.LASTOUT_TITLE;
      makeCol('elim', 'loTrack', 'loViewport');
    } else if (lo) lo.style.display = 'none';
    requestAnimationFrame(loop);
  }

  return { init, updateChampions, updateQualified, updateEliminated, updateSurvivors };
})();
