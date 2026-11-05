# 🚀 Guía de Deployment en Vercel

Este proyecto usa Next.js con API Routes, por lo que **NO puede** deployarse como sitio estático. Requiere un servidor Node.js.

## ✅ Por qué Vercel

- Creadores de Next.js (soporte nativo completo)
- Deploy automático desde GitHub
- Serverless functions para las API routes
- SSL gratuito
- CDN global
- Zero-config para Next.js

---

## 📋 Pasos para Deploy

### 1. Crear cuenta en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en **"Sign Up"**
3. Conecta con tu cuenta de GitHub

### 2. Importar el Proyecto

1. En el dashboard de Vercel, haz clic en **"Add New Project"**
2. Selecciona **"Import Git Repository"**
3. Busca y selecciona el repositorio `campus-isjc`
4. Haz clic en **"Import"**

### 3. Configurar Variables de Entorno

Antes de deployar, configura estas variables:

**Variables requeridas:**
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_CONTACT_EMAIL=info@sanjosedelcarmen.edu.hn
```

**Dónde configurarlas:**
1. En la pantalla de import, ve a **"Environment Variables"**
2. Agrega cada variable:
   - Name: `RESEND_API_KEY`
   - Value: tu API key de Resend (obtener en [resend.com](https://resend.com/api-keys))
   - Name: `NEXT_PUBLIC_CONTACT_EMAIL`
   - Value: `info@sanjosedelcarmen.edu.hn`

**Acceso a Evaluación Docente (administración):**
```
EVAL_ADMIN_EMAILS=admin@example.com,otra-persona@example.com
```

- Lista separada por comas de los correos que pueden entrar a `/evaluacion-docente-admin`. No distingue mayúsculas y se ignoran los espacios.
- Solo se aceptan coincidencias exactas de cuentas con el correo confirmado en Supabase Auth.
- Es una variable solo de servidor: nunca le agregues el prefijo `NEXT_PUBLIC_` y no subas correos reales al repositorio.

> ⚠️ **Configúrala en Vercel antes de deployar este código.** Si falta o está vacía se deniega el acceso a todos, y los administradores actuales quedan bloqueados. Después de cambiarla hay que redeployar.

### 4. Deploy

1. Haz clic en **"Deploy"**
2. Espera 2-3 minutos mientras Vercel:
   - Instala dependencias
   - Ejecuta el build
   - Crea las serverless functions
   - Despliega a CDN global

### 5. Configurar Dominio (Opcional)

1. Una vez deployado, ve a **"Settings"** → **"Domains"**
2. Agrega tu dominio personalizado (ej: `www.sanjosedelcarmen.edu.hn`)
3. Sigue las instrucciones para configurar DNS

---

## 🔄 Deploy Automático

Una vez configurado:

- Cada **push a `main`** → Deploy automático a producción
- Cada **pull request** → Preview deployment para testing
- Rollback instantáneo desde el dashboard

---

## 📧 Configuración de Email (Resend)

### Obtener API Key

1. Ve a [resend.com](https://resend.com)
2. Crea una cuenta (gratis hasta 3,000 emails/mes)
3. Ve a **"API Keys"** y crea una nueva
4. Copia la key y agrégala en Vercel

### Verificar Dominio (Opcional pero Recomendado)

Para enviar emails desde `@sanjosedelcarmen.edu.hn`:

1. En Resend, ve a **"Domains"**
2. Agrega `sanjosedelcarmen.edu.hn`
3. Configura los registros DNS que te proporcione Resend:
   - SPF
   - DKIM
   - DMARC

Hasta que verifiques el dominio, los emails se enviarán desde `onboarding@resend.dev`

---

## 🛠️ Comandos Útiles

### Build Local (Vercel CLI)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy a preview
vercel

# Deploy a producción
vercel --prod
```

### Testing Local

```bash
# Development
npm run dev

# Build de producción (local)
npm run build
npm start
```

---

## ⚠️ Notas Importantes

1. **No usar GitHub Pages**: GitHub Pages solo soporta sitios estáticos. Este proyecto necesita servidor para las API routes.

2. **Variables de Entorno**: 
   - Nunca subas `.env.local` al repositorio
   - Configura las variables en Vercel dashboard
   - Para desarrollo local, usa `.env.local`

