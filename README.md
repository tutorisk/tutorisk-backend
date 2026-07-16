# TutoRisk — Backend

Backend Node.js / Express / PostgreSQL pour la plateforme TutoRisk LCMS :
authentification réelle (JWT + cookies httpOnly), base de données relationnelle,
paiements Stripe, et streaming vidéo protégé par URL signée (sans DRM).

## 1. Installation

```bash
cd tutorisk-backend
npm install
cp .env.example .env
```

Éditez `.env` et renseignez au minimum :
- `DATABASE_URL` — votre instance PostgreSQL (locale, Render, Supabase, RDS...)
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` / `VIDEO_SIGNING_SECRET` — générez des
  chaînes aléatoires longues, par exemple avec `openssl rand -hex 64`
- `STRIPE_SECRET_KEY` — votre clé secrète Stripe (test ou production)
- `STRIPE_WEBHOOK_SECRET` — voir section 4
- `FRONTEND_URL` — l'URL de votre frontend React (ex: `http://localhost:5173`)

## 2. Base de données

```bash
npm run migrate   # crée les tables
npm run seed       # insère les 15 modules de démonstration + 5 comptes de test
```

Comptes créés par le seed (mot de passe identique : `Demo1234!`) :

| Email                          | Rôle       |
|---------------------------------|------------|
| s.martin@tutorisk.com           | admin      |
| m.dubois@tutorisk.com           | pedagogue  |
| c.leroy@tutorisk.com            | formateur  |
| b.dupont@acmegroup.fr           | charge     |
| j.bernard@acmegroup.fr          | apprenant  |

## 3. Démarrage

```bash
npm run dev    # avec rechargement automatique (nodemon)
# ou
npm start
```

Le serveur écoute par défaut sur `http://localhost:4000`. Vérifiez avec :
```bash
curl http://localhost:4000/health
```

## 4. Stripe — configuration du webhook

