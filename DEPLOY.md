# Dojapp — guía rápida

## 1. Probar en tu teléfono (LAN, sin hosting)

### Requisitos
- PC y teléfono en la **misma WiFi**
- Backend y frontend ya configurados

### Pasos automáticos (Windows)
```powershell
cd frontend
npm run setup:phone
```

Eso hace:
- Detecta tu IP local
- Actualiza `VITE_API_URL_ANDROID` en `.env`
- Abre el firewall para el puerto 3000
- Genera la APK debug

### Pasos manuales
1. **Backend**
   ```bash
   cd backend
   npm run start:dev
   ```
2. **Comprueba** desde el teléfono: `http://TU_IP:3000/health`
3. **APK**
   ```bash
   cd frontend
   npm run build:apk
   ```
4. Copia la APK al teléfono:
   `frontend/android/app/build/outputs/apk/debug/app-debug.apk`
5. Instala (permite “orígenes desconocidos” si Android lo pide)
6. Login de prueba: `alumno@dojo.cl` / `123456` o `sensei@dojo.cl` / `123456`

---

## 2. Despliegue mínimo — Opción A (Neon + Railway)

Solo API en la nube. La APK apunta a Railway. **Sin dominio propio** al inicio.

### A. Base de datos — [Neon](https://neon.tech) (gratis)
1. Crear proyecto Postgres
2. Copiar connection string (con `?sslmode=require`)
3. Guardar como `DATABASE_URL`

### B. API — [Railway](https://railway.app) (gratis/trial)
1. New Project → **Deploy from GitHub repo** (o CLI)
2. Seleccionar carpeta **`backend`**
3. Variables de entorno:
   | Variable | Valor |
   |----------|-------|
   | `DATABASE_URL` | string de Neon |
   | `JWT_SECRET` | string aleatorio ≥ 32 chars |
   | `TRUST_PROXY` | `true` |
   | `HOST` | `0.0.0.0` |
   | `PORT` | `3000` |
4. Railway detecta `Dockerfile` y `railway.toml`
5. Tras el deploy, copia la URL pública: `https://xxxx.up.railway.app`

### C. Migraciones y datos iniciales
En Railway → service → **Shell** (o local con DATABASE_URL de Neon):
```bash
npx prisma migrate deploy
npm run deploy:seed
```

> **Seed en producción:** el entrypoint Docker solo corre seed si `RUN_SEED=true`.
> Con `NODE_ENV=production` además exige `ALLOW_PROD_SEED=true` (el seed resetea contraseñas demo).
> Preferible: `npm run deploy:seed` una sola vez desde shell, no dejar `RUN_SEED` permanente.

### D. Conectar la APK
En `frontend/.env.production`:
```env
VITE_API_URL_PRODUCTION=https://xxxx.up.railway.app
```

Rebuild release:
```bash
cd frontend
npm run build:mobile:release
npm run android:release
```

### E. Verificar
- `GET https://xxxx.up.railway.app/health` → `{ "status": "ok" }`
- `GET https://xxxx.up.railway.app/health/db` → DB conectada
- Login desde la APK

---

## 3. Mejoras priorizadas (roadmap)

### Hecho en esta fase
- [x] Banner de conexión (online/offline)
- [x] Botón “Marcar completado” en contenidos (alumno)
- [x] Errores de red más claros en login y dashboards
- [x] Scripts APK + prueba en teléfono
- [x] Docker + Railway + Neon listos
- [x] Sesión segura (401, JWT exp, refresh token 30d / access 2h)
- [x] Métricas sin N+1 + índices Attendance/Grade
- [x] Docker slim (`npm ci --omit=dev`)
- [x] Refresh tokens con rotación/revocación en servidor
- [x] Asistencia offline (borrador local + sync)
- [x] Política de privacidad (`/privacy`)

### Siguiente (beta en dojo real)
- [ ] Keystore de producción (no `dojappdev`) y track Play Store
- [ ] Dominio `api.…` + quitar cleartext en release

### Antes de Play Store
- [ ] Keystore de producción (no `dojappdev`)
- [ ] Política de privacidad
- [ ] Icono/splash definitivos de marca
- [ ] Track de prueba interna en Google Play

### Cuando tengas dominio
- [ ] `api.tudominio.com` → Railway
- [ ] Web admin en Cloudflare Pages (opcional)
- [ ] Quitar `cleartext` / HTTP en builds release

---

## Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `./scripts/docker-up.sh` | Postgres local (Linux/macOS) |
| `./scripts/qa-api.sh` | Smoke QA de la API |
| `npm run setup:phone` | IP + firewall + APK debug |
| `npm run build:apk` | Build web + sync + APK debug |
| `npm run android:release` | APK release firmada |
| `npm run android:keystore` | Crear keystore local |
