/* =======================================================================
   ENGINE — orbital physics + tournament state machine + canvas render.
   Clean build: no chat/hearts/CTA. Persistent champion stats + confetti.
   Exposes window.Engine = { boot, restart, state }.
   ======================================================================= */
window.Engine = (function () {
  const $ = (id) => document.getElementById(id);

  /* ---------- image cache ---------- */
  const imgCache = new Map();
  function getFlag(code) {
    const key = CONFIG.MODE + ':' + code;        // clé par mode (évite les collisions entre modes)
    if (imgCache.has(key)) return imgCache.get(key);
    const im = new Image();                        // pas de crossOrigin : on n'inspecte jamais les pixels → toute image du web s'affiche
    im.src = window.itemImage(code);
    im.__ready = false;
    im.onload = () => { im.__ready = true; };
    im.onerror = () => { im.__ready = false; };
    imgCache.set(key, im);
    return im;
  }

  /* ---------- canvas ---------- */
  let canvas, ctx;
  let CW = 700, CH = 700, CX = 350, CY = 350, RING_R = 320, _lastMeasuredW = 0;
  function sizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const wrap = $('arenaWrap');
    const w = wrap.clientWidth  > 80 ? wrap.clientWidth  : 700;
    const h = wrap.clientHeight > 80 ? wrap.clientHeight : 700;
    CW = w; CH = h; _lastMeasuredW = wrap.clientWidth;
    canvas.width = Math.round(CW * dpr); canvas.height = Math.round(CH * dpr);
    canvas.style.width = CW + 'px'; canvas.style.height = CH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    CX = CW / 2; CY = CH / 2;
    RING_R = Math.max(100, Math.min(CW, CH) / 2 - 20);
  }

  /* ---------- persistent stats (all-time champions) ---------- */
  // clés de stockage par MODE (les Pays gardent leurs anciennes clés pour ne rien perdre)
  function statsKey() { return CONFIG.MODE === 'countries' ? 'br_stats_v1' : 'br_stats_' + CONFIG.MODE; }
  function reignKey() { return CONFIG.MODE === 'countries' ? 'br_reigning_v1' : 'br_reigning_' + CONFIG.MODE; }
  function loadStats() {
    if (!CONFIG.PERSIST_STATS) return {};
    if (new URLSearchParams(location.search).get('reset') === '1') {
      try { localStorage.removeItem(statsKey()); } catch (e) {}
      return {};
    }
    try { return JSON.parse(localStorage.getItem(statsKey()) || '{}'); } catch (e) { return {}; }
  }
  function saveStats() {
    if (!CONFIG.PERSIST_STATS) return;
    try { localStorage.setItem(statsKey(), JSON.stringify(T.stats)); } catch (e) {}
  }
  function bumpStat(entry, field) {
    const s = T.stats[entry[0]] || (T.stats[entry[0]] = { code: entry[0], name: entry[1], titles: 0, wins: 0 });
    s.name = entry[1]; s[field] += 1;
    saveStats();
    window.Leaderboard && window.Leaderboard.updateChampions(T.stats);
  }

  /* ---------- tenant du titre (dernier champion) ---------- */
  function loadReigning() {
    if (!CONFIG.PERSIST_STATS) return null;
    if (new URLSearchParams(location.search).get('reset') === '1') { try { localStorage.removeItem(reignKey()); } catch (e) {} return null; }
    try { return JSON.parse(localStorage.getItem(reignKey()) || 'null'); } catch (e) { return null; }
  }
  function setReigning(entry) {
    const prev = T.reigning;                                   // titres consécutifs = "dynastie"
    const streak = (prev && prev.code === entry[0]) ? (prev.streak || 1) + 1 : 1;
    T.reigning = { code: entry[0], name: entry[1], streak };
    if (CONFIG.PERSIST_STATS) { try { localStorage.setItem(reignKey(), JSON.stringify(T.reigning)); } catch (e) {} }
    updateTitleHolder();
  }
  function updateTitleHolder() {
    const el = $('titleHolder'); if (!el) return;
    if (!CONFIG.SHOW_TITLE_HOLDER || !T.reigning) { el.style.display = 'none'; return; }
    el.style.display = '';
    const flag = `<img src="${window.itemImage(T.reigning.code)}" alt="" onerror="this.style.display='none'">`;
    const streak = T.reigning.streak || 1;
    const dyn = streak >= 2 ? `<span class="th-streak">🔥 ${streak} IN A ROW</span>` : '';
    el.innerHTML = `<span class="th-label">👑 Title holder</span>${flag}<span class="th-name">${T.reigning.name}</span>${dyn}`;
  }

  /* ---------- tournament state ---------- */
  const T = {
    phase: 'idle', roundIndex: 0, roundLabel: 'QUALIFYING',
    pendingHeats: [], currentHeat: null, roundWinners: [],
    processedFlags: 0, totalFlags: 0, heatTimer: 0, bannerTimer: 0,
    particles: [], stats: {}, reigning: null, mode: null,
    suddenDeath: false, heatIndex: 0, heatTotal: 0, eliminated: [], flagR: 15,
  };

  function pool() {
    let p = window.itemList().slice();
    if (CONFIG.POOL_LIMIT && CONFIG.POOL_LIMIT > 1) p = p.slice(0, CONFIG.POOL_LIMIT);
    if (CONFIG.START_SHUFFLE) shuffle(p);
    return p;
  }
  function labelForRound(n, roundIdx) {
    if (CONFIG.ALL_IN_ONE) return 'BATTLE ROYALE';     // mode express : une seule manche
    const gs = CONFIG.GROUP_SIZE;
    if (n <= gs) return 'FINAL';                       // tout tient dans une manche → finale
    if (roundIdx === 0) return 'QUALIFYING';           // le 1er round est toujours les qualifs
    if (Math.ceil(n / gs) <= gs) return 'SEMI-FINAL';  // le round suivant produira la finale
    return 'ROUND ' + (roundIdx + 1);
  }
  function splitIntoHeats(p) {
    if (CONFIG.ALL_IN_ONE) return [p];                 // mode express : tout le monde ensemble
    const gs = CONFIG.GROUP_SIZE, heats = [];
    for (let i = 0; i < p.length; i += gs) heats.push(p.slice(i, i + gs));
    if (heats.length > 1 && heats[heats.length - 1].length === 1) {
      heats[heats.length - 2].push(heats.pop()[0]);
    }
    return heats;
  }

  function startTournament() {
    // changement de mode → recharge le classement/champion propre à ce mode
    if (T.mode !== CONFIG.MODE) {
      T.mode = CONFIG.MODE;
      T.stats = loadStats();
      T.reigning = loadReigning();
      updateTitleHolder();
      window.Leaderboard && window.Leaderboard.updateChampions(T.stats);
    }
    const p = pool();
    T.roundIndex = 0; T.roundLabel = labelForRound(p.length, 0);
    T.pendingHeats = splitIntoHeats(p); T.roundWinners = [];
    T.heatIndex = 0; T.heatTotal = T.pendingHeats.length;
    T.processedFlags = 0; T.totalFlags = p.length;
    window.Leaderboard && window.Leaderboard.updateQualified([]);
    updateProgress(); nextHeat();
  }
  function startRound(winners) {
    T.roundLabel = labelForRound(winners.length, T.roundIndex);
    T.pendingHeats = splitIntoHeats(winners); T.roundWinners = [];
    T.heatIndex = 0; T.heatTotal = T.pendingHeats.length;
    window.Leaderboard && window.Leaderboard.updateQualified([]);
    nextHeat();
  }
  function nextHeat() {
    if (T.pendingHeats.length === 0) { advanceRound(); return; }
    T.currentHeat = T.pendingHeats.shift();
    T.heatIndex += 1;
    T.phase = 'heat'; T.heatTimer = CONFIG.HEAT_DURATION_SEC; T.suddenDeath = false;
    spawnParticles(T.currentHeat);
    setText('roundLabel', T.roundLabel);
    setText('tpRound', T.heatTotal > 1 ? `HEAT ${T.heatIndex}/${T.heatTotal}` : T.roundLabel);
    hideBanner();
    T.pendingHeats[0]?.forEach(c => getFlag(c[0]));
  }
  function advanceRound() {
    const winners = T.roundWinners.slice();
    if (T.roundLabel === 'FINAL' || winners.length <= 1) {
      const champ = winners[0] || (T.currentHeat && T.currentHeat[0]);
      if (champ) { bumpStat(champ, 'titles'); setReigning(champ); }
      showBanner('CHAMPION', champ, true);
      T.phase = 'champion'; T.bannerTimer = CONFIG.CHAMPION_BANNER_SEC;
      if (CONFIG.CONFETTI) confetti();
      window.SFX && window.SFX.champion();
      return;
    }
    T.roundIndex += 1; startRound(winners);
  }
  function onHeatWinner(entry) {
    if (!entry) return;
    T.suddenDeath = false;
    for (const p of T.particles) {
      if (p.state === 'alive' && p.entry !== entry) {
        p.state = 'exiting';
        const dx = p.x - CX, dy = p.y - CY, r = Math.hypot(dx, dy) || 1;
        p.exitVx = (dx / r) * (CONFIG.BASE_SPEED + 200);
        p.exitVy = (dy / r) * (CONFIG.BASE_SPEED + 200);
        rosterOut(p.code);
      }
    }
    rosterWin(entry[0]);
    if (T.currentHeat && T.roundIndex === 0)
      T.processedFlags = Math.min(T.totalFlags, T.processedFlags + T.currentHeat.length);
    updateProgress();
    T.roundWinners.push(entry);
    bumpStat(entry, 'wins');
    window.Leaderboard && window.Leaderboard.updateQualified(T.roundWinners);
    window.SFX && window.SFX.winner();
    // mode express : une seule manche → on saute l'annonce "heat winner",
    // on enchaîne directement sur WORLD CHAMPION
    if (CONFIG.ALL_IN_ONE) { T.phase = 'banner'; T.bannerTimer = 0; return; }
    showBanner(T.roundLabel === 'SEMI-FINAL' ? 'FINALIST' : 'HEAT WINNER', entry, false);
    T.phase = 'banner'; T.bannerTimer = CONFIG.WINNER_BANNER_SEC;
  }

  /* ---------- particles ---------- */
  function spawnParticles(heat) {
    T.flagR = CONFIG.FLAG_RADIUS;                 // on repart de la taille de départ
    // on fait apparaître tout le monde BIEN à l'intérieur : sinon le désempilage plaque
    // les boules contre la paroi et l'ouverture les élimine en masse dès la 1re seconde
    const lim  = Math.max(10, RING_R - CONFIG.FLAG_RADIUS);
    const maxR = lim * 0.84;
    T.particles = heat.map((entry) => {
      const ang = Math.random() * Math.PI * 2;
      const rr = Math.sqrt(Math.random()) * maxR;    // répartition uniforme sur tout le disque
      const dir = Math.random() * Math.PI * 2;
      const speed = Math.max(50, CONFIG.BASE_SPEED + (Math.random() * 2 - 1) * CONFIG.SPEED_JITTER);
      return { entry, code: entry[0], name: entry[1], img: getFlag(entry[0]),
        x: CX + Math.cos(ang) * rr, y: CY + Math.sin(ang) * rr,
        vx: Math.cos(dir) * speed, vy: Math.sin(dir) * speed, speed,
        state: 'alive', alpha: 1, exitVx: 0, exitVy: 0, scale: 0, trail: [] };
    });
    // désempilage : on sépare, puis on ramène tout le monde à l'intérieur (sinon le
    // désempilage éjecte les boules vers la paroi et elles sortent immédiatement)
    const safe = lim * 0.92;
    for (let k = 0; k < 14; k++) {
      resolveCollisions(true);
      for (const q of T.particles) {
        const dx = q.x - CX, dy = q.y - CY, d = Math.hypot(dx, dy) || 1;
        if (d > safe) { q.x = CX + dx / d * safe; q.y = CY + dy / d * safe; }
      }
    }
    T.suddenDeath = false;
    T.eliminated = []; _lastAlive = -1;
    if (window.Leaderboard) { window.Leaderboard.updateEliminated([]); window.Leaderboard.updateSurvivors(heat, heat.length); }
    updateAlive(T.particles.length);
    buildHeatRoster(heat);
  }

  /* ---------- rayon dynamique : les drapeaux grossissent quand il en reste peu ----------
     On garde la densité visuelle constante (r ∝ √(total/restants)), plafonnée. */
  function targetRadius() {
    const base = CONFIG.FLAG_RADIUS;
    if (!CONFIG.GROW_FLAGS) return base;
    const max = Math.max(base, CONFIG.FLAG_RADIUS_MAX || base);
    const alive = T.particles.filter(p => p.state === 'alive').length;
    if (alive < 1 || !T.totalFlags) return base;
    return Math.min(max, base * Math.sqrt(T.totalFlags / alive));
  }
  function FR() { return T.flagR || CONFIG.FLAG_RADIUS; }

  /* ---------- collisions boule ↔ boule (chocs élastiques, masses égales) ---------- */
  function resolveCollisions(positionOnly) {
    if (!CONFIG.COLLISIONS && !positionOnly) return;
    const alive = T.particles.filter(p => p.state === 'alive');
    const R = FR(), minD = R * 2, minD2 = minD * minD;
    for (let i = 0; i < alive.length; i++) {
      for (let j = i + 1; j < alive.length; j++) {
        const a = alive[i], b = alive[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        let d2 = dx * dx + dy * dy;
        if (d2 >= minD2) continue;
        if (d2 < 1e-6) { dx = (Math.random() - 0.5); dy = (Math.random() - 0.5); d2 = dx * dx + dy * dy; }
        const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
        // 1) séparation (on décolle les deux boules)
        const push = (minD - d) / 2 + 0.01;
        a.x -= nx * push; a.y -= ny * push;
        b.x += nx * push; b.y += ny * push;
        if (positionOnly) continue;
        // 2) échange des vitesses normales (choc élastique, masses égales)
        const avn = a.vx * nx + a.vy * ny, bvn = b.vx * nx + b.vy * ny;
        const diff = bvn - avn;
        if (diff < 0) {                       // seulement si elles se rapprochent
          a.vx += diff * nx; a.vy += diff * ny;
          b.vx -= diff * nx; b.vy -= diff * ny;
          if (CONFIG.SFX_BOUNCE !== false) window.SFX && window.SFX.bounce();
        }
      }
    }
  }

  let gapCenter = -Math.PI / 2;
  /* largeur de l'ouverture à l'instant t : s'élargit au fil de la manche + sudden death */
  function currentGapDeg() {
    const dur = Math.max(1, CONFIG.HEAT_DURATION_SEC);
    const ef = Math.max(0, Math.min(1, (dur - T.heatTimer) / dur));
    let g = CONFIG.GAP_ARC_DEG * (1 + (CONFIG.GAP_GROWTH || 0) * ef);
    if (T.suddenDeath) g *= (CONFIG.SUDDEN_DEATH_GAP || 1);
    return Math.min(180, g);
  }
  function angInGap(a) {
    const half = (currentGapDeg() * Math.PI / 180) / 2;
    return Math.abs(Math.atan2(Math.sin(a - gapCenter), Math.cos(a - gapCenter))) <= half;
  }
  function stepPhysics(dt) {
    gapCenter += (CONFIG.GAP_ROTATE_DEG_S * Math.PI / 180) * dt;
    // rayon animé en douceur vers sa cible (évite tout à-coup dans la physique)
    const prevR = T.flagR;
    T.flagR += (targetRadius() - T.flagR) * Math.min(1, dt * 1.8);
    const grew = T.flagR - prevR;
    const boundary = RING_R - T.flagR;                     // là où le drapeau touche l'anneau
    const jitterMax = (CONFIG.BOUNCE_RANDOM || 0) * Math.PI / 180;
    // léger regain de vitesse en fin de manche (garantit un vainqueur ; PAS d'attraction)
    const ef = Math.max(0, Math.min(1, (CONFIG.HEAT_DURATION_SEC - T.heatTimer) / Math.max(1, CONFIG.HEAT_DURATION_SEC)));
    let speedMult = 1 + (CONFIG.END_ACCEL || 0) * ef;
    if (T.suddenDeath) speedMult *= (CONFIG.SUDDEN_DEATH_SPEED || 1);
    for (const p of T.particles) {
      if (p.state === 'dead') continue;
      if (p.scale < 1) p.scale = Math.min(1, p.scale + dt * 3);
      if (p.state === 'exiting') { p.x += p.exitVx * dt; p.y += p.exitVy * dt; p.alpha -= dt * 1.6; if (p.alpha <= 0) { p.alpha = 0; p.state = 'dead'; } pushTrail(p); continue; }

      // Courbe optionnelle (0 par défaut = lignes droites). AUCUNE gravité / attraction.
      if (CONFIG.WANDER > 0) {
        const wob = (Math.random() * 2 - 1) * CONFIG.WANDER * dt, c = Math.cos(wob), s = Math.sin(wob);
        const nvx = p.vx * c - p.vy * s, nvy = p.vx * s + p.vy * c; p.vx = nvx; p.vy = nvy;
      }

      // vitesse cible (base + accélération fin de manche) ; vitesse constante sinon
      const target = p.speed * speedMult;
      { const cm = Math.hypot(p.vx, p.vy) || 1; p.vx = p.vx / cm * target; p.vy = p.vy / cm * target; }

      // Déplacement en ligne droite
      p.x += p.vx * dt; p.y += p.vy * dt;

      // Collision avec l'anneau : rebond, ou sortie si dans la zone
      const dx = p.x - CX, dy = p.y - CY, r = Math.hypot(dx, dy) || 0.0001, ux = dx / r, uy = dy / r;
      if (r >= boundary) {
        if (angInGap(Math.atan2(dy, dx))) {
          // ÉCHAPPÉE par la zone de sortie → éliminé
          p.state = 'exiting';
          p.exitVx = ux * (target + 260); p.exitVy = uy * (target + 260);
          rosterOut(p.code);
          // flux des derniers éliminés (colonne de gauche en mode express)
          T.eliminated.unshift(p.entry);
          if (T.eliminated.length > 14) T.eliminated.pop();
          window.Leaderboard && window.Leaderboard.updateEliminated(T.eliminated);
          window.SFX && window.SFX.elim(); pushTrail(p); continue;
        }
        // Rebond élastique sur la normale (aucune perte d'énergie), + hasard
        const vdotn = p.vx * ux + p.vy * uy;
        let rvx = p.vx - 2 * vdotn * ux, rvy = p.vy - 2 * vdotn * uy;
        if (jitterMax > 0) { const a = (Math.random() * 2 - 1) * jitterMax, c = Math.cos(a), s = Math.sin(a); const t = rvx * c - rvy * s; rvy = rvx * s + rvy * c; rvx = t; }
        const m = Math.hypot(rvx, rvy) || 1; p.vx = rvx / m * target; p.vy = rvy / m * target;
        const inR = boundary - 1; p.x = CX + ux * inR; p.y = CY + uy * inR;  // replacer juste à l'intérieur
        if (CONFIG.SFX_BOUNCE !== false) window.SFX && window.SFX.bounce();
      }
      pushTrail(p);
    }

    // ⚡ chocs entre boules (après le déplacement) → trajectoires imprévisibles
    resolveCollisions(false);
    // pendant que les drapeaux grossissent, une passe de séparation en plus (évite les superpositions)
    if (grew > 0.02) { resolveCollisions(true); resolveCollisions(true); }

    if (T.phase === 'heat') {
      const alive = T.particles.filter(p => p.state === 'alive');
      // 🔥 sudden death : quand il reste peu de survivants, tout s'accélère
      const sdAt = CONFIG.SUDDEN_DEATH_AT || 0;
      const sd = sdAt > 0 && alive.length > 1 && alive.length <= sdAt;
      if (sd !== T.suddenDeath) { T.suddenDeath = sd; if (sd) window.SFX && window.SFX.winner(); }
      updateAlive(alive.length);
      if (alive.length === 1) onHeatWinner(alive[0].entry);
      else if (alive.length === 0) onHeatWinner(T.particles[T.particles.length - 1].entry);
      else { T.heatTimer -= dt; if (T.heatTimer <= 0) { let b = alive[0], bd = Infinity; for (const p of alive) { const d = Math.hypot(p.x - CX, p.y - CY); if (d < bd) { bd = d; b = p; } } onHeatWinner(b.entry); } }
    }
  }
  function pushTrail(p) { if (!CONFIG.TRAILS) { p.trail.length = 0; return; } p.trail.push(p.x, p.y); const m = CONFIG.TRAIL_LENGTH * 2; while (p.trail.length > m) { p.trail.shift(); p.trail.shift(); } }
  function stepExitOnly(dt) {
    gapCenter += (CONFIG.GAP_ROTATE_DEG_S * Math.PI / 180) * dt;
    for (const p of T.particles) {
      if (p.state === 'exiting') { p.x += p.exitVx * dt; p.y += p.exitVy * dt; p.alpha -= dt * 1.6; if (p.alpha <= 0) p.state = 'dead'; }
      else if (p.state === 'alive' && p.scale < 1) p.scale = Math.min(1, p.scale + dt * 3);
    }
  }

  /* ---------- render ---------- */
  function drawRing() {
    ctx.save();
    const g = ctx.createRadialGradient(CX, CY, RING_R * 0.2, CX, CY, RING_R);
    g.addColorStop(0, hexA(CONFIG.ACCENT_1, 0.05)); g.addColorStop(1, hexA(CONFIG.ACCENT_1, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(CX, CY, RING_R, 0, Math.PI * 2); ctx.fill();
    if (T.suddenDeath) {
      // anneau ORANGE qui pulse : la zone de sortie reste le seul élément rouge → lisible
      const sd = CONFIG.SUDDEN_DEATH_COLOR || '#ff9d00';
      const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 130);
      ctx.lineWidth = 9;
      ctx.strokeStyle = hexA(sd, 0.55 + 0.4 * pulse);
      ctx.shadowColor = sd; ctx.shadowBlur = 16 + 18 * pulse;
    } else {
      ctx.lineWidth = 7;
      ctx.strokeStyle = hexA(CONFIG.RING_COLOR, 0.5);
      ctx.shadowColor = hexA(CONFIG.RING_COLOR, 0.4); ctx.shadowBlur = 14;
    }
    ctx.beginPath(); ctx.arc(CX, CY, RING_R, 0, Math.PI * 2); ctx.stroke();
    const half = (currentGapDeg() * Math.PI / 180) / 2;
    ctx.lineWidth = 16; ctx.strokeStyle = CONFIG.GAP_COLOR; ctx.shadowColor = CONFIG.GAP_COLOR; ctx.shadowBlur = 40;
    ctx.beginPath(); ctx.arc(CX, CY, RING_R, gapCenter - half, gapCenter + half); ctx.stroke();
    ctx.shadowBlur = 0; ctx.strokeStyle = hexA(CONFIG.GAP_COLOR, 0.25); ctx.lineWidth = 3;
    for (let k = -2; k <= 2; k++) { const a = gapCenter + k * (half / 2.4);
      ctx.beginPath(); ctx.moveTo(CX + Math.cos(a) * (RING_R + 5), CY + Math.sin(a) * (RING_R + 5)); ctx.lineTo(CX + Math.cos(a) * (RING_R + 17), CY + Math.sin(a) * (RING_R + 17)); ctx.stroke(); }
    ctx.restore();
  }
  // rendu allégé automatiquement quand il y a beaucoup de boules (ombres/traînées = très coûteux)
  function lightMode() { return T.particles.length > (CONFIG.LIGHT_RENDER_AT || 40); }
  function drawTrail(p) {
    if (!CONFIG.TRAILS || lightMode() || p.trail.length < 4) return;
    const n = p.trail.length / 2; ctx.save(); ctx.lineCap = 'round';
    for (let i = 1; i < n; i++) {
      const x0 = p.trail[(i - 1) * 2], y0 = p.trail[(i - 1) * 2 + 1], x1 = p.trail[i * 2], y1 = p.trail[i * 2 + 1], t = i / n;
      ctx.strokeStyle = hexA(p.state === 'exiting' ? CONFIG.ACCENT_2 : CONFIG.ACCENT_1, 0.26 * t * p.alpha);
      ctx.lineWidth = FR() * 0.9 * t * p.scale;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }
    ctx.restore();
  }
  function fallbackLabel(p) {
    const c = p.code;
    if (typeof c === 'string' && c.length <= 3) return c.toUpperCase();          // code pays (fr, de…)
    return String(p.name || c).replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase(); // sinon initiales du nom
  }
  /* ---------- sprites pré-découpés : ÉNORME gain CPU ----------
     Découper un cercle (clip) pour chaque boule à chaque image est très lent.
     On le fait UNE fois par drapeau dans un petit canvas réutilisé ensuite. */
  const SPRITE = 128;
  const spriteCache = new Map();
  function getSprite(p) {
    const key = CONFIG.MODE + ':' + p.code;
    if (spriteCache.has(key)) return spriteCache.get(key);
    const im = p.img;
    if (!im || !im.__ready || !im.naturalWidth) return null;   // pas encore chargé : on réessaiera
    const c = document.createElement('canvas'); c.width = SPRITE; c.height = SPRITE;
    const g = c.getContext('2d');
    const R = SPRITE / 2 - 3;
    g.save();
    g.beginPath(); g.arc(SPRITE / 2, SPRITE / 2, R, 0, Math.PI * 2); g.clip();
    g.fillStyle = '#26304f'; g.fillRect(0, 0, SPRITE, SPRITE);
    const iw = im.naturalWidth, ih = im.naturalHeight, sc = Math.max((R * 2) / iw, (R * 2) / ih);
    g.drawImage(im, SPRITE / 2 - iw * sc / 2, SPRITE / 2 - ih * sc / 2, iw * sc, ih * sc);
    g.restore();
    g.beginPath(); g.arc(SPRITE / 2, SPRITE / 2, R, 0, Math.PI * 2);
    g.lineWidth = 5; g.strokeStyle = 'rgba(255,255,255,0.65)'; g.stroke();
    spriteCache.set(key, c);
    return c;
  }

  function drawFlag(p) {
    const R = Math.max(0.5, FR() * p.scale);
    ctx.save();
    try {
      ctx.globalAlpha = p.alpha;
      const sp = getSprite(p);
      if (sp) {
        if (p.state === 'exiting') {   // halo rouge sur les éliminés
          ctx.beginPath(); ctx.arc(p.x, p.y, R + 3, 0, Math.PI * 2);
          ctx.fillStyle = hexA(CONFIG.ACCENT_2, 0.55); ctx.fill();
        }
        ctx.drawImage(sp, p.x - R, p.y - R, R * 2, R * 2);   // 1 seul appel, aucun clip
      } else {
        ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
        ctx.fillStyle = '#26304f'; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.stroke();
        ctx.fillStyle = '#cfe0ff'; ctx.font = `bold ${R * 0.62}px Orbitron, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(fallbackLabel(p), p.x, p.y);
      }
    } catch (e) { /* jamais laisser le canvas dans un état corrompu */ }
    ctx.restore();
    // le contour blanc est déjà dans le sprite : ici on ne dessine QUE le tenant du titre
    const isChamp = T.reigning && p.code === T.reigning.code;
    if (isChamp) {
      ctx.save(); ctx.globalAlpha = p.alpha;
      ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, Math.PI * 2);
      ctx.lineWidth = 4; ctx.strokeStyle = '#ffcf33';
      ctx.shadowColor = '#ffcf33'; ctx.shadowBlur = 14;
      ctx.stroke(); ctx.shadowBlur = 0;
      if (p.state === 'alive') {
        const cs = Math.max(16, Math.round(R * 1.1));
        ctx.font = `${cs}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('👑', p.x, p.y - R - cs * 0.45);
      }
      ctx.restore();
    }
  }
  function render() {
    ctx.clearRect(0, 0, CW, CH); drawRing();
    for (const p of T.particles) if (p.state !== 'dead') drawTrail(p);
    for (const p of T.particles) if (p.state === 'exiting') drawFlag(p);
    for (const p of T.particles) if (p.state === 'alive') drawFlag(p);
  }

  /* ---------- confetti ---------- */
  function confetti() {
    const box = $('confetti'); if (!box) return;
    const cols = [CONFIG.ACCENT_1, CONFIG.ACCENT_2, '#ffffff', '#ffd166'];
    for (let i = 0; i < 110; i++) {
      const c = document.createElement('div'); c.className = 'confetti-piece';
      c.style.left = (Math.random() * 100) + '%'; c.style.background = cols[(Math.random() * cols.length) | 0];
      c.style.setProperty('--x', (Math.random() * 240 - 120) + 'px'); c.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
      const dur = 2.4 + Math.random() * 2.2; c.style.animationDuration = dur + 's'; c.style.animationDelay = (Math.random() * 0.5) + 's';
      c.style.width = (7 + Math.random() * 9) + 'px'; c.style.height = (10 + Math.random() * 12) + 'px';
      box.appendChild(c); setTimeout(() => c.remove(), (dur + 0.6) * 1000);
    }
  }

  /* ---------- UI writes ---------- */
  function setText(id, t) { const e = $(id); if (e) e.textContent = t; }
  function fmtTime(s) { s = Math.max(0, Math.ceil(s)); return `${String((s / 60) | 0).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }
  function updateTimerUI() {
    const pill = $('timerPill'), t = $('tpTime'); if (!t) return;
    if (T.phase === 'heat') { t.textContent = fmtTime(T.heatTimer); pill.classList.toggle('low', T.heatTimer <= 10); }
    else if (T.phase === 'champion') { t.textContent = 'CHAMPION'; pill.classList.remove('low'); }
    else { t.textContent = 'NEXT UP'; pill.classList.remove('low'); }
  }
  let _lastAlive = -1;
  function updateAlive(n) {
    if (n === undefined) n = T.particles.filter(p => p.state === 'alive').length;
    // en mode express : barre de progression + liste des survivants suivent les éliminations
    if (CONFIG.ALL_IN_ONE && n !== _lastAlive) {
      _lastAlive = n; updateProgress();
      window.Leaderboard && window.Leaderboard.updateSurvivors(
        T.particles.filter(p => p.state === 'alive').map(p => p.entry), T.totalFlags);
    }
    const tag = $('aliveTag'); if (!tag) return;
    // états spectaculaires : FINAL 2 (duel) puis SUDDEN DEATH
    if (n === 2)            { tag.className = 'duel';   tag.innerHTML = '⚔️ FINAL 2 ⚔️'; }
    else if (T.suddenDeath) { tag.className = 'sudden'; tag.innerHTML = '🔥 SUDDEN DEATH 🔥'; }
    else                    { tag.className = '';       tag.innerHTML = `<b id="aliveN">${n}</b> IN THE RING`; }
  }
  function updateProgress() {
    // mode express : la barre montre les ÉLIMINÉS (elle se remplit pendant la manche)
    if (CONFIG.ALL_IN_ONE) {
      const alive = T.particles.filter(p => p.state === 'alive').length;
      const out = Math.max(0, T.totalFlags - alive);
      setText('progDone', out); setText('progTotal', T.totalFlags);
      const e = $('progressFill'); if (e) e.style.width = (T.totalFlags ? out / T.totalFlags * 100 : 0) + '%';
      setText('progStage', 'ELIMINATED');
      if (window.currentMode) setText('progNoun', window.currentMode().noun);
      return;
    }
    setText('progDone', T.processedFlags); setText('progTotal', T.totalFlags);
    const el = $('progressFill'); if (el) el.style.width = (T.totalFlags ? Math.min(100, T.processedFlags / T.totalFlags * 100) : 0) + '%';
    setText('progStage', T.roundLabel + ' STAGE');
    if (window.currentMode) setText('progNoun', window.currentMode().noun);
  }
  function showBanner(kind, entry, champion) {
    if (!entry) return; const b = $('winnerBanner');
    setText('wbTitle', champion ? '👑 WORLD CHAMPION 👑' : (kind === 'FINALIST' ? 'QUALIFIED FOR FINAL' : 'HEAT WINNER'));
    $('wbFlag').src = window.itemImage(entry[0]); setText('wbName', entry[1]);
    const titles = (T.stats[entry[0]] && T.stats[entry[0]].titles) || 0;
    setText('wbSub', champion ? (titles > 1 ? `${titles} titles 🏆` : 'Champion 🏆') : T.roundLabel);
    b.classList.toggle('champion', !!champion); b.classList.add('show');
    const at = $('aliveTag'); if (at) at.style.visibility = 'hidden';
  }
  function hideBanner() { $('winnerBanner').classList.remove('show'); const at = $('aliveTag'); if (at) at.style.visibility = 'visible'; }

  /* ---------- roster de la manche (6 pays, barrés si éliminés) ---------- */
  let rosterEls = {};
  function buildHeatRoster(heat) {
    const grid = $('hrGrid'); if (!grid) return;
    rosterEls = {}; grid.innerHTML = '';
    // trop de participants (mode express) → la liste des noms n'a plus de sens, on la masque
    const box = $('heatRoster');
    if (heat.length > 30) { if (box) box.style.display = 'none'; return; }
    if (box && CONFIG.SHOW_ROSTER) box.style.display = '';
    grid.className = heat.length > 9 ? 'compact' : '';   // beaucoup de participants → pastilles compactes
    const sorted = heat.slice().sort((a, b) => a[1].localeCompare(b[1]));  // ordre alphabétique
    for (const e of sorted) {
      const el = document.createElement('div');
      el.className = 'hr-chip';
      el.innerHTML = `<img src="${window.itemImage(e[0])}" alt="" onerror="this.style.visibility='hidden'"><span>${e[1]}</span>`;
      grid.appendChild(el); rosterEls[e[0]] = el;
    }
  }
  function rosterOut(code) { const el = rosterEls[code]; if (el) el.classList.add('out'); }
  function rosterWin(code) { const el = rosterEls[code]; if (el) { el.classList.remove('out'); el.classList.add('win'); } }

  /* ---------- loop ---------- */
  let last = performance.now();
  let lastDraw = -1e9;
  function loop(now) {
    requestAnimationFrame(loop);
    // plafond d'images/s : évite de calculer 60 fps quand on n'en diffuse que 25-30
    const cap = CONFIG.RENDER_FPS || 0;
    if (cap > 0 && (now - lastDraw) < (1000 / cap) - 1) return;
    lastDraw = now;
    try {
      let dt = (now - last) / 1000; last = now; if (dt > 0.05) dt = 0.05;
      const wrap = $('arenaWrap'); if (wrap.clientWidth > 80 && wrap.clientWidth !== _lastMeasuredW) sizeCanvas();
      if (T.phase === 'heat') stepPhysics(dt);
      else if (T.phase === 'banner' || T.phase === 'champion') {
        stepExitOnly(dt); T.bannerTimer -= dt;
        if (T.bannerTimer <= 0) { if (T.phase === 'champion') startTournament(); else nextHeat(); }
      }
      updateTimerUI(); render();
    } catch (err) { console.warn('frame error (recovered):', err && err.message); }
  }

  /* ---------- utils ---------- */
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } }
  function hexA(hex, a) { let h = (hex || '#fff').replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const r = parseInt(h.slice(0, 2), 16) || 0, g = parseInt(h.slice(2, 4), 16) || 0, b = parseInt(h.slice(4, 6), 16) || 0; return `rgba(${r},${g},${b},${a})`; }

  /* ---------- API ---------- */
  function boot() {
    canvas = $('arena'); ctx = canvas.getContext('2d');
    sizeCanvas();
    window.Leaderboard && window.Leaderboard.updateQualified([]);
    (pool()).slice(0, CONFIG.GROUP_SIZE * 2).forEach(c => getFlag(c[0]));
    startTournament();   // charge stats/champion du mode (T.mode : null → CONFIG.MODE)
    requestAnimationFrame(loop);
  }
  return { boot, restart: startTournament, state: T };
})();