En local, utilisez le [Stripe CLI](https://docs.stripe.com/stripe-cli) :

```bash
stripe listen --forward-to localhost:4000/api/stripe/webhook
```

Cette commande affiche un secret `whsec_...` à copier dans `STRIPE_WEBHOOK_SECRET`.

En production, créez un endpoint webhook depuis le Dashboard Stripe pointant vers
`https://votre-domaine.com/api/stripe/webhook`, écoutant au minimum l'événement
`checkout.session.completed`.

Pour tester un paiement complet sans vraie carte, utilisez la carte de test Stripe
`4242 4242 4242 4242`, n'importe quelle date future et n'importe quel CVC.

## 5. Vidéos protégées (sans DRM)

Les fichiers vidéo ne sont jamais servis directement : ils doivent être placés dans
le dossier défini par `PROTECTED_MEDIA_DIR` (non exposé par un serveur de fichiers
statique), avec un chemin relatif correspondant à la colonne `file_path` de la table
`contents` (ex: `videos/m1-c1.mp4` → `${PROTECTED_MEDIA_DIR}/videos/m1-c1.mp4`).

Flux de lecture :
1. Le frontend appelle `POST /api/videos/:contentId/url` (authentifié) → reçoit une
   URL du type `/stream/:contentId?token=...`, valable 10 minutes.
2. Le frontend place cette URL dans la balise `<video src="...">`.
3. `GET /stream/:contentId` vérifie le jeton et diffuse le fichier avec support des
   requêtes `Range` (nécessaire pour le défilement dans la vidéo).

Cette protection bloque le partage de lien et l'accès direct au fichier, mais ne
chiffre pas le flux lui-même. Pour un vrai DRM (Widevine/FairPlay/PlayReady), il
faudra intégrer un fournisseur tiers (Axinom, Pallycon, BuyDRM...) — voir la
discussion dans la conversation pour le détail des implications.

## 6. Intégration avec le frontend React existant

Le frontend doit désormais :
- Stocker l'`accessToken` en mémoire (pas en `localStorage`, pour limiter les risques XSS)
  et l'envoyer dans le header `Authorization: Bearer <token>` sur chaque requête API.
- Appeler `POST /api/auth/refresh` (avec `credentials: 'include'`) au chargement de
  l'application pour restaurer la session via le cookie httpOnly.
- Remplacer les données `MODULES`/`USERS` simulées par des appels à `GET /api/modules`,
  `GET /api/modules/:id`, etc.
- Pour la lecture vidéo : appeler `POST /api/videos/:contentId/url` puis utiliser
  l'URL renvoyée dans le lecteur `<video>`.
- Pour l'achat d'un module : appeler `POST /api/checkout/create-session`, puis
  rediriger le navigateur vers l'`url` Stripe renvoyée (`window.location.href = url`).

Toutes les requêtes vers l'API doivent inclure `credentials: 'include'` pour que le
cookie de rafraîchissement soit transmis.

## 7. Endpoints disponibles (résumé)

| Méthode | Route                                  | Auth           | Description |
|--------|------------------------------------------|----------------|--------------|
| POST   | /api/auth/register                       | public         | Inscription (apprenant par défaut) |
| POST   | /api/auth/login                          | public         | Connexion |
| POST   | /api/auth/refresh                        | cookie         | Renouvelle l'access token |
| POST   | /api/auth/logout                         | cookie         | Déconnexion |
| GET    | /api/auth/me                             | Bearer         | Profil courant |
| GET    | /api/modules                             | optionnel      | Liste des modules |
| GET    | /api/modules/:id                         | optionnel      | Détail d'un module |
| POST   | /api/modules                             | admin/pedagogue| Créer un module |
| PUT    | /api/modules/:id                         | admin/pedagogue| Modifier un module |
| DELETE | /api/modules/:id                         | admin          | Supprimer un module |
| POST   | /api/modules/qcm/:questionId/check       | Bearer         | Vérifier une réponse QCM |
| GET    | /api/enrollments/me                      | Bearer         | Mes inscriptions |
| POST   | /api/enrollments                         | admin/charge   | Affecter un module à un apprenant |
| POST   | /api/progress                            | Bearer         | Mettre à jour la progression |
| GET    | /api/progress/module/:moduleId           | Bearer         | Progression sur un module |
| POST   | /api/checkout/create-session             | Bearer         | Créer une session Stripe |
| POST   | /api/stripe/webhook                      | signature Stripe | Webhook de confirmation de paiement |
| POST   | /api/videos/:contentId/url               | Bearer         | URL de lecture signée |
| GET    | /stream/:contentId?token=...             | jeton signé    | Flux vidéo protégé |
| GET    | /api/admin/users                         | admin          | Liste des utilisateurs |
| GET    | /api/credit-packs                        | optionnel      | Lots de crédits actifs (ajoutez `?all=true` en admin pour voir aussi les lots désactivés) |
| POST   | /api/credit-packs                        | admin          | Créer un lot de crédits |
| PUT    | /api/credit-packs/:id                    | admin          | Modifier un lot (crédits, prix, remise, actif) |
| DELETE | /api/credit-packs/:id                    | admin          | Supprimer un lot |
| POST   | /api/credits/purchase                    | charge/admin   | Acheter un lot — `{packId, paymentMethod:"card"\|"transfer"}` |
| GET    | /api/credits/me                          | charge/admin   | Historique de mes achats de crédits |
| GET    | /api/admin/pending-transfers              | admin          | Liste des virements (modules + crédits) en attente de validation |
| POST   | /api/admin/pending-transfers/:type/:id/validate | admin   | Valide un virement reçu (`type` = `module` ou `credit`) — crédite le forfait ou crée l'inscription |
| POST   | /api/admin/pending-transfers/:type/:id/reject   | admin   | Rejette une commande par virement non reçue |

## 9. Achat de crédits et paiement par virement

Les chargés de formation peuvent recharger leur forfait de crédits par lots :
100 crédits (5% de remise), 1 000 crédits (10%) ou 10 000 crédits (20%) par
défaut. Ces trois lots sont créés automatiquement par `npm run seed`, et sont
ensuite entièrement configurables (nom, quantité, prix, remise, activation)
depuis l'onglet **Lots de crédits** de l'espace administrateur du frontend,
ou directement via l'API (`/api/credit-packs`).

Pour l'achat d'un module comme pour l'achat d'un lot de crédits, l'utilisateur
choisit entre deux modes de paiement :
- **Carte bancaire** : passe par Stripe Checkout, comme déjà décrit en
  section 4 — le crédit ou l'inscription est appliqué automatiquement dès
  réception du webhook `checkout.session.completed`.
- **Virement bancaire** : la commande est enregistrée avec le statut
  `pending` et une référence unique générée automatiquement. Les coordonnées
  bancaires affichées à l'utilisateur proviennent des variables d'environnement
  `BANK_ACCOUNT_HOLDER`, `BANK_IBAN`, `BANK_BIC`, `BANK_NAME` — pensez à les
  renseigner avec vos vraies coordonnées avant la mise en production. Une fois
  le virement reçu sur votre compte, l'administrateur se rend dans l'onglet
  **Paiements à valider** du frontend (ou appelle directement l'API), retrouve
  la commande grâce à la référence indiquée par le client, et clique sur
  **Valider** : cela crédite automatiquement le forfait de l'utilisateur (pour
  un lot de crédits) ou crée son inscription au module (pour un achat de
  formation).


## 8. Mise en ligne sur Render (hébergement tout-en-un)

Render héberge en un seul endroit la base PostgreSQL, le backend Node.js et le
frontend (site statique), avec HTTPS automatique. Ce dépôt inclut un fichier
`render.yaml` qui automatise la création de la base et du service backend.

### 8.1 Préparer le code
Le projet doit être dans un dépôt Git (GitHub ou GitLab) — Render déploie à
partir d'un repo, pas d'un simple zip. Créez un dépôt et poussez-y ce dossier
`tutorisk-backend`.

### 8.2 Créer les services sur Render
1. Sur [render.com](https://render.com), créez un compte puis cliquez sur
   **New > Blueprint**, et sélectionnez votre dépôt. Render détecte le fichier
   `render.yaml` et propose de créer automatiquement la base PostgreSQL
   (`tutorisk-db`) et le service web (`tutorisk-backend`).
2. Avant de valider, Render vous demande les variables marquées `sync: false`
   dans `render.yaml` : renseignez `STRIPE_SECRET_KEY` (votre clé secrète
   Stripe) et `FRONTEND_URL` (laissez une valeur temporaire, vous la
   corrigerez à l'étape 8.4 une fois l'URL du frontend connue).
3. Validez. Render provisionne la base, installe les dépendances, exécute
   `npm run migrate` automatiquement (création des tables), puis démarre le
   serveur. Au bout de quelques minutes, vous obtenez une URL du type
   `https://tutorisk-backend-xxxx.onrender.com`.
4. **Alimentez la base une seule fois** : dans le dashboard Render, ouvrez le
   service `tutorisk-backend` → onglet **Shell**, et lancez `npm run seed`.
   Ne relancez jamais cette commande ensuite (elle échouerait sur les emails
   déjà existants) ; elle ne sert qu'à la mise en place initiale.

### 8.3 Déployer le frontend (site statique)
1. Toujours sur Render : **New > Static Site**, sélectionnez le dépôt
   `tutorisk-frontend`.
2. Build command : `npm install && npm run build` — Publish directory : `dist`.
3. Une fois déployé, vous obtenez une URL du type
   `https://tutorisk-frontend-xxxx.onrender.com`.
4. Le frontend doit pointer vers l'URL réelle du backend. Éditez le fichier
   source `index.html` du dépôt (pas le contenu généré dans `dist`) en
   ajoutant, juste avant la balise `<script type="module" src="/src/main.jsx">`,
   une ligne définissant l'URL du backend :
   ```html
   <script>window.TUTORISK_API_BASE = "https://tutorisk-backend-xxxx.onrender.com";</script>
   ```
   (cette variable est déjà lue automatiquement par `App.jsx`, voir la
   constante `API_BASE`). Committez et poussez ce changement : Render
   reconstruit et redéploie automatiquement le site statique.

### 8.4 Relier les deux services
Retournez sur le service backend → **Environment**, et mettez à jour
`FRONTEND_URL` avec la vraie URL du site statique obtenue à l'étape 8.3
(ex: `https://tutorisk-frontend-xxxx.onrender.com`), sans slash final. Cette
valeur est utilisée à la fois pour la protection CORS et pour les URL de
redirection Stripe après paiement. Sauvegardez : Render redémarre le service
automatiquement.

### 8.5 Basculer le webhook Stripe en production
Dans le [dashboard Stripe](https://dashboard.stripe.com/webhooks), créez un
nouveau endpoint pointant vers :
```
https://tutorisk-backend-xxxx.onrender.com/api/stripe/webhook
```
écoutant l'événement `checkout.session.completed`. Stripe vous donne un
nouveau secret `whsec_...` : remplacez `STRIPE_WEBHOOK_SECRET` dans les
variables d'environnement du service Render avec cette valeur (celui utilisé
en local avec le Stripe CLI ne fonctionne pas en production).

### 8.6 Domaine personnalisé (optionnel)
Dans les paramètres de chaque service (frontend et backend), section
**Custom Domains**, ajoutez votre nom de domaine et suivez les instructions
DNS affichées (généralement un enregistrement CNAME). Render fournit le
certificat HTTPS automatiquement. Si vous changez de domaine pour le
frontend, mettez à jour `FRONTEND_URL` côté backend et l'URL du webhook
Stripe en conséquence.

### 8.7 Coût réaliste et points d'attention
- Plans payants Render (2026) : service web "Starter" ≈ 7 $/mois, PostgreSQL
  "Starter" ≈ 7 $/mois, site statique gratuit et illimité. Comptez donc environ
  **14 $/mois** pour un site réellement disponible en permanence.
- Le tier gratuit existe mais n'est pas adapté à un site en production : le
  service backend se met en veille après 15 minutes d'inactivité (premier
  visiteur bloqué 30 à 60 secondes), et la base PostgreSQL gratuite est
  supprimée après 30 à 90 jours selon le plan.
- Les vidéos protégées doivent être déposées dans le disque persistant monté
  sur `/var/data/media` (configuré dans `render.yaml`) — pas dans le dossier
  du code, qui est régénéré à chaque déploiement.
- Vérifiez que `NODE_ENV=production` est bien défini (c'est le cas par défaut
  via `render.yaml`) : cela active les cookies sécurisés `SameSite=None` et
  `Secure`, indispensables puisque frontend et backend sont sur des domaines
  différents.

## 10. TVA et conversion crédits ↔ euros

**Prix TTC et TVA par code postal.** Tous les prix affichés (catalogue,
détail d'un module, lots de crédits) sont calculés TTC à partir d'un prix HT
stocké en base et d'un taux de TVA résolu dynamiquement. La résolution suit
cette priorité : règle de code postal la plus spécifique (le préfixe le plus
long qui correspond) → taux par défaut du pays → 0% si rien n'est configuré.
Le seed installe par défaut : France hexagonale 20%, Guadeloupe (971) et
Martinique (972) 8,5%, Guyane (973) et Saint-Barthélemy (97133) 0%. Ces
valeurs sont entièrement modifiables depuis l'onglet **TVA** de l'espace
administrateur (ou via `/api/vat/countries` et `/api/vat/postal-rules`).

Au moment d'un achat (module ou lot de crédits), le code postal saisi par
l'acheteur est envoyé au backend qui recalcule le taux exact et le montant
TTC réellement facturé (carte Stripe ou virement) ; le code postal est aussi
mémorisé sur le profil utilisateur pour les achats suivants.

**Crédits = euros HT.** Pour un chargé de formation, inscrire un collaborateur
consomme un nombre de crédits égal au prix HT du module, arrondi au supérieur
(`Math.ceil(priceCentsHt / 100)`) — un module à 59 € HT coûte donc 59 crédits,
pas un crédit forfaitaire par inscription. Ce calcul est fait côté serveur
dans `enrollments.controller.js`, impossible à contourner depuis le frontend.

## 11. Personnalisation des attestations, accès mobile, programme ambassadeur

**Attestations personnalisables.** Depuis l'onglet **Attestations** de l'espace
administrateur, modifiez librement le titre, la phrase d'introduction, la
phrase descriptive, le pied de page, ainsi que le nom et la fonction du
signataire. Vous pouvez aussi déposer une image de tampon et une image de
signature (PNG, JPEG ou SVG — seuls PNG et JPEG s'intègrent réellement dans le
PDF généré, le SVG est conservé mais signalé comme non intégrable). Les
fichiers sont stockés sur disque, dans le dossier défini par
`CERTIFICATE_ASSETS_DIR` (par défaut `tutorisk-backend/certificate-assets`) —
pensez à inclure ce dossier dans vos sauvegardes ou, en production sur Render,
à le placer sur le disque persistant comme pour les vidéos (voir section 8.7).

**Accès mobile et tablette.** La barre de navigation, les espaces avec menu
latéral (administrateur, pédagogue) et la page de détail d'un module
s'adaptent automatiquement sous 768px de large (640px pour la barre de
navigation) : les menus latéraux deviennent une rangée d'onglets défilante
horizontalement, et les mises en page à deux colonnes s'empilent
verticalement. Aucune configuration nécessaire.

**Programme ambassadeur.** Chaque utilisateur dispose d'un code ambassadeur
unique généré automatiquement à la création de son compte (visible dans son
espace personnel, avec un bouton pour le copier). Un nouvel utilisateur peut
saisir le code d'un autre membre — soit directement à l'inscription, soit
plus tard depuis son espace — pour bénéficier d'une réduction permanente sur
tous ses achats (modules et lots de crédits). Cette réduction s'applique sur
le prix HT avant le calcul de la TVA, et reste acquise définitivement une fois
le code appliqué (un compte ne peut être parrainé qu'une seule fois). Le taux
de réduction (5% par défaut) se configure depuis l'onglet **Ambassadeur** de
l'espace administrateur.

## 12. Espace chargé de formation enrichi, et fonctions transverses

**Collaborateurs réels.** L'espace chargé de formation affiche la vraie liste
des apprenants rattachés à son entreprise (`entreprise_id` partagé), avec
leur nombre d'inscriptions, de formations terminées, et leur dernière
activité. Un "charge" ne peut jamais voir les collaborateurs d'une autre
entreprise (vérifié côté serveur dans `charge.controller.js`).

**Inscription en masse.** Le formulaire accepte une liste d'emails (un par
ligne ou séparés par des virgules). Le serveur traite chaque email
individuellement : succès et échecs (collaborateur introuvable, crédits
insuffisants en cours de route) sont rapportés séparément, et les
inscriptions déjà réussies avant un éventuel manque de crédits restent
acquises.

**Alerte de crédits bas.** Un bandeau d'avertissement apparaît automatiquement
dans l'espace chargé de formation dès que le solde descend sous 50 crédits.

**Export CSV.** Le bouton "Export CSV" télécharge le suivi complet de
formation de l'entreprise (collaborateur, module, statut, progression,
dates), avec un BOM UTF-8 pour un affichage correct des accents dans Excel.

