#!/bin/sh
set -e

echo "[entrypoint] Applying migrations..."
npx prisma migrate deploy

if [ "${RUN_SEED}" = "true" ]; then
  echo "[entrypoint] Seeding demo data..."
  npx ts-node --project tsconfig.json --transpile-only prisma/seed.ts
fi

echo "[entrypoint] Starting NestJS API on port ${PORT:-3000}..."
exec node dist/src/main.js
