#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  TutoRisk — Script de déploiement automatique VPS
#  Usage : bash deploy.sh
#  Testé sur Ubuntu 24.04 LTS
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

RED='\033[0;31m'; GRN='\033[0;32m'; YLW='\033[1;33m'; CYN='\033[0;36m'; BLD='\033[1m'; RST='\033[0m'
ok()  { echo -e "${GRN}✓${RST}  $*"; }
inf() { echo -e "${CYN}→${RST}  $*"; }
hdr() { echo -e "\n${BLD}${CYN}━━━  $*  ━━━${RST}"; }
err() { echo -e "${RED}✗${RST}  $*"; exit 1; }

GH_USER="tutorisk"
DOMAIN="tutorisk.fr"
EMAIL="contact@tutorisk.com"
APP_DIR="/var/www/tutorisk-backend"
SITE_DIR="/var/www/tutorisk-site"
DB_NAME="tutorisk"
DB_USER="tutorisk"
DB_PASS=$(openssl rand -hex 16)
JWT_ACCESS=$(openssl rand -hex 32)
JWT_REFRESH=$(openssl rand -hex 32)
VIDEO_SECRET=$(openssl rand -hex 32)

echo ""
echo -e "${BLD}${CYN}╔══════════════════════════════════════════════════════╗${RST}"
echo -e "${BLD}${CYN}║       TutoRisk — Déploiement automatique VPS         ║${RST}"
echo -e "${BLD}${CYN}╚══════════════════════════════════════════════════════╝${RST}"
echo ""

# ── 1. Mise à jour système ────────────────────────────────────
hdr "1 / 8 — Mise à jour du système"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl wget git build-essential ufw nginx certbot python3-certbot-nginx
ok "Système à jour"

# ── 2. Node.js 22 LTS ────────────────────────────────────────
hdr "2 / 8 — Installation de Node.js 22 LTS"
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - > /dev/null 2>&1
  apt-get install -y -qq nodejs
fi
ok "Node.js $(node -v) — npm $(npm -v)"

# ── 3. PostgreSQL 16 ─────────────────────────────────────────
hdr "3 / 8 — Installation de PostgreSQL"
if ! command -v psql &>/dev/null; then
  apt-get install -y -qq postgresql postgresql-contrib
fi
systemctl enable postgresql --quiet
systemctl start postgresql
sleep 2

# Créer base et utilisateur
su postgres -c "psql -c \"CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';\"" 2>/dev/null || true
su postgres -c "psql -c \"CREATE DATABASE $DB_NAME OWNER $DB_USER;\"" 2>/dev/null || true
su postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;\"" 2>/dev/null || true
ok "PostgreSQL configuré — base '$DB_NAME'"

# ── 4. Backend Node.js ────────────────────────────────────────
hdr "4 / 8 — Déploiement du backend LCMS"
rm -rf "$APP_DIR"
git clone --quiet "https://github.com/$GH_USER/tutorisk-backend.git" "$APP_DIR"
cd "$APP_DIR"

# Créer le .env
cat > .env << ENV
PORT=4000
NODE_ENV=production
FRONTEND_URL=https://$DOMAIN
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME
JWT_ACCESS_SECRET=$JWT_ACCESS
JWT_REFRESH_SECRET=$JWT_REFRESH
VIDEO_SIGNING_SECRET=$VIDEO_SECRET
STRIPE_SECRET_KEY=sk_test_REMPLACEZ_PAR_VOTRE_CLE_STRIPE
STRIPE_WEBHOOK_SECRET=whsec_REMPLACEZ_PAR_VOTRE_SECRET_WEBHOOK
CONTACT_EMAIL=$EMAIL
PROTECTED_MEDIA_DIR=/var/www/tutorisk-media
ENV

mkdir -p /var/www/tutorisk-media
npm install --quiet --production
ok "Dépendances installées"

# Migration base de données
inf "Migration de la base de données..."
npm run migrate
npm run seed
ok "Base de données initialisée"

# ── 5. Service systemd ────────────────────────────────────────
hdr "5 / 8 — Configuration du service système"
cat > /etc/systemd/system/tutorisk.service << SERVICE
[Unit]
Description=TutoRisk LCMS Backend
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=$APP_DIR/.env
StandardOutput=journal
StandardError=journal
SyslogIdentifier=tutorisk

