#!/usr/bin/env bash
# Detecta IP LAN y actualiza VITE_API_URL_ANDROID (equivalente a setup-phone.ps1)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env"
PORT="${API_PORT:-3000}"

ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
if [ -z "$ip" ]; then
  ip="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src"){print $(i+1); exit}}')"
fi
if [ -z "$ip" ]; then
  echo "No se pudo detectar IP LAN." >&2
  exit 1
fi

url="http://${ip}:${PORT}"
echo "IP detectada: $ip"
echo "VITE_API_URL_ANDROID=$url"

touch "$ENV_FILE"
if grep -q '^VITE_API_URL_ANDROID=' "$ENV_FILE"; then
  sed -i "s|^VITE_API_URL_ANDROID=.*|VITE_API_URL_ANDROID=$url|" "$ENV_FILE"
else
  echo "VITE_API_URL_ANDROID=$url" >> "$ENV_FILE"
fi

echo "Listo. Reinicia el frontend / rebuild APK para aplicar."
echo "Tip LAN HTTP: CAP_ALLOW_MIXED_CONTENT=true al generar Capacitor."