**Page "Mon compte" (tous les rôles).** Accessible depuis le menu utilisateur
en haut à droite, cette page permet à n'importe quel utilisateur de modifier
lui-même son nom et son code postal, et de changer son mot de passe (avec
confirmation de l'ancien) — sans intervention de l'administrateur.

**Historique de paiements et reçus PDF.** Toujours depuis "Mon compte", chaque
utilisateur voit l'historique complet de ses achats (modules et lots de
crédits), avec le détail HT / TVA / TTC et la réduction ambassadeur
éventuellement appliquée. Un reçu PDF téléchargeable est disponible pour
chaque paiement validé (`GET /api/payments/:type/:id/receipt`) ; la
génération est bloquée tant que le paiement n'est pas confirmé (statut `paid`).

## 13. Bandeaux d'annonce et promotions temporaires

**Bandeaux d'annonce.** Depuis l'onglet **Bandeaux** de l'espace
administrateur, créez un ou plusieurs bandeaux avec un texte libre, une
couleur de fond et de texte personnalisées, et une image optionnelle (PNG,
JPEG, WEBP ou SVG). Chaque bandeau peut cibler indépendamment l'accueil, le
catalogue et/ou l'espace personnel ("Mon espace") — plusieurs bandeaux actifs
ciblant la même page s'affichent les uns sous les autres. Un bandeau peut être
désactivé sans être supprimé (utile pour réutiliser une promo plus tard). Les
images sont stockées dans `BANNER_ASSETS_DIR` (par défaut
`tutorisk-backend/banner-assets`).

