export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://refaccionaria:refaccionaria_dev@localhost:5432/refaccionaria",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "8h",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
};
