import { Request, Response } from "express";
import { NotificationService } from "../notifications/notification.service";

export class SupportController {
  public static async createTicket(req: Request, res: Response) {
    try {
      const {
        name,
        email,
        phone,
        role = "CUSTOMER",
        category = "Consulta General",
        subject,
        message,
        orderId,
        restaurantName,
      } = req.body;

      if (!name || !email || !message) {
        return res.status(400).json({
          success: false,
          error: "Los campos Nombre, Correo y Mensaje son obligatorios.",
        });
      }

      // Role badge colors & text
      let roleLabel = "Cliente Comensal";
      let roleColor = "#3b82f6"; // Blue
      if (role === "RESTAURANT") {
        roleLabel = "Restaurante / POS";
        roleColor = "#f59e0b"; // Amber/Orange
      } else if (role === "MOTORIZADO" || role === "DELIVERY") {
        roleLabel = "Repartidor / Motorizado";
        roleColor = "#10b981"; // Emerald
      }

      const ticketCode = `TK-${Date.now().toString().slice(-6)}`;
      const dateStr = new Date().toLocaleString("es-EC", { timeZone: "America/Guayaquil" });

      // 1. Correo estilizado para el Equipo de Soporte GoEats
      const adminEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .card { background-color: #ffffff; border-radius: 12px; max-width: 600px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 25px; text-align: center; color: #ffffff; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; color: #ffffff; background-color: ${roleColor}; }
    .content { padding: 25px; }
    .field { margin-bottom: 16px; }
    .field-label { font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
    .field-value { font-size: 15px; font-weight: 500; color: #0f172a; }
    .message-box { background-color: #f1f5f9; border-left: 4px solid #ff4757; padding: 15px; border-radius: 0 8px 8px 0; font-size: 14px; line-height: 1.6; white-space: pre-wrap; }
    .btn { display: inline-block; padding: 10px 20px; background-color: #ff4757; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin-top: 15px; }
    .footer { padding: 15px 25px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2 style="margin: 0 0 8px 0; color: #ffffff;">Nuevo Ticket de Soporte GoEats</h2>
      <span class="badge">${roleLabel}</span>
      <p style="margin: 8px 0 0 0; font-size: 13px; color: #94a3b8;">Código: <strong>#${ticketCode}</strong> &bull; ${dateStr}</p>
    </div>
    <div class="content">
      <div class="field">
        <div class="field-label">Solicitante</div>
        <div class="field-value">${name} &bull; <a href="mailto:${email}" style="color: #3b82f6;">${email}</a></div>
      </div>
      ${phone ? `
      <div class="field">
        <div class="field-label">Teléfono / WhatsApp</div>
        <div class="field-value"><a href="https://wa.me/${phone.replace(/[^0-9]/g, "")}" style="color: #10b981; text-decoration: none;"> +${phone} (Clic para chatear)</a></div>
      </div>` : ""}
      <div class="field">
        <div class="field-label">Categoría &bull; Asunto</div>
        <div class="field-value"><strong>[${category}]</strong> ${subject || "Sin asunto específico"}</div>
      </div>
      ${orderId ? `
      <div class="field">
        <div class="field-label">Número de Pedido Asociado</div>
        <div class="field-value" style="font-weight: 700; color: #ff4757;">#${orderId}</div>
      </div>` : ""}
      ${restaurantName ? `
      <div class="field">
        <div class="field-label">Restaurante</div>
        <div class="field-value">${restaurantName}</div>
      </div>` : ""}
      <div class="field">
        <div class="field-label">Mensaje o Detalle del Problema</div>
        <div class="message-box">${message}</div>
      </div>
      <div style="text-align: center;">
        <a href="mailto:${email}?subject=RE: [Ticket %23${ticketCode}] ${encodeURIComponent(subject || category)}" class="btn">Responder al Usuario</a>
      </div>
    </div>
    <div class="footer">
      GoEats Platform &bull; Sistema Automatizado de Atención al Cliente y Soporte Técnico
    </div>
  </div>
</body>
</html>
      `;

      // 2. Correo de Confirmación para el Usuario Solicitante
      const userEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .card { background-color: #ffffff; border-radius: 12px; max-width: 560px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #ff4757 0%, #ff6b81 100%); padding: 30px 20px; text-align: center; color: #ffffff; }
    .content { padding: 30px 25px; line-height: 1.6; }
    .ticket-badge { background-color: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px 18px; margin: 20px 0; text-align: center; }
    .footer { padding: 15px 20px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2 style="margin: 0; font-size: 22px;">¡Hemos recibido tu mensaje!</h2>
      <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">Centro de Ayuda GoEats</p>
    </div>
    <div class="content">
      <p>Hola <strong>${name}</strong>,</p>
      <p>Te confirmamos que hemos recibido tu solicitud de soporte con éxito. Un agente de nuestro equipo revisará tu caso a la mayor brevedad posible.</p>
      
      <div class="ticket-badge">
        <div style="font-size: 12px; color: #64748b; font-weight: 600;">CÓDIGO DE TICKET</div>
        <div style="font-size: 20px; font-weight: 800; color: #ff4757;">#${ticketCode}</div>
        <div style="font-size: 13px; color: #334155; margin-top: 4px;"><strong>Categoría:</strong> ${category}</div>
      </div>

      <p style="font-size: 14px; color: #64748b;">
        <strong>Resumen de tu mensaje:</strong><br>
        <em>"${message.length > 200 ? message.substring(0, 200) + '...' : message}"</em>
      </p>

      <p style="font-size: 14px; margin-top: 25px;">
        Si se trata de un caso urgente sobre un pedido en curso, también puedes contactarnos directamente por WhatsApp con tu código de ticket.
      </p>

      <p style="margin-top: 20px;">Saludos cordiales,<br><strong>Equipo GoEats</strong></p>
    </div>
    <div class="footer">
      Este es un correo automático. Por favor no respondas directamente a este mensaje.
    </div>
  </div>
</body>
</html>
      `;

      // 3. Ejecutar envíos en paralelo (sin bloquear la respuesta en caso de demora de red)
      const supportRecipients = ["eatsgo015@gmail.com", "gerencia@guibis.com"];

      // Enviar a soporte
      Promise.allSettled(
        supportRecipients.map((to) =>
          NotificationService.sendDirectMail({
            to,
            subject: `[Soporte ${roleLabel}] #${ticketCode}: ${subject || category} (${name})`,
            html: adminEmailHtml,
            fromName: "GoEats Soporte Alertas",
          })
        )
      ).catch((err) => console.error("[SupportController] Error notificando a administradores:", err));

      // Enviar acuse de recibo al usuario
      NotificationService.sendDirectMail({
        to: email,
        subject: `[GoEats] Hemos recibido tu solicitud de soporte #${ticketCode}`,
        html: userEmailHtml,
        fromName: "GoEats Atención al Cliente",
      }).catch((err) => console.error("[SupportController] Error notificando al usuario:", err));

      return res.status(200).json({
        success: true,
        message: "Tu solicitud ha sido enviada con éxito. Hemos enviado un acuse de recibo a tu correo.",
        ticketCode,
      });
    } catch (error: any) {
      console.error("[SupportController] Error procesando ticket:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Error al procesar la solicitud de soporte",
      });
    }
  }
}
