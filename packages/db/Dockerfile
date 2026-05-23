FROM node:22-slim

WORKDIR /app

COPY package.json ./
RUN npm install

COPY drizzle.config.ts tsconfig.json ./
COPY src ./src
COPY migrations ./migrations

CMD ["npm", "run", "migrate"]
