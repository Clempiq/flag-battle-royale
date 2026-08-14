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
    const lb = $('leaderboard'), q = $('qualified');
    if (CONFIG.SHOW_LEADERBOARD) { if ($('lbTitle')) $('lbTitle').textContent = CONFIG.LEADERBOARD_TITLE; makeCol('champ', 'lbTrack', 'lbViewport'); }
    else if (lb) lb.style.display = 'none';
    if (CONFIG.SHOW_QUALIFIED) { if ($('qTitle')) $('qTitle').textContent = CONFIG.QUALIFIED_TITLE; makeCol('qual', 'qTrack', 'qViewport'); }
    else if (q) q.style.display = 'none';
    requestAnimationFrame(loop);
  }

  return { init, updateChampions, updateQualified };
})();
