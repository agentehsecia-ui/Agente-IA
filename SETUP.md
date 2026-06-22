# SIGACP — Guía de puesta en marcha

## Paso 1: Crear proyecto en Supabase

1. Ir a https://supabase.com → New Project
2. Anotar la **URL** y las **API Keys** (anon + service_role)
3. En el **SQL Editor**, pegar todo el contenido de `db/schema.sql` y ejecutar

## Paso 2: Configurar variables de entorno

Copiar `.env.example` a `.env.local` y llenar:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
RESEND_API_KEY=re_xxxxx (obtener en https://resend.com)
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=una-clave-secreta-para-el-cron
```

## Paso 3: Crear el primer usuario admin

En el SQL Editor de Supabase, después de crear un usuario manualmente en Authentication:

```sql
INSERT INTO public.perfiles (id, email, nombre, rol)
VALUES ('uuid-del-usuario', 'admin@empresa.com', 'Administrador', 'admin');
```

O bien, temporalmente ajustar la API de admin y crear usuarios desde la interfaz.

## Paso 4: Instalar y ejecutar

```bash
cd SIGACP
npm install
npm run dev
```

Abrir http://localhost:3000

## Paso 5: Desplegar en Vercel

1. Subir a GitHub: `git init && git add . && git commit -m "initial" && git push`
2. Ir a https://vercel.com → Import → seleccionar el repo
3. Agregar las variables de entorno en Settings → Environment Variables
4. Deploy automático

## Paso 6: Configurar cron de escalamiento

En Vercel, ir a Settings → Crons y agregar:

```json
{
  "crons": [
    {
      "path": "/api/cron/escalamiento",
      "schedule": "0 8 * * *"
    }
  ]
}
```

O crear archivo `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/escalamiento",
      "schedule": "0 13 * * *"
    }
  ]
}
```

(0 13 UTC = 8am Colombia)

El cron necesita el header `Authorization: Bearer CRON_SECRET`.
Vercel lo envía automáticamente si configuras `CRON_SECRET` en las variables de entorno.

## Estructura de archivos

```
SIGACP/
├── db/schema.sql          ← Pegar en Supabase SQL Editor
├── src/
│   ├── app/
│   │   ├── page.tsx           ← Login
│   │   ├── dashboard/         ← Dashboard ejecutivo
│   │   ├── solicitudes/       ← Crear y listar solicitudes
│   │   ├── aprobaciones/      ← Centro de aprobaciones (Gerencia)
│   │   ├── pagos/             ← Cola de pagos (Gerencia)
│   │   ├── seguridad-social/  ← Módulo seguridad social
│   │   ├── nomina/            ← Módulo nómina
│   │   ├── auditoria/         ← Log de auditoría
│   │   ├── admin/             ← Gestión de usuarios
│   │   └── api/               ← API routes
│   ├── components/            ← Componentes reutilizables
│   └── lib/                   ← Utilidades, auth, supabase, email
└── public/
```
