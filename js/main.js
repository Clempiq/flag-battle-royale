/* =======================================================================
   MAIN — routage page d'accueil / live, thème, démarrage.
   • Sans paramètre d'URL  → page d'accueil (réglages + Démarrer)
   • ?go=1                 → lance directement le live (à mettre dans OBS)
   • ?menu=1               → force la page d'accueil
   -----------------------------------------------------------------------
   RÉGLAGES PAR L'URL — indispensable quand on n'a pas accès à la page
   d'accueil (serveur 24/7, source « lien » de TikTok LIVE Studio…) :
   • ?go=1&mode=clubs                       → change le contenu du jeu
     (mode = countries | clubs | brands | capitals)
   • ?go=1&set=BASE_SPEED:340,SUDDEN_DEATH_AT:8
     → force n'importe quel réglage de config.js, séparés par des virgules.
   Ces valeurs ne sont PAS enregistrées : elles ne valent que pour cette URL,
   donc deux liens différents = deux parties différentes, en simultané.
   ======================================================================= */
(function () {
  /* ---------- réglages passés dans l'URL ---------- */
  function applyUrlOverrides(q) {
    const done = [];
    const one = (key, raw) => {
      const k = String(key).trim().toUpperCase();
      if (!(k in CONFIG)) { console.warn('[URL] réglage inconnu :', k); return; }
      const s = String(raw).trim();
      let v = s;
      if (s === 'true') v = true;
      else if (s === 'false') v = false;
      else if (s !== '' && !isNaN(Number(s))) v = Number(s);
      CONFIG[k] = v; done.push(k + '=' + v);
    };
    const m = q.get('mode');
    if (m) {
      const ok = (window.MODES || []).some(x => x.id === m);
      if (ok) one('MODE', m); else console.warn('[URL] mode inconnu :', m);
    }
    const set = q.get('set');
    if (set) for (const pair of set.split(',')) {
      const i = pair.indexOf(':');
      if (i > 0) one(pair.slice(0, i), pair.slice(i + 1));
    }
    if (done.length) console.log('[URL] réglages forcés →', done.join('  '));
    return done;
  }

  /* ---------- choix de la mise en page ----------
     'tall'    = 1080×1920 (OBS, VPS, YouTube : le format d'origine)
     'compact' = 1080×816  (source « lien » de TikTok LIVE Studio, bridée par
                 la hauteur de l'écran → on remplit exactement ce qu'on a)
     Par défaut : automatique selon la forme réelle de la fenêtre.
     Forçable avec ?layout=compact ou ?layout=tall                        */
  let LAYOUT = 'auto';
  function stageSize() {
    const st = document.getElementById('stage');
    let compact;
    if (LAYOUT === 'compact') compact = true;
    else if (LAYOUT === 'tall') compact = false;
    else compact = (window.innerWidth / window.innerHeight) > 0.72;  // fenêtre pas assez haute
    if (st) st.classList.toggle('compact', compact);
    return compact ? [1080, 816] : [1080, 1920];
  }
  function fitStage() {
    const [W, H] = stageSize();
    const s = Math.min(window.innerWidth / W, window.innerHeight / H);
    const st = document.getElementById('stage');
    if (st) st.style.transform = `translate(-50%, -50%) scale(${s})`;
  }
  window.__setLayout = (v) => { LAYOUT = v; fitStage(); };
  window.addEventListener('resize', fitStage);
  // Certains hôtes (source « lien » de TikTok LIVE Studio, navigateurs intégrés…)
  // redimensionnent la surface SANS déclencher l'événement resize : on surveille
  // donc aussi la taille réelle, sinon la page reste calée sur l'ancien format.
  if (window.ResizeObserver) {
    try { new ResizeObserver(fitStage).observe(document.documentElement); } catch (e) {}
  }
  [200, 800, 2000, 5000].forEach(ms => setTimeout(fitStage, ms));

  function applyTheme() {
    const r = document.documentElement.style;
    r.setProperty('--bg-1', CONFIG.BG_TOP);
    r.setProperty('--bg-0', CONFIG.BG_BOTTOM);
    r.setProperty('--ring', CONFIG.RING_COLOR);
    r.setProperty('--gap', CONFIG.GAP_COLOR);
    r.setProperty('--cyan', CONFIG.ACCENT_1);
    r.setProperty('--accent', CONFIG.ACCENT_2);
    r.setProperty('--sd', CONFIG.SUDDEN_DEATH_COLOR || '#ff9d00');
    // mode express : grand cercle, pas de colonne "qualifiés", pas de liste de noms
    const stage = document.getElementById('stage');
    if (stage) stage.classList.toggle('express', !!CONFIG.ALL_IN_ONE);
    const show = (id, on) => { const e = document.getElementById(id); if (e) e.style.display = on ? '' : 'none'; };
    show('roundLabel', CONFIG.SHOW_ROUND_LABEL);
    show('timerPill', CONFIG.SHOW_TIMER);
    show('aliveTag', CONFIG.SHOW_ALIVE);
    show('progressWrap', CONFIG.SHOW_PROGRESS);
    show('heatRoster', CONFIG.SHOW_ROSTER);
  }

  let booted = false;
  function startLive() {
    applyTheme();
    fitStage();
    Leaderboard.init();
    if (!booted) { Engine.boot(); booted = true; } else { Engine.restart(); }
  }
  window.__startLive = startLive;

  function route() {
    Home.load();       // applique la config sauvegardée par-dessus les défauts
    const q = new URLSearchParams(location.search);
    applyUrlOverrides(q);   // …puis l'URL a le dernier mot
    const lay = (q.get('layout') || '').toLowerCase();
    if (lay === 'compact' || lay === 'tall' || lay === 'auto') LAYOUT = lay;
    Home.init();
    applyTheme();
    if (q.get('go') === '1' && q.get('menu') !== '1') {
      document.getElementById('home').classList.add('hidden');
      document.getElementById('stage').style.display = '';
      startLive();
    } else {
      Home.show();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', route);
  else route();
})();
