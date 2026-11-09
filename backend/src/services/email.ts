import nodemailer from "nodemailer";

interface SendInvoiceEmailParams {
  to: string;
  invoiceNumber: string;
  xmlContent: string;
  pdfBuffer: Buffer;
  businessName: string;
  customerName: string;
}

/**
 * Envía un correo electrónico al cliente con la factura (PDF RIDE y XML Autorizado) adjuntos.
 */
export async function sendInvoiceEmail(params: SendInvoiceEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Configuración SMTP desde variables de entorno
  const host = process.env.SMTP_HOST || "";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const secure = process.env.SMTP_SECURE !== "false"; // Default true (SSL)
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  const fromName = process.env.SMTP_FROM_NAME || params.businessName;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    const mailOptions = {
      from: `"${fromName}" <${user}>`,
      to: params.to,
      subject: `Comprobante Electrónico Autorizado - Factura ${params.invoiceNumber}`,
      html: `
        <body style="margin: 20px; padding: 20px; background-color: #f3f4f6; font-family: sans-serif;">
          <div style="background-color: #ffffff; padding: 25px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 20px;">
              <h2 style="color: #1f2937; margin: 0;">${params.businessName}</h2>
              <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">Comprobante de Venta Electrónico</p>
            </div>
            
            <div style="color: #374151; line-height: 1.6; font-size: 14px;">
              <p>Estimado/a <strong>${params.customerName}</strong>,</p>
              <p>Le informamos que se ha generado y autorizado un comprobante de venta electrónico a su nombre.</p>
              
              <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #f3f4f6;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280;">Documento:</td>
                    <td style="padding: 4px 0; font-weight: bold; color: #1f2937;">FACTURA</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #6b7280;">Número:</td>
                    <td style="padding: 4px 0; font-weight: bold; color: #1f2937;">${params.invoiceNumber}</td>
                  </tr>
                </table>
              </div>
              
              <p>Adjunto a este correo encontrará los archivos oficiales de su comprobante:</p>
              <ul style="padding-left: 20px; margin: 10px 0; color: #4b5563;">
                <li><strong>Archivo PDF (RIDE):</strong> Representación impresa y visual de la factura.</li>
                <li><strong>Archivo XML:</strong> Documento tributario electrónico firmado y autorizado por el SRI.</li>
              </ul>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 11px;">
              <p>Este es un correo generado automáticamente por nuestro sistema de facturación. Por favor, no responda a este mensaje.</p>
            </div>
          </div>
        </body>
      `,
      attachments: [
        {
          filename: `Factura_${params.invoiceNumber}.pdf`,
          content: params.pdfBuffer,
        },
        {
          filename: `Factura_${params.invoiceNumber}.xml`,
          content: params.xmlContent,
          contentType: "text/xml",
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Error al enviar correo de factura:", error);
    return { success: false, error: error.message || error };
  }
}

export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const host = process.env.SMTP_HOST || "";
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const secure = process.env.SMTP_SECURE !== "false";
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  const fromName = process.env.SMTP_FROM_NAME || "GoEats Notificaciones";

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    const mailOptions = {
      from: `"${fromName}" <${user}>`,
      to: params.to,
      subject: ` ¡Bienvenido a GoEats, ${params.name}! Tu cuenta ha sido creada con éxito`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; padding: 30px 15px;">
          <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
            <div style="background: linear-gradient(135deg, #ff4757 0%, #ff6b81 100%); padding: 26px 20px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 800;">Go<span style="color: #2f3542;">Eats</span></h1>
              <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.95;">Tu app de delivery y restaurantes</p>
            </div>
            <div style="padding: 28px 24px;">
              <h2 style="margin: 0 0 8px; font-size: 19px; color: #0f172a;">¡Tu cuenta ha sido creada con éxito!</h2>
              <p style="margin: 0; font-size: 14px; color: #475569;">Hola <strong>${params.name}</strong>, bienvenido a GoEats.</p>
              
              <div style="background-color: #fff1f2; border: 1.5px dashed #fecdd3; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: center;">
                <div style="font-size: 11px; font-weight: 700; color: #e11d48; text-transform: uppercase;">CUPÓN DE BIENVENIDA (15% OFF)</div>
                <div style="font-size: 20px; font-weight: 800; color: #881337; margin-top: 4px;">BIENVENIDO15</div>
                <div style="font-size: 11px; color: #9f1239; margin-top: 2px;">Válido en tu primer pedido a domicilio o escaneando el QR en mesa.</div>
              </div>

              <p style="font-size: 13px; color: #64748b; line-height: 1.5;">Ya puedes pedir de tus restaurantes favoritos en tiempo real y disfrutar de envíos rápidos.</p>
            </div>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Correo de bienvenida enviado a ${params.to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.warn("[Email] Notificación de correo:", error.message || error);
    return { success: false, error: error.message || error };
  }
}
