-- ════════════════════════════════════════════════════════════
--  TutoRisk LCMS — Schéma PostgreSQL
-- ════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin','pedagogue','formateur','charge','apprenant');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE content_type AS ENUM ('video','doc','qcm','link','video_ext','text');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE enrollment_source AS ENUM ('purchase','assigned','free');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE session_status AS ENUM ('planifiee','en_cours','terminee');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending','paid','failed','refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method_t AS ENUM ('card','transfer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Entreprises (pour les comptes "chargé de formation") ─────
CREATE TABLE IF NOT EXISTS entreprises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL
);

-- ─── Utilisateurs ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'apprenant',
  entreprise_id UUID REFERENCES entreprises(id) ON DELETE SET NULL,
  forfait_credits INTEGER,
  postal_code TEXT,
  country_code TEXT NOT NULL DEFAULT 'FR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Jetons de rafraîchissement (révocables) ────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

-- ─── Modules de formation ───────────────────────────────────
CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  duration_min INTEGER NOT NULL,
  level TEXT NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  pedagogue_id UUID REFERENCES users(id) ON DELETE SET NULL,
  -- Un module en brouillon (published=false) est invisible dans le catalogue
  -- pour les apprenants et les chargés de formation. Seuls les admins et
  -- pédagogues peuvent voir et modifier les brouillons.
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Chapitres ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chapters (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_chapters_module ON chapters(module_id);

-- ─── Contenus (vidéo / document / qcm / lien) ───────────────
-- file_path n'est JAMAIS exposé directement au frontend : seul le backend
-- y accède pour le streaming protégé par jeton signé.
CREATE TABLE IF NOT EXISTS contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  type content_type NOT NULL,
  title TEXT,
  file_path TEXT,
  mime_type TEXT,
  external_url TEXT,
  -- Contenu HTML sécurisé pour le type "text" (texte enrichi)
  content_text TEXT,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_contents_chapter ON contents(chapter_id);

-- ─── Questions / options QCM ────────────────────────────────
CREATE TABLE IF NOT EXISTS qcm_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  -- Texte affiché après réponse (explication pédagogique, facultatif)
  explanation_text TEXT,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS qcm_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES qcm_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0
);

-- ─── Inscriptions (achat ou affectation) ────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  source enrollment_source NOT NULL,
  completed_at TIMESTAMPTZ,
  -- Accès limité à 3 mois par défaut. NULL = accès illimité (réservé aux
  -- extensions manuelles accordées par l'administrateur).
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '3 months'),
  extended_by UUID REFERENCES users(id) ON DELETE SET NULL,
  extended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- ─── Progression d'apprentissage ─────────────────────────────
CREATE TABLE IF NOT EXISTS progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  watched_seconds INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_id)
);

-- ─── Paiements Stripe / virement (achat de modules) ─────────
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  amount_cents_ht INTEGER NOT NULL,
  vat_rate_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'eur',
  payment_method payment_method_t NOT NULL DEFAULT 'card',
  status payment_status NOT NULL DEFAULT 'pending',
  transfer_reference TEXT,
  validated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── TVA — taux par défaut par pays, surchargeable par préfixe de code postal ──
