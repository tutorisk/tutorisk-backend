# TutoRisk — Frontend

Application React (Vite) qui consomme l'API du backend TutoRisk.

## Installation et démarrage

```bash
cd tutorisk-frontend
npm install
npm run dev
```

L'application s'ouvre sur **http://localhost:5173**.

## Pré-requis pour que la connexion fonctionne

Le frontend appelle un backend à l'adresse `http://localhost:4000` par défaut
(voir la constante `API_BASE` en haut de `src/App.jsx`). Pour que le formulaire
de connexion fonctionne réellement, il faut **en parallèle** :

1. Le backend `tutorisk-backend` démarré (`npm run dev` dans son propre dossier),
   avec une base PostgreSQL migrée (`npm run migrate`) et alimentée (`npm run seed`).
2. Dans le fichier `.env` du backend, `FRONTEND_URL=http://localhost:5173`
   (sinon le navigateur sera bloqué par la protection CORS).
3. Les deux serveurs lancés en même temps, dans deux terminaux séparés.

Une fois les deux démarrés, ouvrez http://localhost:5173, cliquez sur
« Connexion » et utilisez par exemple :
- Email : `s.martin@tutorisk.com`
- Mot de passe : `Demo1234!`

## Si la connexion échoue encore

Ouvrez les outils de développement du navigateur (F12 → onglet Réseau ou
Console) au moment de cliquer sur « Se connecter ». Le message d'erreur exact
(ex: `Failed to fetch`, `CORS`, `401`, `ECONNREFUSED`) indique précisément où
se situe le problème : adresse du backend incorrecte, serveur non démarré,
base de données non accessible, ou identifiants réellement incorrects.
