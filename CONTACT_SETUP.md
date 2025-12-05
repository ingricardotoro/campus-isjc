# 📧 Configuración del Formulario de Contacto con Resend

## 🚀 Configuración Rápida (5 minutos)

### Paso 1: Crear Cuenta en Resend

1. Ve a [https://resend.com](https://resend.com)
2. Crea una cuenta gratuita (no requiere tarjeta de crédito)
3. Plan gratuito incluye:
   - 100 emails por día
   - 3,000 emails por mes

### Paso 2: Obtener API Key

1. En el dashboard de Resend, ve a **API Keys**
2. Haz clic en **Create API Key**
3. Dale un nombre descriptivo (ej: "ISJC Contact Form")
4. Copia la API Key (solo se muestra una vez)

### Paso 3: Configurar Variables de Entorno

1. Abre el archivo `.env.local` en la raíz del proyecto
2. Actualiza con tu API Key:

```env
RESEND_API_KEY=re_tu_api_key_aqui
NEXT_PUBLIC_CONTACT_EMAIL=contacto@isjc.edu.hn
```

### Paso 4: Reiniciar el Servidor

```bash
npm run dev
```

## ✅ ¡Listo!

El formulario de contacto ya está funcionando. Los mensajes se enviarán directamente a tu email institucional.

---

## 🎨 Características del Email

- ✅ Diseño profesional con colores institucionales (azul ISJC)
- ✅ Responsive (se ve bien en móvil y desktop)
- ✅ Incluye toda la información del contacto
- ✅ Reply-to configurado al email del remitente
- ✅ Timestamp con hora de Honduras
- ✅ Formato HTML profesional

---

## 📧 Configurar Dominio Propio (Opcional - Recomendado)

Por defecto, los emails se envían desde `onboarding@resend.dev`. Para usar tu propio dominio:

### Paso 1: Agregar Dominio en Resend

1. En Resend, ve a **Domains**
2. Clic en **Add Domain**
3. Ingresa tu dominio: `isjc.edu.hn`

### Paso 2: Configurar DNS

Agrega estos registros en tu proveedor de DNS:

```
Tipo: TXT
Nombre: @
Valor: [Resend te proporcionará el valor]

Tipo: CNAME
Nombre: resend._domainkey
Valor: [Resend te proporcionará el valor]

Tipo: MX
Nombre: @
Valor: [Resend te proporcionará el valor]
```

### Paso 3: Verificar Dominio

1. Espera unos minutos (puede tardar hasta 48 horas)
2. En Resend, verifica el estado del dominio
3. Una vez verificado, actualiza el código:

En `src/app/api/contact/route.ts`, línea donde dice:

```typescript
from: 'ISJC Contacto <onboarding@resend.dev>',
```

Cámbialo a:

```typescript
from: 'ISJC Contacto <contacto@isjc.edu.hn>',
```

---

## 🧪 Probar el Formulario

1. Ve a la página de contacto de tu sitio
2. Completa el formulario con datos de prueba
3. Haz clic en "Enviar"
4. Deberías ver un mensaje de éxito
5. Revisa tu email institucional
6. Verifica en Resend Dashboard → **Emails** el estado del envío

---

## 📊 Monitoreo

### Dashboard de Resend

Ve a [resend.com/emails](https://resend.com/emails) para ver:

- ✅ Todos los emails enviados
- ✅ Estado de entrega (delivered, bounced, etc.)
- ✅ Métricas de apertura (con dominio verificado)
- ✅ Clicks en enlaces
- ✅ Quejas de spam

### Logs en Consola

Los logs del servidor Next.js mostrarán:
- Emails enviados exitosamente
- Errores si algo falla
- ID del email en Resend

---

## 🔒 Seguridad

- ✅ API Key nunca se expone al cliente (solo servidor)
- ✅ Validación de formato de email
- ✅ Sanitización de datos HTML
- ✅ Rate limiting incluido por Resend
- ✅ Variables de entorno protegidas

---

## ⚠️ Límites del Plan Gratuito

- 100 emails por día
- 3,000 emails por mes
- Si necesitas más, Resend tiene planes desde $20/mes

---

## 🐛 Solución de Problemas

### Error: "Configuración de email incompleta"
**Solución:** Verifica que agregaste `RESEND_API_KEY` en `.env.local` y reiniciaste el servidor.

### Los emails no llegan
**Solución:**
1. Revisa la carpeta de spam
2. Verifica el dashboard de Resend para ver el estado
3. Confirma que el email de destino es correcto
4. Si usas dominio propio, verifica que esté verificado

### Error: "API key is invalid"
**Solución:**
1. Verifica que copiaste la API key completa
2. Asegúrate de que empiece con `re_`
3. Crea una nueva API key si es necesario

### Los emails se envían desde resend.dev
**Solución:** Esto es normal. Para usar tu dominio, sigue los pasos en "Configurar Dominio Propio".

---

## 📈 Mejoras Futuras (Opcional)

1. **Respuesta automática**: Enviar email de confirmación al remitente
2. **Plantillas personalizadas**: Usar el sistema de plantillas de Resend
3. **Webhooks**: Recibir notificaciones en tiempo real
4. **Analytics**: Tracking de aperturas y clicks
5. **Múltiples destinatarios**: Enviar a diferentes departamentos según el asunto

---

## 💡 Consejos

- **Desarrollo**: Usa tu email personal para pruebas
- **Producción**: Configura el email institucional
- **Monitoreo**: Revisa el dashboard de Resend regularmente
- **Dominio**: Verifica tu dominio para mejor deliverability
- **Backup**: Considera guardar los mensajes en una base de datos (opcional)

---

## 📞 Soporte

- **Resend Docs**: [https://resend.com/docs](https://resend.com/docs)
- **Next.js API Routes**: [https://nextjs.org/docs/app/building-your-application/routing/route-handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

## 🎯 Resumen

**Lo que tienes ahora:**
- ✅ Formulario de contacto funcional
- ✅ Envío de emails con Resend
- ✅ Diseño profesional de emails
- ✅ Validación de datos
- ✅ Notificaciones al usuario
- ✅ Gratis hasta 3,000 emails/mes

**Lo que necesitas hacer:**
1. Crear cuenta en Resend
2. Obtener API Key
3. Agregar a `.env.local`
4. Reiniciar servidor
5. ¡Probar!

**Tiempo total: ~5 minutos** ⏱️