-- Permet par exemple : France hexagonale 20% par défaut, mais Guadeloupe/Martinique
-- (préfixe 971/972) à 8,5%, Guyane (973) et Saint-Barthélemy (97133) à 0%.
CREATE TABLE IF NOT EXISTS vat_country_defaults (
  country_code TEXT PRIMARY KEY,
  country_name TEXT NOT NULL,
  default_rate_percent NUMERIC(5,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS vat_postal_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_code TEXT NOT NULL REFERENCES vat_country_defaults(country_code) ON DELETE CASCADE,
  postal_prefix TEXT NOT NULL,
  rate_percent NUMERIC(5,2) NOT NULL,
  label TEXT,
  position INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_vat_postal_rules_country ON vat_postal_rules(country_code);

-- ─── Bandeaux d'annonce (promos, messages) — configurables par l'admin ──
-- Une même bannière peut être affichée sur plusieurs pages à la fois.
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL DEFAULT '',
  background_color TEXT NOT NULL DEFAULT '#CC1515',
  text_color TEXT NOT NULL DEFAULT '#FFFFFF',
  image_path TEXT,
  image_mime TEXT,
  show_on_home BOOLEAN NOT NULL DEFAULT false,
  show_on_catalog BOOLEAN NOT NULL DEFAULT false,
  show_on_dashboard BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Promotions temporaires sur les modules ──────────────────
CREATE TABLE IF NOT EXISTS module_promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  discount_percent NUMERIC(5,2) NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS idx_module_promotions_module ON module_promotions(module_id);
CREATE INDEX IF NOT EXISTS idx_module_promotions_dates ON module_promotions(starts_at, ends_at);

-- ─── Lots de crédits — configurables par l'administrateur ────
CREATE TABLE IF NOT EXISTS credit_packs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  discount_percent INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Achats de lots de crédits (carte ou virement) ───────────
CREATE TABLE IF NOT EXISTS credit_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pack_id UUID REFERENCES credit_packs(id) ON DELETE SET NULL,
  credits INTEGER NOT NULL,
  amount_cents_ht INTEGER NOT NULL,
  vat_rate_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'eur',
  payment_method payment_method_t NOT NULL DEFAULT 'card',
  status payment_status NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  transfer_reference TEXT,
  validated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ─── Sessions de formation (présentiel / groupe) ────────────
CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  date DATE NOT NULL,
  formateur_id UUID REFERENCES users(id) ON DELETE SET NULL,
  statut session_status NOT NULL DEFAULT 'planifiee'
);

CREATE TABLE IF NOT EXISTS session_learners (
  session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (session_id, learner_id)
);

-- ─── Mises à jour idempotentes pour les bases déjà migrées avant l'ajout ──
-- de la TVA (sans danger à rejouer : ne fait rien si déjà appliqué).
ALTER TYPE enrollment_source ADD VALUE IF NOT EXISTS 'free';
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'video_ext';
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'text';
ALTER TABLE modules ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT false;
UPDATE modules SET published = true WHERE published = false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE contents ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE contents ADD COLUMN IF NOT EXISTS content_text TEXT;
-- QCM : explication pédagogique par question, seuil de réussite par bloc QCM
ALTER TABLE qcm_questions ADD COLUMN IF NOT EXISTS explanation_text TEXT;
ALTER TABLE contents ADD COLUMN IF NOT EXISTS pass_score_percent INTEGER NOT NULL DEFAULT 0;
-- Progression par chapitre : activer l'ordre obligatoire sur un module
ALTER TABLE modules ADD COLUMN IF NOT EXISTS chapter_order_enforced BOOLEAN NOT NULL DEFAULT false;
-- RGPD : consentement explicite horodaté, requis à l'inscription (Art. 7 RGPD)
ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_accepted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_version TEXT;
-- RGPD droit à l'effacement (Art. 17 RGPD) : pseudonymisation plutôt que
-- suppression dure, pour conserver l'intégrité des paiements et journaux
-- financiers dont la conservation est imposée par la loi (Art. L123-22 C.com.).
ALTER TABLE users ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS country_code TEXT NOT NULL DEFAULT 'FR';
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (now() + interval '3 months');
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS extended_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS extended_at TIMESTAMPTZ;
-- Pour les inscriptions déjà existantes avant cette mise à jour (sans date
-- d'expiration calculée), on fixe 3 mois à partir de leur date de création,
-- sans jamais écraser une valeur déjà présente.
UPDATE enrollments SET expires_at = created_at + interval '3 months' WHERE expires_at IS NULL AND completed_at IS NULL;

DO $$ BEGIN
  ALTER TABLE payments RENAME COLUMN amount_cents TO amount_cents_legacy;
EXCEPTION WHEN undefined_column THEN NULL; END $$;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount_cents_ht INTEGER;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS vat_rate_percent NUMERIC(5,2) NOT NULL DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount_cents INTEGER;
UPDATE payments SET amount_cents_ht = amount_cents_legacy WHERE amount_cents_ht IS NULL AND amount_cents_legacy IS NOT NULL;
UPDATE payments SET amount_cents = amount_cents_legacy WHERE amount_cents IS NULL AND amount_cents_legacy IS NOT NULL;
ALTER TABLE payments DROP COLUMN IF EXISTS amount_cents_legacy;

DO $$ BEGIN
  ALTER TABLE credit_purchases RENAME COLUMN amount_cents TO amount_cents_legacy;
EXCEPTION WHEN undefined_column THEN NULL; END $$;
ALTER TABLE credit_purchases ADD COLUMN IF NOT EXISTS amount_cents_ht INTEGER;
ALTER TABLE credit_purchases ADD COLUMN IF NOT EXISTS vat_rate_percent NUMERIC(5,2) NOT NULL DEFAULT 0;
ALTER TABLE credit_purchases ADD COLUMN IF NOT EXISTS amount_cents INTEGER;
UPDATE credit_purchases SET amount_cents_ht = amount_cents_legacy WHERE amount_cents_ht IS NULL AND amount_cents_legacy IS NOT NULL;
UPDATE credit_purchases SET amount_cents = amount_cents_legacy WHERE amount_cents IS NULL AND amount_cents_legacy IS NOT NULL;
ALTER TABLE credit_purchases DROP COLUMN IF EXISTS amount_cents_legacy;

-- Si la base ne contenait pas encore de configuration de TVA (première migration
-- réalisée avant cette fonctionnalité), on insère les valeurs par défaut ici aussi
-- (le script seed.js les insère normalement, mais ceci sécurise une simple re-migration).
INSERT INTO vat_country_defaults (country_code, country_name, default_rate_percent)
VALUES ('FR','France',20)
ON CONFLICT (country_code) DO NOTHING;

-- ─── Personnalisation des attestations (texte + tampon/signature) ──────
-- Table à une seule ligne (id=1) — configuration globale modifiable par l'admin.
-- Les images (tampon, signature) sont stockées sur disque (CERTIFICATE_ASSETS_DIR),
-- seul le chemin relatif est conservé ici.
CREATE TABLE IF NOT EXISTS certificate_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  title_text TEXT NOT NULL DEFAULT 'Attestation de formation',
  intro_text TEXT NOT NULL DEFAULT 'TutoRisk certifie que',
  subtitle_text TEXT NOT NULL DEFAULT 'a suivi avec succès la formation',
  footer_text TEXT NOT NULL DEFAULT 'Document généré automatiquement — TutoRisk LCMS',
  signatory_name TEXT NOT NULL DEFAULT 'Le Directeur',
  signatory_title TEXT NOT NULL DEFAULT 'TutoRisk',
  stamp_path TEXT,
  stamp_mime TEXT,
  signature_path TEXT,
  signature_mime TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO certificate_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ─── Codes ambassadeur — réduction pour le filleul qui utilise le code ──
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_code TEXT;

CREATE TABLE IF NOT EXISTS referral_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 5
);
INSERT INTO referral_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Attribue un code ambassadeur aux comptes déjà existants qui n'en ont pas
-- encore (mise à jour d'une base déjà migrée avant cette fonctionnalité).
UPDATE users SET referral_code = UPPER(SUBSTR(MD5(id::text || clock_timestamp()::text || random()::text), 1, 8))
WHERE referral_code IS NULL;

-- Trace des réductions appliquées via un code ambassadeur, sur les deux types
-- de commande (module et lot de crédits).
ALTER TABLE payments ADD COLUMN IF NOT EXISTS referral_code_used TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS referral_discount_percent NUMERIC(5,2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS promo_discount_percent NUMERIC(5,2);
ALTER TABLE credit_purchases ADD COLUMN IF NOT EXISTS referral_code_used TEXT;
ALTER TABLE credit_purchases ADD COLUMN IF NOT EXISTS referral_discount_percent NUMERIC(5,2);

-- ─── Commission ambassadeur ───────────────────────────────────
-- Solde en centimes accumulé par un ambassadeur grâce aux achats de ses
-- filleuls (15% du montant payé par le filleul, par défaut — configurable).
ALTER TABLE users ADD COLUMN IF NOT EXISTS ambassador_balance_cents INTEGER NOT NULL DEFAULT 0;

ALTER TABLE referral_settings ADD COLUMN IF NOT EXISTS commission_percent NUMERIC(5,2) NOT NULL DEFAULT 15;
ALTER TABLE referral_settings ADD COLUMN IF NOT EXISTS reimbursement_threshold_cents INTEGER NOT NULL DEFAULT 10000;

DO $$ BEGIN
  CREATE TYPE reimbursement_status AS ENUM ('pending','validated','paid','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Demande de remboursement de la commission accumulée, déclenchable à partir
-- du seuil configuré (100 crédits = 10 000 centimes par défaut). Le montant
-- est figé au moment de la demande (snapshot du solde) ; le solde n'est
-- effectivement débité qu'une fois le virement marqué comme effectué par
-- l'administrateur (voir admin.controller.js → markReimbursementPaid).
CREATE TABLE IF NOT EXISTS ambassador_reimbursements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  invoice_number TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  iban TEXT NOT NULL,
  status reimbursement_status NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  validated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  validated_at TIMESTAMPTZ,
  deadline_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ambassador_reimbursements_user ON ambassador_reimbursements(user_id);

-- Un ambassadeur ne peut avoir qu'une seule demande active (pending ou
-- validated) à la fois, pour éviter tout chevauchement de créances sur le
-- même solde.
CREATE UNIQUE INDEX IF NOT EXISTS idx_ambassador_reimbursements_one_active
  ON ambassador_reimbursements(user_id)
  WHERE status IN ('pending','validated');


-- ─── Tags / Mots-clés ────────────────────────────────────────
-- Un tag peut être associé à plusieurs modules, un module peut avoir
-- plusieurs tags. Exemples : "incendie", "chimique", "électrique", "PRAP".
CREATE TABLE IF NOT EXISTS module_tags (
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (module_id, tag)
);
CREATE INDEX IF NOT EXISTS idx_module_tags_tag ON module_tags(tag);
CREATE INDEX IF NOT EXISTS idx_module_tags_module ON module_tags(module_id);

-- ─── Parcours de formation ────────────────────────────────────
-- Un parcours regroupe plusieurs modules dans un ordre défini.
-- L'inscription à un parcours inscrit automatiquement l'apprenant
-- à tous ses modules. Une attestation globale est émise quand tous
-- les modules du parcours sont terminés.
CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_path_modules (
  path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (path_id, module_id)
);
CREATE INDEX IF NOT EXISTS idx_lpm_path ON learning_path_modules(path_id);
CREATE INDEX IF NOT EXISTS idx_lpm_module ON learning_path_modules(module_id);

-- Inscriptions à un parcours (trace pour l'historique et la facturation)
CREATE TABLE IF NOT EXISTS path_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'purchase',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, path_id)
);
CREATE INDEX IF NOT EXISTS idx_path_enrollments_user ON path_enrollments(user_id);

-- ─── Temps passé sur chaque contenu (pour analytics) ─────────
-- time_spent_seconds : durée totale cumulée de consultation de ce contenu
-- par cet apprenant (toutes sessions confondues). Pour les vidéos, on le
-- dérive de watched_seconds. Pour les autres types (doc, qcm, text, lien)
-- l'interface frontend envoie le temps écoulé entre ouverture et fermeture.
-- first_opened_at : horodatage de la première consultation (cohorte).
ALTER TABLE progress ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER NOT NULL DEFAULT 0;
ALTER TABLE progress ADD COLUMN IF NOT EXISTS first_opened_at TIMESTAMPTZ;
