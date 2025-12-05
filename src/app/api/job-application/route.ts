import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      nombreCompleto, 
      telefono, 
      correo, 
      direccion, 
      nivelIngles,
      areaLaboral,
      especializacion,
      experiencia,
      curriculumFileName,
      curriculumFileContent
    } = body;

    // Validación básica
    if (!nombreCompleto || !telefono || !correo || !direccion || !nivelIngles || !areaLaboral || !experiencia) {
      return NextResponse.json(
        { error: 'Todos los campos obligatorios deben ser completados' },
        { status: 400 }
      );
    }

    // Validar que se haya adjuntado el CV
    if (!curriculumFileName || !curriculumFileContent) {
      return NextResponse.json(
        { error: 'Por favor adjunta tu Curriculum Vitae' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(correo)) {
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

    // Verificar que se haya adjuntado el CV
    if (!curriculumFileName || !curriculumFileContent) {
      return NextResponse.json(
        { error: 'Por favor adjunta tu Curriculum Vitae' },
        { status: 400 }
      );
    }

    const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'info@sanjosedelcarmen.edu.hn';

    // Preparar el email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nueva Aplicación de Empleo</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 700px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Instituto Sagrado Jesús & Corazón</h1>
          <p style="color: #d1fae5; margin: 10px 0 0 0;">Nueva Aplicación de Empleo</p>
        </div>
        
        <div style="background-color: #f9fafb; padding: 30px; border-left: 4px solid #059669; border-right: 4px solid #059669;">
          <!-- Información Personal -->
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="color: #059669; margin-top: 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
              📋 Información Personal
            </h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                  <strong style="color: #4b5563;">Nombre Completo:</strong>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                  ${nombreCompleto}
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                  <strong style="color: #4b5563;">Teléfono:</strong>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                  <a href="tel:${telefono}" style="color: #059669; text-decoration: none;">${telefono}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                  <strong style="color: #4b5563;">Email:</strong>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                  <a href="mailto:${correo}" style="color: #059669; text-decoration: none;">${correo}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                  <strong style="color: #4b5563;">Dirección:</strong>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                  ${direccion}
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0;">
                  <strong style="color: #4b5563;">Nivel de Inglés:</strong>
                </td>
                <td style="padding: 10px 0; text-align: right;">
                  <span style="background-color: #d1fae5; color: #047857; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 500;">
                    ${nivelIngles}
                  </span>
                </td>
              </tr>
            </table>
          </div>

          <!-- Información Laboral -->
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="color: #059669; margin-top: 0; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
              💼 Información Laboral
            </h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                  <strong style="color: #4b5563;">Área de Aplicación:</strong>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                  <span style="background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 500;">
                    ${areaLaboral}
                  </span>
                </td>
              </tr>
              ${especializacion ? `
              <tr>
                <td style="padding: 10px 0;">
                  <strong style="color: #4b5563;">Especialización:</strong>
                </td>
                <td style="padding: 10px 0; text-align: right;">
                  ${especializacion}
                </td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <!-- Experiencia -->
          <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h3 style="color: #059669; margin-top: 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
              📝 Experiencia Laboral
            </h3>
            <p style="white-space: pre-wrap; line-height: 1.8; color: #1f2937; margin: 15px 0;">
              ${experiencia}
            </p>
          </div>

          <!-- Curriculum -->
          <div style="background-color: #dcfce7; padding: 15px; border-radius: 8px; border-left: 4px solid #059669; margin-bottom: 20px;">
            <p style="margin: 0; color: #065f46;">
              <strong>📎 Curriculum Vitae Adjunto:</strong> ${curriculumFileName}
              <br>
              <small style="color: #047857;">✅ El archivo CV está adjunto a este correo.</small>
            </p>
          </div>
        </div>
        
        <div style="background-color: #1f2937; padding: 20px; border-radius: 0 0 10px 10px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Esta aplicación fue enviada desde el formulario de empleo del sitio web de ISJC
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

    // Enviar email usando Resend con archivo adjunto
    const { data, error } = await resend.emails.send({
      from: 'ISJC Empleos <contacto@sanjosedelcarmen.edu.hn>', // Cambiar cuando tengas dominio verificado
      to: [contactEmail],
      replyTo: correo,
      subject: `Nueva Aplicación: ${areaLaboral} - ${nombreCompleto}`,
      html: emailHtml,
      attachments: [
        {
          filename: curriculumFileName,
          content: curriculumFileContent,
        },
      ],
    });

    if (error) {
      console.error('Error al enviar email con Resend:', error);
      return NextResponse.json(
        { error: 'Error al enviar la aplicación. Por favor, intenta nuevamente.' },
        { status: 500 }
      );
    }

    console.log('Email de aplicación enviado exitosamente:', data);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Aplicación enviada exitosamente. Nos pondremos en contacto pronto.',
        emailId: data?.id
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en el endpoint de aplicación de empleo:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
