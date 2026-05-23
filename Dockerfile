FROM node:22-slim AS builder

WORKDIR /app

COPY package.json ./
COPY db/package.json ./db/
COPY db ./db

RUN npm install --prefix db && npm run build --prefix db

FROM node:22-slim

WORKDIR /app

COPY package.json ./
COPY db/package.json ./db/
COPY --from=builder /app/db/dist ./db/dist
COPY --from=builder /app/db/node_modules ./db/node_modules
COPY src ./src

RUN npm install --omit=dev

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "src/index.js"]