[Install]
WantedBy=multi-user.target
SERVICE

chown -R www-data:www-data "$APP_DIR" /var/www/tutorisk-media
systemctl daemon-reload
systemctl enable tutorisk --quiet
systemctl start tutorisk
sleep 3
systemctl is-active tutorisk > /dev/null && ok "Service tutorisk démarré" || { journalctl -u tutorisk -n 20; err "Le service n'a pas démarré"; }

# ── 6. Site corporate statique ────────────────────────────────
hdr "6 / 8 — Déploiement du site corporate"
rm -rf "$SITE_DIR"
git clone --quiet "https://github.com/$GH_USER/tutorisk-site.git" "$SITE_DIR"

# Mettre à jour l'URL du LCMS dans config.js
sed -i "s|https://formation.tutorisk.com|https://lcms.$DOMAIN|g" "$SITE_DIR/js/config.js"
chown -R www-data:www-data "$SITE_DIR"
ok "Site corporate déployé dans $SITE_DIR"

# ── 7. Nginx ─────────────────────────────────────────────────
hdr "7 / 8 — Configuration Nginx"
cat > /etc/nginx/sites-available/tutorisk << NGINX
# Site corporate — tutorisk.fr
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    root $SITE_DIR;
    index index.html;
    charset utf-8;

    # Gzip
    gzip on;
    gzip_types text/html text/css application/javascript image/svg+xml;
    gzip_min_length 1024;

    # Cache fichiers statiques
    location ~* \.(css|js|svg|png|jpg|ico|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Pages HTML
    location / {
        try_files \$uri \$uri.html \$uri/ /index.html;
    }

    # Redirection /catalogue vers le LCMS
    location = /catalogue {
        return 301 https://lcms.$DOMAIN;
    }
}

# LCMS — lcms.tutorisk.fr → backend Node.js
server {
    listen 80;
    server_name lcms.$DOMAIN;

    client_max_body_size 510M;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/tutorisk /etc/nginx/sites-enabled/tutorisk
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
ok "Nginx configuré"

# ── 8. Pare-feu ───────────────────────────────────────────────
hdr "8 / 8 — Pare-feu et sécurité"
ufw --force reset > /dev/null 2>&1
ufw default deny incoming > /dev/null
ufw default allow outgoing > /dev/null
ufw allow 22/tcp > /dev/null   # SSH
ufw allow 80/tcp > /dev/null   # HTTP
ufw allow 443/tcp > /dev/null  # HTTPS
ufw --force enable > /dev/null
ok "Pare-feu configuré (22, 80, 443)"

# ── Résumé ────────────────────────────────────────────────────
echo ""
echo -e "${GRN}${BLD}╔══════════════════════════════════════════════════════╗${RST}"
echo -e "${GRN}${BLD}║            ✅ Déploiement terminé !                  ║${RST}"
echo -e "${GRN}${BLD}╚══════════════════════════════════════════════════════╝${RST}"
echo ""
echo -e "  🌐 Site corporate  → ${BLD}http://$DOMAIN${RST}"
echo -e "  🎓 LCMS            → ${BLD}http://lcms.$DOMAIN${RST}"
echo -e "  🔒 SSL à configurer → voir instructions ci-dessous"
echo ""
echo -e "${YLW}${BLD}⚠  ÉTAPES MANUELLES RESTANTES :${RST}"
echo ""
echo -e "  1. Pointez votre DNS :"
echo -e "     $DOMAIN        → A → 178.170.25.169"
echo -e "     www.$DOMAIN    → A → 178.170.25.169"
echo -e "     lcms.$DOMAIN   → A → 178.170.25.169"
echo ""
echo -e "  2. Une fois le DNS propagé, activez SSL :"
echo -e "     ${BLD}certbot --nginx -d $DOMAIN -d www.$DOMAIN -d lcms.$DOMAIN --email $EMAIL --agree-tos --non-interactive${RST}"
echo ""
echo -e "  3. Comptes de démonstration (mot de passe : Demo1234!) :"
echo -e "     Admin     : s.martin@tutorisk.com"
echo -e "     Pédagogue : m.dubois@tutorisk.com"
echo -e "     Apprenant : j.bernard@acmegroup.fr"
echo ""
echo -e "${CYN}Logs du service : journalctl -u tutorisk -f${RST}"
echo ""