**Promotions temporaires sur les modules.** Depuis l'onglet **Promotions**,
définissez une remise en pourcentage sur un module avec une date de début et
de fin précises (à la minute près). Pendant cette période, le catalogue et la
page du module affichent automatiquement le prix barré (TTC d'origine) et le
prix remisé, avec un badge "-X%". La remise s'applique aussi réellement au
moment de l'achat (carte ou virement), et se cumule le cas échéant avec la
réduction ambassadeur de l'acheteur (la promotion s'applique en premier sur
le prix HT, puis la réduction ambassadeur sur le résultat). Le statut de
chaque promotion (programmée / en cours / terminée / désactivée) est calculé
automatiquement à partir des dates et de l'indicateur actif/inactif.

## 14. Expiration de l'accès aux formations (3 mois)

**Comportement par défaut.** Toute inscription (achat carte/virement ou
affectation par un chargé de formation) reçoit automatiquement une date
d'expiration fixée à 3 mois après sa création (`expires_at`, calculée par la
base de données elle-même via la valeur par défaut de la colonne — aucun
calcul à dupliquer côté application). Passé ce délai, l'apprenant qui tente
d'accéder à la formation voit un message clair l'informant qu'elle est
périmée, et l'intégralité du contenu (vidéos, documents, liens, **y compris
les QCM**) est verrouillée — y compris en cas de tentative directe sur
l'endpoint de streaming vidéo (vérification redondante côté serveur, pas
seulement côté interface).

