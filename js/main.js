/* =======================================================================
   MAIN — routage page d'accueil / live, thème, démarrage.
   • Sans paramètre d'URL  → page d'accueil (réglages + Démarrer)
   • ?go=1                 → lance directement le live (à mettre dans OBS)
   • ?menu=1               → force la page d'accueil
   ======================================================================= */
(function () {
  function fitStage() {
    const s = Math.min(window.innerWidth / 1080, window.innerHeight / 1920);
    const st = document.getElementById('stage');
    if (st) st.style.transform = `translate(-50%, -50%) scale(${s})`;
  }
  window.addEventListener('resize', fitStage);

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
    Home.init();
    applyTheme();
    const q = new URLSearchParams(location.search);
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
