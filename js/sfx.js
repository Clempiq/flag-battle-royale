/* =======================================================================
   SFX — petits sons synthétisés (aucun fichier audio requis).
   Volume réglé par CONFIG.SFX_VOLUME. Débloqué au premier clic
   (le bouton "Démarrer" suffit → les sons marchent dès le lancement).
   ======================================================================= */
window.SFX = (function () {
  let ctx = null;

  function ensure() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function unlock() { ensure(); }
  // OBS (source Navigateur) autorise l'autoplay → on débloque tout seul au chargement.
  // Dans un navigateur classique, l'AudioContext reste suspendu jusqu'au 1er clic (le
  // bouton Démarrer le réveille), donc aucun son n'est perdu.
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
  setTimeout(unlock, 0);
  setTimeout(unlock, 800);

  function tone(freq, dur, type, gain, slideTo) {
    if (!CONFIG.SFX) return;
    const ac = ensure(); if (!ac) return;
    const vol = (gain || 0.12) * (CONFIG.SFX_VOLUME != null ? CONFIG.SFX_VOLUME : 0.5);
    if (vol <= 0) return;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, ac.currentTime);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + dur);
    g.gain.setValueAtTime(0.0001, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(vol, ac.currentTime + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    o.connect(g).connect(ac.destination);
    o.start(); o.stop(ac.currentTime + dur + 0.02);
  }

  // légers et courts
  function bounce()   { tone(250 + Math.random() * 70, 0.055, 'triangle', 0.22); } // "poc" net, hauteur variée
  function elim()     { tone(300, 0.12, 'sine', 0.07, 150); }              // petit "plop" grave
  function winner()   { tone(660, 0.10, 'triangle', 0.10); setTimeout(() => tone(880, 0.14, 'triangle', 0.10), 90); }
  function champion() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.32, 'triangle', 0.12), i * 120)); }

  return { bounce, elim, winner, champion, unlock };
})();
