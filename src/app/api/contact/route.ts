import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, email, subject, message } = body;

    // Validación básica
    if (!firstName || !email || !message) {
      return NextResponse.json(
        { error: 'Todos los campos obligatorios deben ser completados' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Formato de correo electrónico inválido' },
        { status: 400 }
      );
    }

    // Verificar que Resend esté configurado
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY no está configurada');
      return NextResponse.json(
        { error: 'Configuración de email incompleta. Por favor, contacte al administrador.' },
        { status: 500 }
      );
    }

    // Inicializar Resend dentro de la función
    const resend = new Resend(process.env.RESEND_API_KEY);
    const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'info@sanjosedelcarmen.edu.hn';

    // Preparar el email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nuevo mensaje de contacto</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Instituto San José del Carmen</h1>
          <p style="color: #e0e7ff; margin: 10px 0 0 0;">Nuevo mensaje de contacto</p>
        </div>
        
        <div style="background-color: #f9fafb; padding: 30px; border-left: 4px solid #2563eb; border-right: 4px solid #2563eb;">
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="color: #2563eb; margin-top: 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
              Información del Contacto
            </h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                  <strong style="color: #4b5563;">Nombre:</strong>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                  ${firstName}
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                  <strong style="color: #4b5563;">Email:</strong>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                  <a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0;">
                  <strong style="color: #4b5563;">Asunto:</strong>
                </td>
                <td style="padding: 10px 0; text-align: right;">
                  ${subject || 'Sin asunto'}
                </td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="color: #2563eb; margin-top: 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
              Mensaje
            </h3>
            <p style="white-space: pre-wrap; line-height: 1.8; color: #1f2937; margin: 15px 0;">
              ${message}
            </p>
          </div>
        </div>
        
        <div style="background-color: #1f2937; padding: 20px; border-radius: 0 0 10px 10px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Este mensaje fue enviado desde el formulario de contacto del sitio web de ISJC
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
            Fecha: ${new Date().toLocaleString('es-HN', { 
              timeZone: 'America/Tegucigalpa',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </body>
      </html>
    `;

    // Enviar email usando Resend
    const { data, error } = await resend.emails.send({
      from: 'ISJC WEB SITE Contacto <contacto@sanjosedelcarmen.edu.hn>', // Cambiar cuando tengas dominio verificado
      to: [contactEmail],
      replyTo: email,
      subject: `Nuevo mensaje de contacto: ${subject || 'Sin asunto'}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Error al enviar email con Resend:', error);
      return NextResponse.json(
        { error: 'Error al enviar el mensaje. Por favor, intenta nuevamente.' },
        { status: 500 }
      );
    }

    console.log('Email enviado exitosamente:', data);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Mensaje enviado exitosamente. Nos pondremos en contacto pronto.',
        emailId: data?.id
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en el endpoint de contacto:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