**Attestation non affectée.** Si l'apprenant avait déjà terminé la formation
à 100% avant l'expiration, son attestation reste téléchargeable indéfiniment
— l'expiration ne bloque que l'accès au contenu pédagogique, pas la preuve
d'un travail déjà accompli.

**Prolongation par l'administrateur.** Depuis l'onglet **Accès formations**
de l'espace administrateur, recherchez un apprenant par email, consultez
toutes ses inscriptions avec leur statut (actif / expiré / illimité), et
prolongez l'accès à une formation précise — même après expiration — soit de
3 mois supplémentaires, soit en illimité (`expires_at = NULL`). Cette action
est tracée (`extended_by`, `extended_at`) pour garder une trace de qui a
accordé l'extension et quand.

**API concernée.** `GET /api/admin/users/search?email=...` (recherche),
`GET /api/admin/users/:userId/enrollments` (liste avec statut), 
`PUT /api/admin/enrollments/:id/extend` (corps : `{"expiresAt": "2026-12-31T00:00:00Z"}` 
ou `{"expiresAt": null}` pour un accès illimité).

## 15. Commission ambassadeur et remboursement

**Gain de commission.** Lorsqu'un filleul (utilisateur ayant renseigné un code
ambassadeur) effectue un achat **confirmé** — paiement carte capturé par le
webhook Stripe, ou virement validé par l'administrateur —, l'émetteur du code
reçoit automatiquement une commission de 15% (taux configurable) du montant
réellement payé par le filleul, créditée sur son solde ambassadeur
(`users.ambassador_balance_cents`). Aucune commission n'est créditée sur une
commande encore en attente : un virement jamais reçu ne génère donc jamais de
commission fantôme.

