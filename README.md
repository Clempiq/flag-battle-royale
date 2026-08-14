# 🏁 Flag Battle Royale — Live (TikTok / YouTube)

Tournoi automatique de drapeaux en « battle royale circulaire », vertical (9:16),
pour un live 24/7 capturé dans OBS / TikTok LIVE Studio. 100 % côté client, aucun
backend. **Tu règles tout depuis une page d'accueil, tu cliques Démarrer, ça tourne.**

---

## 1) Régler & lancer — la PAGE D'ACCUEIL

Ouvre le site (ou `index.html`). Tu arrives sur une **page de réglages** :
vitesse des boules, drapeaux par manche, durées, couleurs, ce qui s'affiche,
sons… Tu ajustes, puis tu cliques sur **▶ DÉMARRER**. C'est tout — plus besoin
d'éditer des fichiers ni de redéployer à chaque changement.

- Tes réglages sont **sauvegardés dans le navigateur** (ils reviennent au prochain lancement).
- **↩ Valeurs par défaut** : remet tous les réglages d'origine.
- **🗑 Réinitialiser le classement** : remet à zéro les titres des champions.

### Pour OBS / un live 24/7 : `?go=1`
Mets dans OBS l'URL suivie de **`?go=1`** :
`https://…vercel.app/?go=1` → ça saute le menu et lance le live directement
(pratique si la source se recharge). Pour revenir au menu : enlève `?go=1`
(ou ajoute `?menu=1`).

> La liste des pays reste éditable dans **`js/countries.js`**. Et si tu préfères
> figer des réglages par défaut « en dur », ils sont dans **`js/config.js`**
> (tout commenté) — mais au quotidien la page d'accueil suffit.

---

## 2) Ce qu'il y a à l'écran (volontairement épuré)

- Le **cercle** avec les drapeaux + la **zone de sortie** (rouge) qui élimine.
- Le **round** en cours (QUALIFYING → ROUND 2 → SEMI-FINAL → FINAL).
- Un **chrono**, un compteur « in the ring », une **barre de progression**.
- Le **tenant du titre** (dernier champion), affiché discrètement en haut.
- À gauche, le **classement des CHAMPIONS** (titres gagnés), qui **défile** et
  **reste en mémoire** entre les tournois et les rechargements — parfait pour que
  les gens qui arrivent en cours de live voient un suivi.
- De **petits sons** (élimination / vainqueur / champion), débloqués dès le clic
  sur Démarrer.

La moitié basse de l'écran est laissée **vide exprès** : c'est là que TikTok pose
les commentaires, cadeaux et boutons. On ne met rien d'important en bas.

Les **pays sont mélangés à chaque championnat** (réglable), pour ne pas revoir
toujours les mêmes affrontements.

---

## 3) Mettre en ligne sur Vercel

**Glisser-déposer** : https://vercel.com → *Add New… → Project* → glisse le dossier
`flag-battle-royale`. Site statique, aucun build. Tu obtiens une URL.

**GitHub → Vercel** (pour mettre à jour facilement) :
```bash
cd flag-battle-royale
git init && git add -A && git commit -m "Flag Battle Royale"
git remote add origin https://github.com/<toi>/flag-battle-royale.git
git push -u origin main
```
Puis sur Vercel : *Add New… → Project → Import*. Chaque `git push` redéploie.

> Tu peux aussi juste **double-cliquer `index.html`** : ça marche en local
> (réglages et classement mémorisés sur ton PC).

---

## 4) Passer en LIVE sur TikTok

**Côté TikTok (à vérifier dans l'app, ça évolue) :** en général **1 000 abonnés**
et **18 ans** pour débloquer TikTok LIVE.

**Depuis un PC — le plus simple : TikTok LIVE Studio**
1. Installe **TikTok LIVE Studio**, connecte-toi.
2. Ajoute une source **Navigateur** → colle ton URL Vercel **+ `?go=1`**, en **1080×1920**.
   (Si « Navigateur » n'existe pas, ouvre la page en plein écran dans Chrome et
   ajoute une source **Fenêtre / Écran**.)
3. Titre, catégorie **Gaming**, puis **Go LIVE**.

**OBS Studio + clé de stream TikTok**
1. OBS : *Sources → + → Navigateur*, URL `…/?go=1`, **1080×1920**.
2. Colle l'URL de serveur + la clé de stream TikTok (*Paramètres → Stream*).
3. Décoche « Éteindre la source quand non visible » (live 24/7). **Démarrer le streaming**.

> Depuis un téléphone seul, on ne peut pas diffuser une page web : il faut un PC.

---

## 5) Structure

```
flag-battle-royale/
├── index.html
├── vercel.json
├── css/styles.css
└── js/
    ├── config.js       ← valeurs par défaut « en dur » (optionnel)
    ├── countries.js    ← liste des pays
    ├── home.js         ← page d'accueil (réglages + Démarrer)
    ├── engine.js       ← physique + tournoi + rendu + stats persistantes
    ├── leaderboard.js  ← classement des champions
    ├── sfx.js          ← petits sons
    └── main.js         ← thème + routage accueil/live
```

Drapeaux via [flagcdn.com](https://flagcdn.com) → connexion internet nécessaire côté OBS.

---

## 6) Conseils pour le live (et pour les cadeaux 🎁)

- **Enjeu clair en une phrase** dès l'arrivée : « le dernier drapeau dans le cercle
  gagne le titre » — un nouveau spectateur doit comprendre en 3 secondes.
- **Fais participer** : « commente ton pays 🇫🇷 », « tape 🔥 si ton pays est encore là ».
  Les commentaires boostent la portée TikTok.
- **Donne du pouvoir aux cadeaux** : annonce (à l'oral / en overlay TikTok) que tel
  cadeau « repêche » un pays éliminé, relance une manche, ou fait gagner un pays au
  hasard. Les gens paient pour **influencer le résultat**, pas juste pour décorer.
- **Petits paliers** : « 5 roses = un nouveau tournoi maintenant », « 1 cadeau = je
  boost la vitesse ». Objectifs bas et fréquents > un gros objectif lointain.
- **Rends chaque pays « supportable »** : les gens défendent leur drapeau. Cite les
  pays des top-gifters à voix haute, félicite les champions du classement.
- **Rythme** : garde des manches courtes (10–30 s). Un finish serré = pic de cadeaux.
- **Régularité** : lance aux mêmes heures, laisse tourner longtemps (le classement
  persistant récompense les habitués).
