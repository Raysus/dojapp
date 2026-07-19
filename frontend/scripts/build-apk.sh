#!/usr/bin/env bash
# Build web + sync Capacitor + APK debug (Linux)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Building web..."
npm run build

echo "Capacitor sync android..."
npx cap sync android

GRADLEW="$ROOT/android/gradlew"
if [ ! -x "$GRADLEW" ]; then
  echo "No se encontró android/gradlew. ¿Corriste 'npx cap add android'?" >&2
  exit 1
fi

echo "Assemble debug APK..."
cd "$ROOT/android"
./gradlew assembleDebug

APK="$ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
echo "APK: $APK"