**Demande de remboursement.** À partir de 100 € de solde accumulé (seuil
configurable), l'ambassadeur voit apparaître dans son espace personnel un
bouton "Demander le remboursement". Il peut d'abord télécharger un aperçu de
la facture qu'il "émet" à TutoRisk (PDF généré automatiquement avec ses
informations), puis valider sa demande en renseignant le titulaire du compte
et l'IBAN destinataires du virement. Le montant est figé au moment de la
demande (snapshot du solde) ; un ambassadeur ne peut avoir qu'**une seule**
demande active à la fois (contrainte unique en base), ce qui évite tout
chevauchement de créances.

**Traitement par l'administrateur.** Depuis l'onglet **Ambassadeur** de
l'espace admin, la liste des demandes en attente affiche l'IBAN fourni, le
montant, et deux actions : **Valider** (passe la demande en "validée",
calcule automatiquement une échéance informative à 45 jours) puis, une fois
le virement bancaire réellement exécuté **hors plateforme** (la plateforme ne
réalise aucun virement automatique — c'est un acte manuel de l'administrateur
auprès de sa banque), **Virement fait** : cette action débite le montant
correspondant du solde de l'ambassadeur et lui envoie un email de
confirmation que le virement a été lancé. Une demande peut aussi être
refusée à tout moment avant paiement.

