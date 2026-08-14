/* =======================================================================
   HOME — page d'accueil : règle tout ici, puis clique DÉMARRER.
   Les réglages sont sauvegardés dans le navigateur (localStorage).
   Pour OBS : mets ?go=1 dans l'URL pour lancer direct sans passer par le menu.
   ======================================================================= */
window.Home = (function () {
  const $ = (id) => document.getElementById(id);
  const LS_KEY = 'br_config_v5';
  const DEFAULTS = Object.assign({}, window.CONFIG); // capturé avant tout override

  // key, label, type, [min, max, step]
  const SCHEMA = [
    ['🎮 Mode de jeu', [
      ['MODE', 'Contenu du jeu', 'select'],
    ]],
    ['🏆 Tournoi', [
      ['START_SHUFFLE',       'Pays mélangés à chaque championnat', 'bool'],
      ['GROUP_SIZE',          'Éléments par manche',        'range', 3, 30, 1],
      ['HEAT_DURATION_SEC',   'Durée max d’une manche (s)', 'range', 10, 120, 1],
      ['POOL_LIMIT',          'Limiter le nombre de pays (0 = tous)', 'range', 0, 195, 1],
      ['WINNER_BANNER_SEC',   'Pause vainqueur (s)',        'range', 1, 10, 0.5],
      ['CHAMPION_BANNER_SEC', 'Pause champion (s)',         'range', 2, 20, 1],
    ]],
    ['⚡ Vitesse & rebonds', [
      ['BASE_SPEED',    'Vitesse des boules',           'range', 60, 400, 5],
      ['SPEED_JITTER',  'Variation de vitesse',         'range', 0, 150, 5],
      ['BOUNCE_RANDOM', 'Hasard des rebonds (°)',       'range', 0, 45, 1],
      ['COLLISIONS',    'Chocs entre boules',           'bool'],
      ['END_ACCEL',     'Accélération fin de manche',   'range', 0, 2, 0.1],
      ['WANDER',        'Courbes (0 = lignes droites)', 'range', 0, 6, 0.1],
      ['FLAG_RADIUS',   'Taille des drapeaux',          'range', 14, 70, 1],
      ['TRAILS',        'Traînées',                     'bool'],
    ]],
    ['🎯 Zone de sortie (élimination)', [
      ['GAP_ARC_DEG',      'Largeur de départ (°)',      'range', 15, 140, 1],
      ['GAP_GROWTH',       'Élargissement en fin de manche', 'range', 0, 4, 0.1],
      ['GAP_ROTATE_DEG_S', 'Vitesse de rotation (°/s)',  'range', -120, 120, 1],
    ]],
    ['🔥 Sudden death', [
      ['SUDDEN_DEATH_AT',    'Déclenche à N survivants (0 = off)', 'range', 0, 8, 1],
      ['SUDDEN_DEATH_SPEED', 'Boost de vitesse',                   'range', 1, 2.5, 0.05],
      ['SUDDEN_DEATH_GAP',   'Élargissement de l’ouverture',       'range', 1, 3, 0.1],
      ['SUDDEN_DEATH_COLOR', 'Couleur de l’anneau',                'color'],
    ]],
    ['🎨 Couleurs', [
      ['GAP_COLOR',  'Zone de sortie', 'color'],
      ['RING_COLOR', 'Anneau',         'color'],
      ['ACCENT_1',   'Accent 1 (cyan)','color'],
      ['ACCENT_2',   'Accent 2 (rouge)','color'],
      ['BG_TOP',     'Fond (haut)',    'color'],
      ['BG_BOTTOM',  'Fond (bas)',     'color'],
    ]],
    ['🖥️ Affichage', [
      ['SHOW_ROUND_LABEL',  'Nom du round',        'bool'],
      ['SHOW_TIMER',        'Chronomètre',         'bool'],
      ['SHOW_ALIVE',        'Compteur "in the ring"','bool'],
      ['SHOW_PROGRESS',     'Barre de progression','bool'],
      ['SHOW_LEADERBOARD',  'Champions (gauche)',  'bool'],
      ['SHOW_QUALIFIED',    'Qualifiés (droite)',  'bool'],
      ['SHOW_ROSTER',       'Pays de la manche',   'bool'],
      ['SHOW_TITLE_HOLDER', 'Tenant du titre',     'bool'],
      ['CONFETTI',          'Confettis (champion)','bool'],
    ]],
    ['🔊 Sons', [
      ['SFX',        'Effets sonores',      'bool'],
      ['SFX_BOUNCE', 'Son des rebonds',     'bool'],
      ['SFX_VOLUME', 'Volume',              'range', 0, 1, 0.05],
    ]],
  ];
  const KEYS = SCHEMA.flatMap(g => g[1].map(r => r[0]));

  function load() {
    try { const s = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); for (const k of KEYS) if (k in s) CONFIG[k] = s[k]; } catch (e) {}
  }
  function save() {
    const o = {}; for (const k of KEYS) o[k] = CONFIG[k];
    try { localStorage.setItem(LS_KEY, JSON.stringify(o)); } catch (e) {}
  }

  function fmt(v) { return (Math.round(v * 100) / 100).toString(); }
  function toHex6(c) { let h = (c || '#ffffff').replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join(''); return '#' + h.slice(0, 6); }

  function build() {
    const form = $('homeForm'); form.innerHTML = '';
    for (const [group, rows] of SCHEMA) {
      const sec = document.createElement('div'); sec.className = 'h-sec';
      const h = document.createElement('div'); h.className = 'h-sec-title'; h.textContent = group; sec.appendChild(h);
      const grid = document.createElement('div'); grid.className = 'h-grid';
      for (const row of rows) {
        const [key, label, type] = row;
        const cell = document.createElement('label'); cell.className = 'h-cell';
        const lab = document.createElement('span'); lab.className = 'h-label'; lab.textContent = label; cell.appendChild(lab);
        if (type === 'range') {
          const [, , , min, max, step] = row;
          const val = document.createElement('span'); val.className = 'h-val'; val.textContent = fmt(CONFIG[key]); lab.appendChild(val);
          const inp = document.createElement('input'); inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step; inp.value = CONFIG[key];
          inp.oninput = () => { CONFIG[key] = +inp.value; val.textContent = fmt(+inp.value); };
          cell.appendChild(inp);
        } else if (type === 'bool') {
          cell.classList.add('h-cell-bool');
          const inp = document.createElement('input'); inp.type = 'checkbox'; inp.className = 'h-toggle'; inp.checked = !!CONFIG[key];
          inp.onchange = () => { CONFIG[key] = inp.checked; };
          cell.appendChild(inp);
        } else if (type === 'color') {
          const inp = document.createElement('input'); inp.type = 'color'; inp.value = toHex6(CONFIG[key]);
          inp.oninput = () => { CONFIG[key] = inp.value; };
          cell.appendChild(inp);
        } else if (type === 'select') {
          const inp = document.createElement('select'); inp.className = 'h-select';
          (window.MODES || []).forEach(m => { const o = document.createElement('option'); o.value = m.id; o.textContent = m.label; if (CONFIG[key] === m.id) o.selected = true; inp.appendChild(o); });
          inp.onchange = () => { CONFIG[key] = inp.value; };
          cell.appendChild(inp);
        }
        grid.appendChild(cell);
      }
      sec.appendChild(grid); form.appendChild(sec);
    }
  }

  function toast(msg) { const t = $('homeToast'); if (!t) return; t.textContent = msg; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 1800); }

  function show() {
    build();
    $('home').classList.remove('hidden');
    $('stage').style.display = 'none';
  }
  function isFs() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function enterFs() { const el = document.documentElement; const fn = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen; if (fn) { try { fn.call(el); } catch (e) {} } }
  function exitFs() { const fn = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen; if (fn) { try { fn.call(document); } catch (e) {} } }
  function toggleFs() { if (isFs()) exitFs(); else enterFs(); }
  function updateFsLabels() {
    const bf = $('btnFullscreen'); if (bf) bf.textContent = isFs() ? '🗗 Mode fenêtre' : '⛶ Plein écran';
    const ft = $('fsToggle'); if (ft) ft.textContent = isFs() ? '🗗' : '⛶';
  }
  function start() {
    save();
    enterFs();                 // masque les onglets / le navigateur pour la capture
    $('home').classList.add('hidden');
    $('stage').style.display = '';
    window.__startLive();
  }

  function init() {
    $('btnStart').onclick = start;
    $('btnFullscreen').onclick = toggleFs;
    // boutons discrets du live (plein écran + retour réglages) : se cachent quand la souris est immobile
    const ft = $('fsToggle'), ht = $('homeToggle');
    if (ft) ft.onclick = toggleFs;
    if (ht) ht.onclick = () => { if (isFs()) exitFs(); show(); };   // revient au menu de réglages
    const btns = [ft, ht].filter(Boolean);
    if (btns.length) {
      let idle;
      const poke = () => { btns.forEach(b => b.classList.remove('fs-hidden')); clearTimeout(idle); idle = setTimeout(() => btns.forEach(b => b.classList.add('fs-hidden')), 2500); };
      window.addEventListener('mousemove', poke); poke();
    }
    document.addEventListener('fullscreenchange', updateFsLabels);
    document.addEventListener('webkitfullscreenchange', updateFsLabels);
    updateFsLabels();
    $('btnResetStats').onclick = () => {
      const sk = CONFIG.MODE === 'countries' ? 'br_stats_v1' : 'br_stats_' + CONFIG.MODE;
      const rk = CONFIG.MODE === 'countries' ? 'br_reigning_v1' : 'br_reigning_' + CONFIG.MODE;
      try { localStorage.removeItem(sk); localStorage.removeItem(rk); } catch (e) {}
      toast('Classement de ce mode remis à zéro ✅');
    };
    $('btnDefaults').onclick = () => { for (const k of KEYS) CONFIG[k] = DEFAULTS[k]; build(); toast('Valeurs par défaut restaurées'); };
  }

  return { load, save, build, show, start, init, KEYS };
})();
