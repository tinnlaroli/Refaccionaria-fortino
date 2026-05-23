FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY drizzle.config.ts tsconfig.json ./
COPY src ./src
COPY migrations ./migrations

CMD ["npx", "tsx", "src/migrate.ts"]
