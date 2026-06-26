#!/usr/bin/env bash
# =============================================================================
#  Refaccionaria Fortino — Deploy de la aplicación
#  Ejecutar como usuario 'deploy' después de setup-vps.sh.
#  Uso: bash deploy-app.sh
# =============================================================================
set -euo pipefail

# ── Colores ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

# ── Rutas ────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"  # asume que deploy/ está dentro del repo
API_DIR="${REPO_DIR}/api"
BD_DIR="${REPO_DIR}/bd"
UX_DIR="${REPO_DIR}/ux"
LANDING_DIR="${REPO_DIR}/landing"

DEPLOY_ENV="${SCRIPT_DIR}/.env.production"
API_ENV="${API_DIR}/.env"
BD_ENV="${BD_DIR}/.env"

POS_DEST="/var/www/pos"
LANDING_DEST="/var/www/landing"

# ── Verificaciones iniciales ─────────────────────────────────────────────────
info "1/9  Verificando requisitos..."

for cmd in node npm git; do
    if ! command -v "$cmd" &>/dev/null; then
        error "No se encuentra '$cmd'. Ejecuta primero setup-vps.sh"
        exit 1
    fi
done

# Verificar que estamos dentro del repo
if [[ ! -d "${API_DIR}" ]] || [[ ! -d "${BD_DIR}" ]]; then
    error "No se encontró el proyecto. Asegúrate de ejecutar este script desde el repositorio clonado."
    error "  Falta: ${API_DIR} o ${BD_DIR}"
    exit 1
fi

# ── 2. Variables de entorno ───────────────────────────────────────────────────
info "2/9  Configurando .env ..."

if [[ ! -f "${DEPLOY_ENV}" ]]; then
    error "No se encuentra ${DEPLOY_ENV}"
    exit 1
fi

# Generar JWT_SECRET si no se ha cambiado
JWT_SECRET="$(grep '^JWT_SECRET=' "${DEPLOY_ENV}" | cut -d= -f2-)"
if [[ "${JWT_SECRET}" == "change-me-long-random-secret-min-32-chars" ]]; then
    info "     Generando JWT_SECRET aleatorio..."
    if command -v openssl &>/dev/null; then
        JWT_SECRET="$(openssl rand -hex 32)"
    else
        JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
    fi
fi

# Generar POSTGRES_PASSWORD aleatorio
PG_PASS="$(grep '^POSTGRES_PASSWORD=' "${DEPLOY_ENV}" | cut -d= -f2-)"
if [[ "${PG_PASS}" == "refaccionaria_dev" ]]; then
    info "     Generando POSTGRES_PASSWORD aleatorio..."
    PG_PASS="$(openssl rand -hex 16)"
fi

# Escribir .env de la BD
cat > "${BD_ENV}" <<EOF
DATABASE_URL=postgresql://refaccionaria:${PG_PASS}@localhost:5432/refaccionaria
EOF

# Escribir .env de la API
cat > "${API_ENV}" <<EOF
PORT=3000
DATABASE_URL=postgresql://refaccionaria:${PG_PASS}@localhost:5432/refaccionaria
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d
EOF

chmod 600 "${BD_ENV}" "${API_ENV}"
info "     .env generado (secretos protegidos)"

# ── 3. Base de datos local (bd/) ──────────────────────────────────────────────
info "3/9  Instalando dependencias del paquete de BD..."
cd "${BD_DIR}"
npm install --no-fund --no-audit
npm run build
info "     BD compilada"

# ── 4. Enlazar bd/ → api/db ──────────────────────────────────────────────────
info "4/9  Vinculando bd/ como api/db/ ..."
if [[ -L "${API_DIR}/db" ]] || [[ -d "${API_DIR}/db" ]]; then
    rm -rf "${API_DIR}/db"
fi
ln -s "${BD_DIR}" "${API_DIR}/db"
info "     api/db → bd/"

# ── 5. API ───────────────────────────────────────────────────────────────────
info "5/9  Instalando API..."
cd "${API_DIR}"
npm install --no-fund --no-audit

# ── 6. Migraciones + seed ────────────────────────────────────────────────────
info "6/9  Ejecutando migraciones y seed..."
cd "${BD_DIR}"
npm run migrate 2>&1 | tail -5
info "     Seed insertando datos demo..."
npm run seed 2>&1 | tail -5

# ── 7. Frontend (POS) ────────────────────────────────────────────────────────
info "7/9  Compilando POS..."
cd "${UX_DIR}"
npm install --no-fund --no-audit
npm run build
if [[ -d "${POS_DEST}" ]]; then
    rm -rf "${POS_DEST:?}"/*
    cp -r dist/* "${POS_DEST}/"
    info "     POS copiado a ${POS_DEST}"
else
    warn "     ${POS_DEST} no existe. Crea el directorio o verifica setup-vps.sh"
fi

# ── 8. Frontend (Landing) ────────────────────────────────────────────────────
info "8/9  Compilando Landing..."
cd "${LANDING_DIR}"
npm install --no-fund --no-audit
npm run build
if [[ -d "${LANDING_DEST}" ]]; then
    rm -rf "${LANDING_DEST:?}"/*
    cp -r dist/* "${LANDING_DEST}/"
    info "     Landing copiado a ${LANDING_DEST}"
else
    warn "     ${LANDING_DEST} no existe."
fi

# ── 9. Iniciar API con PM2 ───────────────────────────────────────────────────
info "9/9  Iniciando API con PM2..."
# Copiar ecosystem config
ECOSYSTEM_SRC="${SCRIPT_DIR}/configs/ecosystem.config.cjs"
ECOSYSTEM_DEST="${REPO_DIR}/ecosystem.config.cjs"
cp "${ECOSYSTEM_SRC}" "${ECOSYSTEM_DEST}"

# Ajustar propietario
sudo chown -R "${USER}:${USER}" "${REPO_DIR}" 2>/dev/null || true

# Iniciar / recargar
cd "${REPO_DIR}"
if pm2 show refaccionaria-api &>/dev/null; then
    pm2 reload ecosystem.config.cjs
else
    pm2 start ecosystem.config.cjs
fi
pm2 save

# Recargar nginx
sudo nginx -t && sudo systemctl reload nginx

# ── Resumen ──────────────────────────────────────────────────────────────────
echo ""
info "═══════════════════════════════════════════════════════════════════"
info "  Deploy completado."
info ""
info "  API:    http://localhost:3000/health"
info "  Web:    http://$(curl -s ifconfig.me 2>/dev/null || echo '<IP_DEL_VPS>')"
info "  POS:    http://$(curl -s ifconfig.me 2>/dev/null || echo '<IP_DEL_VPS>')/pos/"
info ""
info "  Para monitorear:"
info "    pm2 status                     # estado de procesos"
info "    pm2 logs refaccionaria-api     # logs en vivo"
info "    pm2 monit                      # dashboard interactivo"
info ""
info "  Credenciales admin:"
info "    admin@fortino.local / admin123"
info "═══════════════════════════════════════════════════════════════════"
