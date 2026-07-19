#!/usr/bin/env bash
# Levanta solo PostgreSQL en Docker (backend/frontend en local)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if ! docker info >/dev/null 2>&1; then
  echo "Docker no está disponible. Inicia el daemon e inténtalo de nuevo." >&2
  exit 1
fi

echo "Levantando PostgreSQL..."
cd "$ROOT"
docker compose up -d

echo "Esperando a que Postgres acepte conexiones..."
for _ in $(seq 1 60); do
  if docker compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
    echo "Postgres listo."
    docker compose ps
    exit 0
  fi
  sleep 1
done

echo "Postgres no respondió a tiempo." >&2
exit 1
