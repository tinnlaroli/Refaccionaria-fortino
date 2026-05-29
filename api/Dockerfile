FROM node:22-slim AS builder

WORKDIR /app

# API (package.json) + su código JS
COPY api/package.json ./package.json
COPY api/package-lock.json ./package-lock.json
COPY api/src ./src

# Base de datos local que usa el backend (file:./db)
COPY bd ./db

# npm install ejecuta postinstall (build:db)
RUN npm install

FROM node:22-slim

WORKDIR /app

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/db ./db
COPY --from=builder /app/src ./src

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "src/index.js"]
