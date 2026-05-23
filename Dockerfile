FROM node:22-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/
COPY packages/db ./packages/db
COPY apps/api ./apps/api

RUN npm install

WORKDIR /app/packages/db
RUN npm run build

WORKDIR /app/apps/api
RUN npm run build

FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/

RUN npm install --omit=dev --workspace=@refaccionaria/api --workspace=@refaccionaria/db

COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

WORKDIR /app/apps/api

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]
