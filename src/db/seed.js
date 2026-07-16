require("dotenv").config();
const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");
const { generateUniqueReferralCode } = require("../utils/referral");

// ── Données reprenant la structure du catalogue existant côté frontend ──
const MODULES = [
  { id: "m1", title: "Sensibilisation à la sécurité incendie", category: "Sécurité", duration_min: 90, level: "Fondamental", price_cents: 2900, description: "Prévention des risques incendie, moyens de lutte et procédures d'évacuation.",
    chapters: [
      { id: "m1-c1", title: "Causes et types d'incendie", contents: [["video","Vidéo : causes et types"],["doc","Fiche récapitulative"],["qcm","QCM"]] },
      { id: "m1-c2", title: "Prévention et équipements", contents: [["video","Vidéo : équipements"],["doc","Fiche équipements"]] },
      { id: "m1-c3", title: "Procédures d'évacuation", contents: [["video","Vidéo : évacuation"],["qcm","QCM"]] },
      { id: "m1-c4", title: "Réglementation", contents: [["doc","Texte réglementaire"],["qcm","QCM"],["link","Ressource officielle"]] },
    ]},
  { id: "m2", title: "Sensibilisation au risque chimique", category: "Sécurité", duration_min: 120, level: "Fondamental", price_cents: 3500, description: "Identifier et prévenir les risques liés aux agents chimiques.",
    chapters: [
      { id: "m2-c1", title: "Classification des produits", contents: [["video","Vidéo : classification"],["doc","Fiche FDS"]] },
      { id: "m2-c2", title: "Fiches de sécurité (FDS)", contents: [["doc","Modèle de FDS"],["qcm","QCM"]] },
      { id: "m2-c3", title: "Équipements de protection", contents: [["video","Vidéo : EPI"],["qcm","QCM"]] },
      { id: "m2-c4", title: "Stockage et manipulation", contents: [["video","Vidéo : stockage"],["doc","Fiche stockage"]] },
      { id: "m2-c5", title: "Conduite en cas d'accident", contents: [["video","Vidéo : conduite à tenir"],["qcm","QCM"],["link","Numéros d'urgence"]] },
    ]},
  { id: "m3", title: "Sensibilisation au risque routier", category: "Sécurité", duration_min: 60, level: "Fondamental", price_cents: 2500, description: "Réduire les accidents de trajet et de mission.",
    chapters: [
      { id: "m3-c1", title: "Statistiques et enjeux", contents: [["video","Vidéo : enjeux"],["doc","Fiche statistiques"]] },
      { id: "m3-c2", title: "Facteurs de risque", contents: [["video","Vidéo : facteurs"],["qcm","QCM"]] },
      { id: "m3-c3", title: "Bonnes pratiques", contents: [["video","Vidéo : bonnes pratiques"],["doc","Mémo conduite"],["qcm","QCM"]] },
    ]},
  { id: "m7", title: "Habilitation électrique H0B0 – Non-électricien", category: "Sécurité", duration_min: 180, level: "Certifiant", price_cents: 5900, description: "Formation préalable à l'habilitation électrique pour le personnel non-électricien.",
    chapters: [
      { id: "m7-c1", title: "Principes de l'électricité", contents: [["video","Vidéo : principes"],["doc","Fiche principes"]] },
      { id: "m7-c2", title: "Risques et effets sur le corps", contents: [["video","Vidéo : risques"],["qcm","QCM"]] },
      { id: "m7-c3", title: "Zones de sécurité", contents: [["video","Vidéo : zones"],["doc","Schéma des zones"]] },
      { id: "m7-c4", title: "Équipements de protection", contents: [["video","Vidéo : EPI électriques"],["qcm","QCM"]] },
      { id: "m7-c5", title: "Consignation", contents: [["video","Vidéo : consignation"],["doc","Procédure"]] },
      { id: "m7-c6", title: "Procédures B0H0", contents: [["video","Vidéo : procédures"],["qcm","QCM"]] },
      { id: "m7-c7", title: "Évaluation finale", contents: [["doc","Mémo final"],["qcm","QCM final"],["link","Référentiel UTE C18-510"]] },
    ]},
  { id: "an1", title: "Sensibilisation aux aléas naturels", category: "Aléas naturels", duration_min: 90, level: "Fondamental", price_cents: 2900, description: "Comprendre et anticiper les risques naturels majeurs.",
    chapters: [
      { id: "an1-c1", title: "Typologies des aléas naturels", contents: [["video","Vidéo : typologies"],["doc","Fiche typologies"],["qcm","QCM"]] },
      { id: "an1-c2", title: "Phénomènes cycloniques et météorologiques", contents: [["video","Vidéo : cyclones"],["doc","Fiche météo"]] },
      { id: "an1-c3", title: "Séismes, inondations et submersions", contents: [["video","Vidéo : séismes"],["qcm","QCM"]] },
      { id: "an1-c4", title: "Comportements à adopter et chaîne d'alerte", contents: [["video","Vidéo : alerte"],["doc","Fiche réflexe"],["qcm","QCM"],["link","Vigicrues / Météo-France"]] },
    ]},
  { id: "an2", title: "Obligations PCS et DICRIM", category: "Aléas naturels", duration_min: 120, level: "Intermédiaire", price_cents: 4900, description: "Maîtriser le cadre réglementaire du PCS et du DICRIM.",
    chapters: [
      { id: "an2-c1", title: "Cadre législatif : loi du 13 août 2004", contents: [["video","Vidéo : cadre légal"],["doc","Texte de loi"]] },
      { id: "an2-c2", title: "Élaboration et contenu du PCS", contents: [["video","Vidéo : PCS"],["doc","Modèle de PCS"],["qcm","QCM"]] },
      { id: "an2-c3", title: "Le DICRIM : contenu et diffusion", contents: [["video","Vidéo : DICRIM"],["qcm","QCM"]] },
      { id: "an2-c4", title: "Mise en œuvre opérationnelle", contents: [["video","Vidéo : mise en œuvre"],["doc","Fiche opérationnelle"]] },
      { id: "an2-c5", title: "Exercices de simulation", contents: [["doc","Scénario d'exercice"],["qcm","QCM"],["link","Retour d'expérience"]] },
    ]},
  { id: "an3", title: "Rédaction des PPMS", category: "Aléas naturels", duration_min: 150, level: "Avancé", price_cents: 5900, description: "Rédiger et mettre en œuvre le Plan Particulier de Mise en Sûreté.",
    chapters: [
      { id: "an3-c1", title: "Cadre réglementaire des PPMS", contents: [["video","Vidéo : cadre"],["doc","Texte réglementaire"]] },
      { id: "an3-c2", title: "Identification des risques et scénarios", contents: [["video","Vidéo : scénarios"],["qcm","QCM"]] },
      { id: "an3-c3", title: "Rédaction des fiches réflexes", contents: [["doc","Modèle de fiche"],["qcm","QCM"]] },
      { id: "an3-c4", title: "Organisation des exercices PPMS", contents: [["video","Vidéo : organisation"],["doc","Fiche d'organisation"]] },
      { id: "an3-c5", title: "Confinement et évacuation", contents: [["video","Vidéo : confinement"],["qcm","QCM"]] },
      { id: "an3-c6", title: "Mise à jour et validation du PPMS", contents: [["doc","Checklist de mise à jour"],["qcm","QCM"],["link","Ressources Éducation nationale"]] },
    ]},
  { id: "rt1", title: "Classification des ICPE", category: "Risques technologiques", duration_min: 120, level: "Intermédiaire", price_cents: 4900, description: "Régime juridique des Installations Classées pour la Protection de l'Environnement.",
    chapters: [
      { id: "rt1-c1", title: "Définition et enjeux des ICPE", contents: [["video","Vidéo : définition"],["doc","Fiche définition"]] },
      { id: "rt1-c2", title: "Nomenclature et régimes", contents: [["video","Vidéo : nomenclature"],["doc","Tableau des régimes"],["qcm","QCM"]] },
      { id: "rt1-c3", title: "Obligations de l'exploitant", contents: [["video","Vidéo : obligations"],["qcm","QCM"]] },
      { id: "rt1-c4", title: "Inspection et contrôle", contents: [["doc","Fiche inspection"],["qcm","QCM"]] },
      { id: "rt1-c5", title: "Études de dangers et PPRT", contents: [["video","Vidéo : PPRT"],["doc","Fiche PPRT"],["link","Base des installations classées"]] },
    ]},
  { id: "rt2", title: "Formation ADR 1.3 – Transport de matières dangereuses", category: "Risques technologiques", duration_min: 180, level: "Certifiant", price_cents: 6900, description: "Formation réglementaire ADR 1.3 pour le personnel du transport de matières dangereuses.",
    chapters: [
      { id: "rt2-c1", title: "Réglementation ADR et classification", contents: [["video","Vidéo : réglementation"],["doc","Tableau de classification"]] },
      { id: "rt2-c2", title: "Emballages, étiquetage et marquage", contents: [["video","Vidéo : étiquetage"],["doc","Fiche marquage"],["qcm","QCM"]] },
      { id: "rt2-c3", title: "Documents de transport", contents: [["doc","Modèle de document"],["qcm","QCM"]] },
      { id: "rt2-c4", title: "Consignes de sécurité", contents: [["video","Vidéo : consignes"],["qcm","QCM"]] },
      { id: "rt2-c5", title: "Obligations du transporteur", contents: [["video","Vidéo : obligations"],["doc","Fiche obligations"]] },
      { id: "rt2-c6", title: "Conduite en cas d'accident", contents: [["video","Vidéo : conduite à tenir"],["qcm","QCM"]] },
      { id: "rt2-c7", title: "Évaluation certifiante", contents: [["doc","Mémo final"],["qcm","QCM final"],["link","Réglementation ADR officielle"]] },
    ]},
  { id: "rt3", title: "Sensibilisation aux accès des établissements classés", category: "Risques technologiques", duration_min: 60, level: "Fondamental", price_cents: 2500, description: "Règles de sécurité spécifiques aux sites industriels classés ICPE.",
    chapters: [
      { id: "rt3-c1", title: "Risques spécifiques des sites classés", contents: [["video","Vidéo : risques"],["doc","Fiche risques"],["qcm","QCM"]] },
      { id: "rt3-c2", title: "Procédures d'accès et plan de prévention", contents: [["video","Vidéo : procédures"],["doc","Plan de prévention type"]] },
      { id: "rt3-c3", title: "Conduite en cas d'alerte sur site", contents: [["video","Vidéo : alerte"],["qcm","QCM"],["link","Consignes du site"]] },
    ]},
  { id: "m4a", title: "Prévention du harcèlement – Employé", category: "RH & Bien-être", duration_min: 75, level: "Fondamental", price_cents: 2900, description: "Reconnaître et signaler les situations de harcèlement au travail.",
    chapters: [
      { id: "m4a-c1", title: "Définitions et cadre juridique", contents: [["video","Vidéo : définitions"],["doc","Fiche juridique"]] },
      { id: "m4a-c2", title: "Reconnaître le harcèlement", contents: [["video","Vidéo : signaux"],["qcm","QCM"]] },
      { id: "m4a-c3", title: "Réagir et se protéger", contents: [["video","Vidéo : réagir"],["doc","Fiche réflexe"]] },
      { id: "m4a-c4", title: "Dispositifs de signalement", contents: [["doc","Annuaire des dispositifs"],["qcm","QCM"],["link","Cellule d'écoute"]] },
    ]},
  { id: "m4b", title: "Prévention du harcèlement – Manager", category: "RH & Bien-être", duration_min: 90, level: "Avancé", price_cents: 3900, description: "Former les managers à prévenir et gérer le harcèlement dans leurs équipes.",
    chapters: [
      { id: "m4b-c1", title: "Responsabilités légales", contents: [["video","Vidéo : responsabilités"],["doc","Fiche juridique"]] },
      { id: "m4b-c2", title: "Signaux d'alerte", contents: [["video","Vidéo : signaux"],["qcm","QCM"]] },
      { id: "m4b-c3", title: "Conduire un entretien", contents: [["video","Vidéo : entretien"],["doc","Trame d'entretien"]] },
      { id: "m4b-c4", title: "Actions correctives", contents: [["video","Vidéo : actions"],["qcm","QCM"]] },
      { id: "m4b-c5", title: "Culture de prévention", contents: [["doc","Guide managérial"],["link","Ressources INRS"]] },
    ]},
  { id: "m5", title: "Fonctionnement du CSE – Entreprise privée", category: "Instances représentatives", duration_min: 150, level: "Intermédiaire", price_cents: 4900, description: "Rôle, missions et fonctionnement du Comité Social et Économique.",
    chapters: [
      { id: "m5-c1", title: "Mise en place et élections", contents: [["video","Vidéo : élections"],["doc","Fiche procédure"]] },
      { id: "m5-c2", title: "Attributions économiques", contents: [["video","Vidéo : attributions"],["qcm","QCM"]] },
      { id: "m5-c3", title: "Santé et sécurité", contents: [["video","Vidéo : santé sécurité"],["doc","Fiche SSCT"]] },
      { id: "m5-c4", title: "Attributions sociales", contents: [["doc","Fiche attributions"],["qcm","QCM"]] },
      { id: "m5-c5", title: "Réunions", contents: [["video","Vidéo : réunions"],["doc","Modèle d'ordre du jour"]] },
      { id: "m5-c6", title: "Droits des élus", contents: [["video","Vidéo : droits"],["qcm","QCM"],["link","Code du travail"]] },
    ]},
  { id: "m6", title: "Fonctionnement du CST – Fonction publique", category: "Instances représentatives", duration_min: 150, level: "Intermédiaire", price_cents: 4900, description: "Spécificités du Comité Social Territorial dans la fonction publique.",
    chapters: [
      { id: "m6-c1", title: "Cadre réglementaire FPT", contents: [["video","Vidéo : cadre"],["doc","Texte réglementaire"]] },
      { id: "m6-c2", title: "Composition et élections", contents: [["video","Vidéo : élections"],["qcm","QCM"]] },
      { id: "m6-c3", title: "Missions et compétences", contents: [["video","Vidéo : missions"],["doc","Fiche missions"]] },
      { id: "m6-c4", title: "Relations avec l'employeur", contents: [["doc","Fiche relations"],["qcm","QCM"]] },
      { id: "m6-c5", title: "CHSCT et formation", contents: [["video","Vidéo : CHSCT"],["doc","Fiche formation"]] },
      { id: "m6-c6", title: "Droits syndicaux", contents: [["video","Vidéo : droits syndicaux"],["qcm","QCM"],["link","Statut de la fonction publique"]] },
    ]},
  { id: "m8", title: "Rédaction du Document Unique (DUERP)", category: "Évaluation des risques", duration_min: 210, level: "Expert", price_cents: 7900, description: "Méthode complète pour réaliser l'évaluation des risques et rédiger un DUERP conforme.",
    chapters: [
      { id: "m8-c1", title: "Cadre réglementaire", contents: [["video","Vidéo : cadre"],["doc","Texte réglementaire"]] },
      { id: "m8-c2", title: "Unités de travail", contents: [["video","Vidéo : unités"],["qcm","QCM"]] },
      { id: "m8-c3", title: "Inventaire des risques", contents: [["video","Vidéo : inventaire"],["doc","Grille d'inventaire"]] },
      { id: "m8-c4", title: "Cotation et hiérarchisation", contents: [["video","Vidéo : cotation"],["qcm","QCM"]] },
      { id: "m8-c5", title: "Plan d'action", contents: [["video","Vidéo : plan d'action"],["doc","Modèle de plan d'action"]] },
      { id: "m8-c6", title: "Mise à jour et suivi", contents: [["doc","Checklist de suivi"],["qcm","QCM"]] },
      { id: "m8-c7", title: "Implication des salariés", contents: [["video","Vidéo : implication"],["doc","Fiche implication"]] },
      { id: "m8-c8", title: "Cas pratique complet", contents: [["doc","Étude de cas"],["qcm","QCM final"],["link","Outil DUERP INRS"]] },
    ]},
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // ── Entreprises de démonstration ──
    const { rows: entRows } = await client.query(
      `INSERT INTO entreprises (name) VALUES ('Acme Group'), ('SAS Dupont') RETURNING id, name`
    );
    const entByName = Object.fromEntries(entRows.map((r) => [r.name, r.id]));

    // ── Utilisateurs de démonstration (mot de passe identique pour tous : "Demo1234!") ──
    const demoPasswordHash = await bcrypt.hash("Demo1234!", 12);
    const demoUsers = [
      { name: "Sophie Martin", email: "s.martin@tutorisk.com", role: "admin" },
      { name: "Marc Dubois", email: "m.dubois@tutorisk.com", role: "pedagogue" },
      { name: "Claire Leroy", email: "c.leroy@tutorisk.com", role: "formateur" },
      { name: "Bruno Dupont", email: "b.dupont@acmegroup.fr", role: "charge", entreprise_id: entByName["Acme Group"], forfait_credits: 500 },
      { name: "Julie Bernard", email: "j.bernard@acmegroup.fr", role: "apprenant", entreprise_id: entByName["Acme Group"] },
    ];
    const userIdByEmail = {};
    for (const u of demoUsers) {
      const referralCode = await generateUniqueReferralCode();
      const { rows } = await client.query(
        `INSERT INTO users (name, email, password_hash, role, entreprise_id, forfait_credits, referral_code)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [u.name, u.email, demoPasswordHash, u.role, u.entreprise_id || null, u.forfait_credits ?? null, referralCode]
      );
      userIdByEmail[u.email] = rows[0].id;
    }
    const pedagogueId = userIdByEmail["m.dubois@tutorisk.com"];

    // ── Modules + chapitres + contenus ──
    for (const m of MODULES) {
      await client.query(
        `INSERT INTO modules (id, title, category, duration_min, level, price_cents, description, pedagogue_id, published)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true)`,
        [m.id, m.title, m.category, m.duration_min, m.level, m.price_cents, m.description, pedagogueId]
      );
      for (let ci = 0; ci < m.chapters.length; ci++) {
        const c = m.chapters[ci];
        await client.query(
          `INSERT INTO chapters (id, module_id, title, position) VALUES ($1,$2,$3,$4)`,
          [c.id, m.id, c.title, ci]
        );
        for (let xi = 0; xi < c.contents.length; xi++) {
          const [type, title] = c.contents[xi];
          const filePath = type === "video" ? `videos/${c.id}.mp4` : type === "doc" ? `docs/${c.id}.pdf` : null;
          const externalUrl = type === "link" ? "https://www.tutorisk.com" : null;
          const { rows: contentRows } = await client.query(
            `INSERT INTO contents (chapter_id, type, title, file_path, external_url, position)
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
            [c.id, type, title, filePath, externalUrl, xi]
          );
          if (type === "qcm") {
            const { rows: qRows } = await client.query(
              `INSERT INTO qcm_questions (content_id, question_text, position) VALUES ($1,$2,0) RETURNING id`,
              [contentRows[0].id, `Question d'exemple — ${c.title}`]
            );
            const options = ["Réponse correcte", "Réponse incorrecte A", "Réponse incorrecte B", "Réponse incorrecte C"];
            for (let oi = 0; oi < options.length; oi++) {
              await client.query(
                `INSERT INTO qcm_options (question_id, option_text, is_correct, position) VALUES ($1,$2,$3,$4)`,
                [qRows[0].id, options[oi], oi === 0, oi]
              );
            }
          }
        }
      }
    }

    // ── Inscriptions de démonstration pour l'apprenant ──
    await client.query(
      `INSERT INTO enrollments (user_id, module_id, source) VALUES ($1,'m1','assigned'), ($1,'m3','assigned')`,
      [userIdByEmail["j.bernard@acmegroup.fr"]]
    );

    // ── Lots de crédits par défaut (configurables ensuite par l'admin) ──
    await client.query(
      `INSERT INTO credit_packs (name, credits, price_cents, discount_percent, position) VALUES
       ('Lot de 100 crédits', 100, 9500, 5, 0),
       ('Lot de 1 000 crédits', 1000, 90000, 10, 1),
       ('Lot de 10 000 crédits', 10000, 800000, 20, 2)`
    );

    // ── Configuration de TVA par défaut (France hexagonale + DOM-TOM) ──
    await client.query(
      `INSERT INTO vat_country_defaults (country_code, country_name, default_rate_percent)
       VALUES ('FR','France',20)
       ON CONFLICT (country_code) DO NOTHING`
    );
    await client.query(
      `INSERT INTO vat_postal_rules (country_code, postal_prefix, rate_percent, label, position)
       SELECT * FROM (VALUES
         ('FR','971',8.5,'Guadeloupe',0),
         ('FR','972',8.5,'Martinique',1),
         ('FR','973',0,'Guyane',2),
         ('FR','97133',0,'Saint-Barthélemy',3)
       ) AS v(country_code, postal_prefix, rate_percent, label, position)
       WHERE NOT EXISTS (SELECT 1 FROM vat_postal_rules WHERE country_code = v.country_code AND postal_prefix = v.postal_prefix)`
    );

    await client.query("COMMIT");
    console.log("✓ Seed terminé :", MODULES.length, "modules,", demoUsers.length, "utilisateurs, 3 lots de crédits, TVA configurée.");
    console.log("  Mot de passe de démonstration pour tous les comptes :  Demo1234!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("✗ Échec du seed :", err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
