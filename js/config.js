/* =======================================================================
   ⚙️  CONFIG — Édite TOUT ici avant de lancer, puis ça tourne tout seul.
   -----------------------------------------------------------------------
   • La liste des pays est dans js/countries.js
   • Pour remettre le classement des champions à zéro : ajoute ?reset=1
     à l'URL une fois (ex. https://…vercel.app/?reset=1), recharge, puis
     enlève-le.
   ======================================================================= */

const CONFIG = {

  /* ======================================================================
     1) LE PLUS ÉDITÉ
     ====================================================================== */
  GROUP_SIZE:        20,    // éléments par manche. 20 = championnat court (2 rounds) et cercle bien rempli.
  HEAT_DURATION_SEC: 45,    // durée max d'une manche ; sinon le + proche du centre gagne
  BASE_SPEED:        290,   // ← VITESSE DES BOULES (px/s). Monte pour + de rythme.
  MODE:              'countries', // contenu du jeu : 'countries' | 'clubs' | 'brands' | 'capitals' (voir js/modes.js)
  START_SHUFFLE:     true,  // true = éléments MÉLANGÉS à chaque championnat (recommandé, + de variété)
  POOL_LIMIT:        0,     // 0 = tout le pool ; ex. 32 = seulement les 32 premiers

  /* ======================================================================
     2) COULEURS  (défaut = palette TikTok : noir / cyan / rouge)
     ----------------------------------------------------------------------
     Autres palettes prêtes à l'emploi — remplace le bloc ci-dessous :

     // — OR & NÉON —
     // BG_TOP:'#0a0d1a', BG_BOTTOM:'#05060c', RING_COLOR:'#cdd6f0',
     // GAP_COLOR:'#ffcf33', ACCENT_1:'#24e0ff', ACCENT_2:'#ff36e6',

     // — VIOLET / ROSE —
     // BG_TOP:'#120a24', BG_BOTTOM:'#07040f', RING_COLOR:'#e9dcff',
     // GAP_COLOR:'#ff4d9d', ACCENT_1:'#a06bff', ACCENT_2:'#ff4d9d',
     ====================================================================== */
  BG_TOP:     '#0b0b10',   // fond (haut)
  BG_BOTTOM:  '#000000',   // fond (bas)
  RING_COLOR: '#ffffff',   // l'anneau
  GAP_COLOR:  '#FE2C55',   // ZONE DE SORTIE / élimination (rouge TikTok)
  ACCENT_1:   '#25F4EE',   // accent cyan TikTok (titres, timer, progression)
  ACCENT_2:   '#FE2C55',   // accent rouge TikTok

  /* ======================================================================
     3) MOUVEMENT / PHYSIQUE
     ----------------------------------------------------------------------
     Rebonds purs : pas de gravité, pas d'attraction vers les bords. Les
     boules vont en ligne droite et rebondissent sur l'anneau (sauf dans la
     zone de sortie où elles s'échappent).
     ====================================================================== */
  SPEED_JITTER:  45,   // variation de vitesse entre les boules (au départ)
  BOUNCE_RANDOM: 14,   // hasard sur l'angle de rebond (degrés) → "rebonds aléatoires"
  END_ACCEL:     0.9,  // regain de vitesse en fin de manche pour garantir un vainqueur (0 = vitesse constante)
  WANDER:        0,    // courbe des trajectoires (0 = lignes droites ; monte pour des courbes)
  FLAG_RADIUS:   26,   // taille des drapeaux (px). Avec 20 par manche, 24–28 est le bon compromis.
  COLLISIONS:    true, // ⭐ les boules s'entrechoquent entre elles (beaucoup plus d'aléatoire)
  TRAILS:        true, // traînées derrière les drapeaux
  TRAIL_LENGTH:  10,

  /* ======================================================================
     4) LA ZONE DE SORTIE  (l'ouverture qui élimine)
     ====================================================================== */
  GAP_ARC_DEG:      40,   // largeur de départ de l'ouverture (degrés)
  GAP_GROWTH:       1.8,  // l'ouverture s'élargit au fil de la manche (×2.8 à la fin) → finish garanti
  GAP_ROTATE_DEG_S: 60,   // vitesse de rotation de l'ouverture (deg/s ; négatif = sens inverse)

  /* ======================================================================
     4bis) SUDDEN DEATH — quand il reste peu de survivants, ça s'emballe
     ====================================================================== */
  SUDDEN_DEATH_AT:    4,    // déclenche quand il reste ce nombre de boules (0 = désactivé)
  SUDDEN_DEATH_SPEED: 1.35, // multiplicateur de vitesse pendant le sudden death
  SUDDEN_DEATH_GAP:   1.5,  // élargissement de l'ouverture pendant le sudden death
  SUDDEN_DEATH_COLOR: '#ff9d00', // couleur de l'anneau en sudden death (≠ rouge de la sortie, pour rester lisible)

  /* ======================================================================
     5) DURÉES DES ANNONCES
     ====================================================================== */
  WINNER_BANNER_SEC:   1.8,  // pause "vainqueur de la manche" (court = plus dynamique)
  CHAMPION_BANNER_SEC: 3.5,  // pause "champion" avant de tout relancer (court = ça repart vite)

  /* ======================================================================
     6) CLASSEMENT DES CHAMPIONS (colonne de gauche, défile, persistant)
     ====================================================================== */
  SHOW_LEADERBOARD:      true,   // colonne de GAUCHE : classement des champions (persistant)
  LEADERBOARD_TITLE:     '🏆 CHAMPIONS',
  SHOW_QUALIFIED:        true,   // colonne de DROITE : qualifiés du round en cours
  QUALIFIED_TITLE:       '✅ QUALIFIED',
  SHOW_ROSTER:           true,   // sous le cercle : les 6 pays de la manche (barrés quand éliminés)
  LEADERBOARD_SCROLL:    18,     // vitesse de défilement (px/s) si une liste dépasse
  PERSIST_STATS:         true,   // garde le classement même après un rechargement (24/7)

  /* ======================================================================
     7) AFFICHAGE À L'ÉCRAN (le reste — chat, cœurs… — c'est TikTok qui l'ajoute)
     ====================================================================== */
  SHOW_ROUND_LABEL:  true,  // "QUALIFYING", "ROUND 2", "SEMI-FINAL", "FINAL"
  SHOW_TIMER:        true,  // petit compte à rebours de la manche
  SHOW_ALIVE:        true,  // "X IN THE RING"
  SHOW_PROGRESS:     true,  // barre "X / total FLAGS"
  SHOW_TITLE_HOLDER: true,  // annonce discrète du tenant du titre (dernier champion)
  CONFETTI:          true,  // confettis brefs quand un champion est couronné

  /* ---- Sons légers (débloqués par le clic "Démarrer") ---- */
  SFX:         true,  // petits effets sonores (élimination / vainqueur / champion)
  SFX_BOUNCE:  true,  // petit "toc" à chaque rebond sur l'anneau (nombreux → rares)
  SFX_VOLUME:  0.5,   // volume global des sons (0 = muet, 1 = fort)

  /* ======================================================================
     8) SOURCE DES DRAPEAUX
     ====================================================================== */
  FLAG_CDN: (code) => `https://flagcdn.com/w160/${code}.png`, // w320 = plus net, + lourd
};

window.CONFIG = CONFIG;