3. **API Routes**:
   - `/api/contact` - Formulario de contacto
   - `/api/job-application` - Solicitud de empleo
   - Ambas requieren `RESEND_API_KEY` configurada

4. **Alternativas a Vercel**:
   - Netlify (también soporta Next.js)
   - Railway
   - Render
   - AWS Amplify
   - Pero Vercel es la opción más simple para Next.js

---

## 🎓 Panel de Admisiones (`/admisiones-admin`)

El panel usa la sesión de Supabase Auth del usuario y los permisos por rol de la base de datos (RLS). No usa la llave de servicio.

### Migraciones

Las migraciones de `supabase/migrations/` se aplican a producción con `psql` como `postgres`, en una sola transacción, usando la URL del *Session pooler*. No uses `supabase db push`: producción no tiene historial de migraciones de la CLI.

- `20261104000200_add_admissions_prospect_deletion_and_assignee_guard.sql`: borrado de solicitudes (solo `admin`) y validación del responsable.
- `20261105000100_add_admissions_accent_insensitive_search.sql`: búsqueda sin acentos. Instala `unaccent` en el esquema `extensions`.

### Roles

| Rol | Ver | Editar y asignar | Borrar |
|---|---|---|---|
| `admin` | ✅ | ✅ | ✅ |
| `admissions_manager` | ✅ | ✅ | ❌ |
| `admissions_agent` | ✅ | ✅ | ❌ |
| `admissions_viewer` | ✅ | ❌ | ❌ |

### Dar acceso a una persona

1. En Supabase: **Authentication → Users → Add user → Create new user**, con su correo, una contraseña temporal y **Auto Confirm User** activado. Si la persona ya tiene cuenta (por ejemplo, en Evaluación Docente), omite este paso: usará la misma contraseña.
2. En el **SQL Editor**, crea su perfil:
   ```sql
   insert into public.admissions_profiles (id, full_name, role, is_active)
   select id, 'Nombre Apellido', 'admissions_agent', true
   from auth.users
   where lower(email) = lower('correo@ejemplo.com');
   ```
   Debe responder `INSERT 0 1`. Si responde `INSERT 0 0`, el correo no existe en Auth.
3. La persona entra en `/admisiones-admin/login`.

Para **quitar el acceso**, desactiva el perfil (no lo borres, porque puede tener solicitudes asignadas):
```sql
update public.admissions_profiles set is_active = false
where id = (select id from auth.users where lower(email) = lower('correo@ejemplo.com'));
```

No subas correos reales al repositorio.

### Solicitudes de eliminación de datos

El aviso de privacidad permite a las familias pedir que se eliminen sus datos. Un `admin` lo hace desde la ficha de la solicitud con **Eliminar solicitud**. Si el encargado tiene otras solicitudes, borra cada una.

---

## 🐛 Troubleshooting

### Error: "Missing API key"
- Verifica que `RESEND_API_KEY` esté configurada en Vercel
- Redeploya el proyecto después de agregar variables

### Error: "Page [...not_found] missing generateStaticParams"
- Ya resuelto: eliminamos el workflow de GitHub Pages
- Usa Vercel u otra plataforma con soporte para SSR

### Un administrador no puede entrar a Evaluación Docente
- Verifica que su correo esté en `EVAL_ADMIN_EMAILS` en Vercel y que esté confirmado en Supabase Auth
- Redeploya el proyecto después de cambiar la variable

### Una persona no puede entrar al Panel de Admisiones
- "Credenciales inválidas": revisa el correo y la contraseña en Supabase Auth
- "Esta cuenta no tiene acceso a este módulo": falta su fila en `admissions_profiles`, o tiene `is_active = false`
- "El servicio no está disponible": Supabase no respondió; intenta de nuevo y revisa los logs de Vercel

### Formularios no envían emails
- Verifica `RESEND_API_KEY` en Vercel dashboard
- Revisa logs en Vercel: **Functions** → selecciona la API route
- Verifica límites en Resend (3,000 emails/mes gratis)

---

## 📞 Soporte

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Next.js Docs: [nextjs.org/docs](https://nextjs.org/docs)
- Resend Docs: [resend.com/docs](https://resend.com/docs)
