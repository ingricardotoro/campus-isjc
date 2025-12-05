# Guía Rápida: Configuración del Formulario de Contacto

## 🚀 Pasos para Activar el Formulario

### 1. Configurar Supabase

1. **Crear cuenta en Supabase**
   - Ve a [https://supabase.com](https://supabase.com)
   - Crea una cuenta gratuita
   - Crea un nuevo proyecto

2. **Crear la tabla de contacto**
   - En tu proyecto de Supabase, ve a "SQL Editor"
   - Copia y pega el siguiente código:

```sql
-- Crear la tabla de contacto
CREATE TABLE contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

-- Crear índices
CREATE INDEX idx_contact_created_at ON contact_submissions(created_at DESC);
CREATE INDEX idx_contact_email ON contact_submissions(email);

-- Habilitar Row Level Security
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Permitir inserción desde el cliente
CREATE POLICY "Allow public insert" ON contact_submissions
  FOR INSERT TO anon
  WITH CHECK (true);

-- Permitir lectura solo a usuarios autenticados
CREATE POLICY "Allow authenticated read" ON contact_submissions
  FOR SELECT TO authenticated
  USING (true);
```

3. **Obtener las credenciales**
   - Ve a "Settings" → "API"
   - Copia tu `Project URL`
   - Copia tu `anon/public key`

### 2. Configurar Variables de Entorno

1. Abre el archivo `.env.local` en la raíz del proyecto
2. Reemplaza los valores con tus credenciales:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_aqui
NEXT_PUBLIC_CONTACT_EMAIL=contacto@isjc.edu.hn
```

### 3. Reiniciar el Servidor

```bash
npm run dev
```

## ✅ ¡Listo!

El formulario de contacto ya está funcionando. Los mensajes se guardarán automáticamente en Supabase.

## 📧 Configurar Envío de Emails (Opcional)

Para recibir notificaciones por email cuando alguien envíe el formulario:

### Opción 1: Usar Resend (Recomendado)

1. **Crear cuenta en Resend**
   - Ve a [https://resend.com](https://resend.com)
   - Crea una cuenta gratuita (100 emails/día gratis)

2. **Obtener API Key**
   - En el dashboard, ve a "API Keys"
   - Crea una nueva API Key
   - Cópiala

3. **Instalar Resend**
   ```bash
   npm install resend
   ```

4. **Agregar a .env.local**
   ```env
   RESEND_API_KEY=tu_api_key_de_resend
   ```

5. **Actualizar el archivo API route**
   - Abre `src/app/api/contact/route.ts`
   - Agrega este código después de guardar en Supabase:

```typescript
import { Resend } from 'resend';

// ... código existente ...

// Después de guardar en Supabase, agregar:
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'ISJC <notificaciones@tudominio.com>',
  to: [process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contacto@isjc.edu.hn'],
  replyTo: email,
  subject: `Nuevo mensaje de contacto: ${subject || 'Sin asunto'}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Nuevo mensaje de contacto</h2>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>De:</strong> ${firstName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Asunto:</strong> ${subject || 'Sin asunto'}</p>
      </div>
      <div style="margin: 20px 0;">
        <h3>Mensaje:</h3>
        <p style="line-height: 1.6;">${message}</p>
      </div>
      <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="color: #6b7280; font-size: 12px;">
        Este mensaje fue enviado desde el formulario de contacto de ISJC
      </p>
    </div>
  `,
});
```

## 📊 Ver los Mensajes en Supabase

1. Ve a tu proyecto en Supabase
2. Haz clic en "Table Editor"
3. Selecciona la tabla `contact_submissions`
4. Verás todos los mensajes recibidos

## 🔒 Seguridad

- ✅ Row Level Security (RLS) habilitado
- ✅ Validación de datos en el servidor
- ✅ Protección contra inyección SQL
- ✅ Variables de entorno para credenciales sensibles

## 🆘 Solución de Problemas

### Error: "Missing Supabase environment variables"
- Verifica que el archivo `.env.local` existe
- Verifica que las variables están correctamente escritas
- Reinicia el servidor de desarrollo

### Los mensajes no se guardan
- Verifica que ejecutaste el SQL en Supabase
- Verifica que las políticas RLS están creadas
- Revisa la consola del navegador para errores

### No recibo emails
- Verifica que Resend está correctamente configurado
- Verifica que el dominio está verificado en Resend
- Revisa los logs en el dashboard de Resend

## 📝 Notas

- La versión gratuita de Supabase incluye:
  - 500 MB de base de datos
  - 1 GB de transferencia de datos
  - 50,000 usuarios activos mensuales

- La versión gratuita de Resend incluye:
  - 100 emails por día
  - 3,000 emails por mes

## 🎯 Próximos Pasos

1. Personaliza el email de notificación
2. Crea un dashboard admin para ver los mensajes
3. Agrega webhook para notificaciones en tiempo real
4. Implementa respuestas automáticas
