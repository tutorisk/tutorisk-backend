const { CURRENT_TERMS_VERSION } = require("../controllers/auth.controller");

// Politique de confidentialité et mentions légales — servis publiquement,
// sans authentification requise.

function privacyPolicy(req, res) {
  res.json({
    version: CURRENT_TERMS_VERSION,
    last_updated: "2026-06-22",
    content: {
      title: "Politique de confidentialité — TutoRisk",
      sections: [
        {
          id: "responsable",
          title: "1. Responsable du traitement",
          text: "TutoRisk SAS, dont le siège social est situé en France, est responsable du traitement de vos données personnelles au sens du Règlement Général sur la Protection des Données (RGPD, UE 2016/679)."
        },
        {
          id: "donnees_collectees",
          title: "2. Données collectées",
          text: "Nous collectons uniquement les données nécessaires au fonctionnement de la plateforme :\n• Identification : nom, adresse e-mail\n• Connexion : mot de passe hashé (bcrypt, jamais stocké en clair)\n• Facturation : code postal, pays (calcul TVA), historique de paiements\n• Usage : progression dans les formations, scores aux QCM, vidéos visionnées\n• Technique : jetons de session (cookies httpOnly, durée 7 jours)\n• Parrainage : code ambassadeur, code utilisé à l'inscription"
        },
        {
          id: "finalites",
          title: "3. Finalités et base légale",
          text: "• Fourniture du service de formation (exécution du contrat — Art. 6.1.b)\n• Facturation et obligations comptables (obligation légale — Art. 6.1.c)\n• Amélioration du service et statistiques anonymisées (intérêt légitime — Art. 6.1.f)\n• Envoi de notifications liées à votre formation (consentement — Art. 6.1.a)"
        },
        {
          id: "duree",
          title: "4. Durée de conservation",
          text: "• Données de compte actif : pendant toute la durée de la relation contractuelle\n• Après suppression du compte : pseudonymisation immédiate, les données de facturation sont conservées 10 ans (obligation légale, Art. L123-22 Code de commerce)\n• Cookies de session : 7 jours (renouvelés automatiquement)\n• Logs serveur : 30 jours maximum"
        },
        {
          id: "sous_traitants",
          title: "5. Sous-traitants et transferts",
          text: "• Stripe Inc. (paiements par carte bancaire) — DPA disponible sur stripe.com/fr/legal/dpa — transfert encadré par les clauses contractuelles types (CCT) de la Commission européenne\n• Hébergeur (Render.com) — serveurs en Union Européenne ou sous garanties adéquates\nAucune donnée n'est vendue à des tiers."
        },
        {
          id: "droits",
          title: "6. Vos droits",
          text: "Conformément au RGPD, vous disposez des droits suivants, exerceables depuis votre espace 'Mon compte' ou par e-mail à privacy@tutorisk.com :\n• Droit d'accès (Art. 15) : consulter les données vous concernant\n• Droit de rectification (Art. 16) : corriger vos informations\n• Droit à l'effacement (Art. 17) : supprimer votre compte (pseudonymisation)\n• Droit à la portabilité (Art. 20) : exporter vos données en JSON\n• Droit d'opposition (Art. 21) : vous opposer aux traitements basés sur l'intérêt légitime\n• Droit de retirer votre consentement à tout moment\n\nVous avez également le droit d'introduire une réclamation auprès de la CNIL (cnil.fr)."
        },
        {
          id: "cookies",
          title: "7. Cookies",
          text: "TutoRisk utilise un seul cookie de session (tutorisk_refresh) strictement nécessaire au maintien de votre connexion. Ce cookie est httpOnly (inaccessible au JavaScript), Secure (HTTPS uniquement en production), et SameSite=Lax. Il n'existe pas de cookie analytique, publicitaire ou de tracking. Aucun consentement aux cookies n'est requis car ce cookie est strictement nécessaire au fonctionnement du service (Art. 82 Loi Informatique et Libertés)."
        },
        {
          id: "contact",
          title: "8. Contact DPO",
          text: "Pour toute question relative à vos données personnelles : privacy@tutorisk.com"
        }
      ]
    }
  });
}

function legalNotice(req, res) {
  res.json({
    title: "Mentions légales — TutoRisk",
    content: {
      editeur: "TutoRisk SAS\nSiège social : France\nContact : contact@tutorisk.com",
      hebergeur: "Render.com\n525 Brannan St Suite 300\nSan Francisco, CA 94107, USA",
      dpo: "privacy@tutorisk.com",
      cgu_version: CURRENT_TERMS_VERSION,
    }
  });
}

module.exports = { privacyPolicy, legalNotice };