**Configuration.** Le taux de réduction filleul, le taux de commission
ambassadeur, et le seuil de remboursement (en euros) se règlent tous les
trois depuis le même onglet **Ambassadeur**, via `PUT /api/referral/settings`.


## 16. Formations gratuites dans le catalogue

Un module dont le `price_cents` est 0 est automatiquement reconnu comme
"gratuit" par toute la plateforme :

- Le catalogue affiche un badge **Gratuit** à la place du prix.
- La page du module affiche un bouton **S'inscrire gratuitement** — un clic
  suffit, sans Stripe ni virement (`POST /api/enrollments/free`).
- L'accès est immédiat et **illimité** (`expires_at = NULL`) : la limite de
  3 mois ne s'applique pas aux formations gratuites, car il n'y a pas de
  valeur commerciale à protéger.
- Le chargé de formation peut affecter plusieurs collaborateurs à une
  formation gratuite sans consommer le moindre crédit ; le formulaire
  d'inscription en masse l'indique clairement.
- Valeur en base : il suffit de mettre `price_cents = 0` sur un module
  existant (via la page admin "Modules → éditer") pour le rendre gratuit,
  ou de créer directement un nouveau module à 0 € HT.

Note : le code ambassadeur ne génère pas de commission sur les inscriptions
gratuites (il n'y a pas de paiement, donc pas de montant HT à partager).

## Correction : commission ambassadeur calculée sur le montant HT

La commission de 15% est calculée sur le montant **HT** payé par le filleul
(après réductions ambassadeur et promotion éventuelles, mais avant TVA).
La TVA collectée n'est pas un revenu pour TutoRisk ; l'inclure dans la base
de calcul aurait été incorrect.
