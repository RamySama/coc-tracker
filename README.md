# CoC Upgrade Tracker

Web app (PWA installable, desktop + mobile) pour suivre les améliorations de bâtiments
Clash of Clans : niveaux actuels, coûts / temps / ressources restants, et projection de ce
que débloque le prochain Hôtel de Ville / la prochaine Maison de l'Ouvrier.

## Stack

Vite + React + TypeScript · Tailwind CSS · Firebase (Auth + Firestore) · vite-plugin-pwa ·
react-i18next (FR / EN) · Vitest.

## Démarrage

```bash
npm install
npm run dev
```

Sans config Firebase, l'app tourne en **mode local** (données dans le navigateur, pas de
synchronisation). Pour activer la sync :

1. Créer un projet sur [console.firebase.google.com](https://console.firebase.google.com).
2. Activer **Authentication** → Google + Anonyme, et **Firestore Database** (mode production).
3. Copier `.env.example` en `.env.local` et remplir les 6 variables (Paramètres du projet →
   Vos applications → Web).
4. Déployer les règles : `firebase deploy --only firestore:rules` (après avoir renseigné
   `.firebaserc`).

## Données du jeu

Le dataset provient du package npm [`clash-of-clans-data`](https://www.npmjs.com/package/clash-of-clans-data)
(MIT). `scripts/build-game-data.mjs` en extrait une version « slim » dans `src/data/game/`
(bâtiments village principal + base des ouvriers, héros, murs, pièges) et copie ~120 icônes
dans `public/coc/`.

```bash
npm run build-data      # régénère depuis la version installée
npm run update-data     # met à jour le package puis régénère
```

`src/data/game/*.json` est commité ; `public/coc/` est régénéré au build (`prebuild`).
`src/data/game/names.fr.json` contient les noms français des bâtiments (complétable).

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de dev |
| `npm run build` | build de prod (`dist/`) |
| `npm run preview` | sert le build |
| `npm test` | tests du moteur de calcul (Vitest) |
| `npm run build-data` / `update-data` | (re)génère le dataset |

## Architecture

- `src/lib/engine/` — moteur pur (catalogue, marches d'amélioration, totaux, planificateur HDV),
  sans dépendance React/Firebase, testé.
- `src/lib/repo/` — persistance : `localRepo` (localStorage) ou `firestoreRepo`.
- `src/store/` — Zustand (session, villages).
- `src/pages/` — Accueil, Bâtiments, Améliorations, Planif HDV, Réglages.

## Déploiement

```bash
npm run build
firebase deploy --only hosting
```

## Avertissement

Contenu de fan non officiel. Non affilié à Supercell. Les visuels et les données du jeu
appartiennent à Supercell. Voir la [Supercell Fan Content Policy](https://supercell.com/en/fan-content-policy/).

## TODO v1+

- Vrais PNG d'icône PWA (192 / 512 / maskable) — actuellement `favicon.svg`.
- Code-split Firebase + lazy-load du dataset base des ouvriers (bundle ~300 KB gzip).
- Compléter `names.fr.json`.
- Capitale de Clan.
- Améliorations de laboratoire (troupes / sorts).
- Partage de village en lecture seule.
