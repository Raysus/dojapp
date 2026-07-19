#!/bin/sh
set -e

echo "[entrypoint] Applying migrations..."
npx prisma migrate deploy

# Never seed production by accident — requires explicit dual flag.
if [ "${RUN_SEED}" = "true" ]; then
  if [ "${NODE_ENV}" = "production" ] && [ "${ALLOW_PROD_SEED}" != "true" ]; then
    echo "[entrypoint] Refusing to seed: NODE_ENV=production without ALLOW_PROD_SEED=true"
    exit 1
  fi
  echo "[entrypoint] Seeding demo data..."
  # Prefer compiled/JS seed via prisma when configured; falls back to package.json prisma.seed
  npx prisma db seed
fi

echo "[entrypoint] Starting NestJS API on port ${PORT:-3000}..."
exec node dist/src/main.js
