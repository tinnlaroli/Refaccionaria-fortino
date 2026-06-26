#!/usr/bin/env bash
# =============================================================================
#  Refaccionaria Fortino — Setup VPS (Ubuntu 24.04)
#  Ejecutar como root en un VPS limpio.
#  Uso: sudo bash setup-vps.sh
# =============================================================================
set -euo pipefail

# ── Colores ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

# ── Verificar root ───────────────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
    error "Este script debe ejecutarse como root (sudo bash setup-vps.sh)"
    exit 1
fi

# ── Variables ────────────────────────────────────────────────────────────────
NODE_VERSION="22"
PG_VERSION="16"
DEPLOY_USER="deploy"
DEPLOY_HOME="/home/${DEPLOY_USER}"
REPO_DIR="/opt/refaccionaria"
DOMAIN="${DOMAIN:-}"  # Opcional: ej. DOMAIN=refaccionaria.com bash setup-vps.sh

# ── 1. Sistema ───────────────────────────────────────────────────────────────
info "1/9  Actualizando sistema..."
apt-get update -qq && apt-get upgrade -y -qq

info "2/9  Instalando paquetes básicos..."
apt-get install -y -qq \
    curl wget gnupg ca-certificates \
    ufw git unzip htop \
    nginx certbot python3-certbot-nginx \
    postgresql-${PG_VERSION} postgresql-client-${PG_VERSION}

# ── 3. Firewall ──────────────────────────────────────────────────────────────
info "3/9  Configurando firewall (UFW)..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

# ── 4. Node.js 22 ────────────────────────────────────────────────────────────
info "4/9  Instalando Node.js ${NODE_VERSION}..."
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y -qq nodejs
fi
info "     Node $(node -v) — npm $(npm -v)"

# ── 5. PostgreSQL ────────────────────────────────────────────────────────────
info "5/9  Aplicando tuning de PostgreSQL para RAM baja..."
PG_CONF_DIR="/etc/postgresql/${PG_VERSION}/main/conf.d"
mkdir -p "$PG_CONF_DIR"
cp "$(dirname "$0")/configs/postgresql-tuning.conf" "${PG_CONF_DIR}/tuning.conf"

# Crear base de datos
info "     Creando BD y usuario..."
su - postgres -c "psql -tc \"SELECT 1 FROM pg_roles WHERE rolname='refaccionaria'\" | grep -q 1 || psql -c \"CREATE USER refaccionaria WITH PASSWORD 'refaccionaria_dev';\"" || true
su - postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname='refaccionaria'\" | grep -q 1 || psql -c \"CREATE DATABASE refaccionaria OWNER refaccionaria;\"" || true

systemctl restart postgresql
systemctl enable postgresql

# ── 6. nginx ─────────────────────────────────────────────────────────────────
info "6/9  Configurando nginx..."
rm -f /etc/nginx/sites-enabled/default
cp "$(dirname "$0")/configs/nginx-gateway.conf" /etc/nginx/conf.d/refaccionaria.conf

# SSL si hay dominio
if [[ -n "${DOMAIN}" ]]; then
    info "     Solicitando certificado SSL para ${DOMAIN}..."
    sed -i "s/server_name _;/server_name ${DOMAIN};/" /etc/nginx/conf.d/refaccionaria.conf
    certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos --email admin@${DOMAIN} || warn "SSL falló, puedes configurarlo después"
fi

nginx -t && systemctl reload nginx
systemctl enable nginx

# ── 7. PM2 ───────────────────────────────────────────────────────────────────
info "7/9  Instalando PM2..."
npm install -g pm2
pm2 startup systemd -u root --hp /root
pm2 save

# ── 8. Usuario deploy ────────────────────────────────────────────────────────
info "8/9  Creando usuario ${DEPLOY_USER}..."
if ! id "${DEPLOY_USER}" &>/dev/null; then
    useradd -m -s /bin/bash -G sudo "${DEPLOY_USER}"
fi

# Directorio de logs
mkdir -p /var/log/refaccionaria
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" /var/log/refaccionaria

# Permitir a deploy gestionar PM2
env PATH="$PATH" pm2 startup systemd -u "${DEPLOY_USER}" --hp "${DEPLOY_HOME}" 2>/dev/null || true

# sudo sin contraseña para deploy (solo reload nginx + systemctl services)
echo "${DEPLOY_USER} ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t, /usr/bin/systemctl reload nginx, /usr/bin/systemctl restart nginx, /usr/bin/systemctl reload postgresql, /usr/bin/systemctl restart postgresql" | tee /etc/sudoers.d/deploy-nginx

# ── 9. Directorio de la app ──────────────────────────────────────────────────
info "9/9  Preparando directorio de la aplicación..."
mkdir -p "${REPO_DIR}"
chown "${DEPLOY_USER}:${DEPLOY_USER}" "${REPO_DIR}"

# Directorios para frontends
mkdir -p /var/www/landing /var/www/pos
chown "${DEPLOY_USER}:${DEPLOY_USER}" /var/www/landing /var/www/pos

# ── Resumen ──────────────────────────────────────────────────────────────────
echo ""
info "═══════════════════════════════════════════════════════════════"
info "  Setup completado."
info ""
info "  Siguiente paso:"
info "    ssh ${DEPLOY_USER}@<IP_DEL_VPS>"
info "    git clone <REPO_URL> ${REPO_DIR}"
info "    cd ${REPO_DIR} && bash deploy/deploy-app.sh"
info ""
info "  Acceso web (sin dominio): http://<IP_DEL_VPS>"
info "═══════════════════════════════════════════════════════════════"
