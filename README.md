# CoC Upgrade Tracker

App (web/PWA installable desktop + mobile, + app Windows native) pour suivre les améliorations
de bâtiments et de troupes Clash of Clans : niveaux actuels, coûts / temps / ressources
restants, projection de ce que débloque le prochain Hôtel de Ville, et planification.

**En ligne :** https://coc-tracker-478ae.web.app
**Dépôt :** https://github.com/RamySama/coc-tracker

## Stack

Vite + React + TypeScript · Tailwind CSS · Firebase (Auth + Firestore) · vite-plugin-pwa ·
react-i18next (FR / EN) · Zustand · motion · Vitest · Tauri (app Windows).

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
4. `.firebaserc` doit pointer sur ton `project_id`.
5. Déployer les règles : `firebase deploy --only firestore:rules`.

## Données du jeu

Le dataset provient du package npm [`clash-of-clans-data`](https://www.npmjs.com/package/clash-of-clans-data)
(MIT). `scripts/build-game-data.mjs` en extrait une version « slim » dans `src/data/game/`
(bâtiments + recherche village principal / base des ouvriers, avec l'image de chaque niveau)
et copie les icônes utilisées dans `public/coc/`.

```bash
npm run build-data      # régénère depuis la version installée
npm run update-data     # met à jour le package puis régénère
```

`src/data/game/*.json` est commité ; `public/coc/` est régénéré au build (`prebuild`/`predev`).
`src/data/game/names.fr.json` contient les noms français (complétable).

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de dev web |
| `npm run build` | build de prod web (`dist/`) |
| `npm run preview` | sert le build web |
| `npm test` | tests du moteur de calcul (Vitest) |
| `npm run build-data` / `update-data` | (re)génère le dataset |
| `npm run tauri:dev` | app Windows en mode dev (fenêtre native + hot-reload) |
| `npm run tauri:build` | installeur Windows (`.msi` / `.exe`) |

## Architecture

- `src/lib/engine/` — moteur pur (catalogue, marches d'amélioration, totaux, planificateur HDV,
  regroupement, recherche, préréglages), sans dépendance React/Firebase, testé.
- `src/lib/repo/` — persistance : `localRepo` (localStorage) ou `firestoreRepo`.
- `src/store/` — Zustand (session, villages, toasts, ui).
- `src/pages/` — Accueil, Village (Bâtiments/Recherche), Améliorations, Planif HDV, Réglages.
- `src-tauri/` — enveloppe app Windows native (voir ci-dessous).

## Déploiement web (Firebase Hosting)

```bash
npm run build
firebase deploy --only hosting
```

## App Windows (Tauri)

`src-tauri/` embarque le build web (`dist/`) dans une fenêtre native (WebView2), sans barre
d'adresse. La config Firebase utilisée est celle de `.env.local` au moment du build (Vite
l'inline) : configure Firebase **avant** de builder l'app Windows si tu veux la synchro.

Prérequis (une fois) : [Rust](https://rustup.rs/) — les outils de compilation C++ (MSVC) et
WebView2 sont généralement déjà présents sur un poste Windows à jour.

```bash
npm run tauri:build
```

Génère un installeur dans `src-tauri/target/release/bundle/{msi,nsis}/`. L'icône source est
`src-tauri/icons/app-icon-solid.png` (générée par `scripts/make-app-icon.py`) ; relancer
`npx tauri icon src-tauri/icons/app-icon-solid.png` après l'avoir modifiée pour régénérer
toutes les tailles.

## Avertissement

Contenu de fan non officiel. Non affilié à Supercell. Les visuels et les données du jeu
appartiennent à Supercell. Voir la [Supercell Fan Content Policy](https://supercell.com/en/fan-content-policy/).

## TODO v1+

- Icônes PWA dédiées (192 / 512 / maskable) — actuellement `favicon.svg`.
- Code-split Firebase + lazy-load du dataset base des ouvriers.
- Compléter `names.fr.json`.
- Capitale de Clan.
- Partage de village en lecture seule.
- Signature du build Windows (actuellement non signé — SmartScreen peut avertir à l'installation).
