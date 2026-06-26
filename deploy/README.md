# Deploy — Refaccionaria Fortino

## Requisitos

- VPS con Ubuntu 24.04 LTS
- Acceso root
- Dominio (opcional, recomendado para SSL)

## Uso

### 1. Setup del VPS (una vez)

```bash
# Conéctate como root
ssh root@<IP_DEL_VPS>

# Sube los scripts o clona el repo
# Opcional: pasa DOMAIN para SSL automático
DOMAIN=refaccionaria.com bash deploy/setup-vps.sh
```

### 2. Deploy de la app

```bash
# Como usuario deploy
ssh deploy@<IP_DEL_VPS>

# Clona el repo (si no lo hiciste antes)
git clone <URL_DEL_REPO> /opt/refaccionaria

# Ejecuta deploy
cd /opt/refaccionaria
bash deploy/deploy-app.sh
```

### 3. Próximos deploys

```bash
ssh deploy@<IP_DEL_VPS>
cd /opt/refaccionaria
git pull
bash deploy/deploy-app.sh
```

## Estructura

```
deploy/
├── setup-vps.sh                  # Script de aprovisionamiento (root)
├── deploy-app.sh                 # Script de deploy (usuario deploy)
├── .env.production               # Template de variables de entorno
├── configs/
│   ├── nginx-gateway.conf        # Configuración de nginx
│   ├── postgresql-tuning.conf    # Tuning de PostgreSQL para RAM baja
│   └── ecosystem.config.cjs      # Configuración de PM2
└── README.md
```

## Ajustes para más RAM

Si cambias a un VPS con más RAM, ajusta `configs/postgresql-tuning.conf`:
- 4 GB: `shared_buffers = 512MB`, `effective_cache_size = 1GB`
- 8 GB: `shared_buffers = 1GB`, `effective_cache_size = 2GB`
