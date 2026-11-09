import nodemailer from "nodemailer";
import { prisma } from "../../config/database";
import { env } from "../../config/env";
import { NotificationEvent, EmailPayload } from "./notification.types";
import { renderEmailTemplate } from "./email-templates";

export class NotificationService {
  /**
   * Crea el transportador de correo electrónico priorizando Gmail API con OAuth2
   */
  private static getTransporter() {
    const isGmailOAuthReady = Boolean(
      env.GMAIL_USER &&
      env.GMAIL_CLIENT_ID &&
      env.GMAIL_CLIENT_SECRET &&
      env.GMAIL_REFRESH_TOKEN
    );

    if (isGmailOAuthReady) {
      //  Enrutador oficial de Gmail API vía OAuth2
      return {
        transporter: nodemailer.createTransport({
          service: "gmail",
          auth: {
            type: "OAuth2",
            user: env.GMAIL_USER,
            clientId: env.GMAIL_CLIENT_ID,
            clientSecret: env.GMAIL_CLIENT_SECRET,
            refreshToken: env.GMAIL_REFRESH_TOKEN,
          },
        }),
        provider: "GMAIL_OAUTH2",
        senderEmail: env.GMAIL_USER,
      };
    }

    // Fallback: SMTP estándar o emulador de desarrollo
    const host = process.env.SMTP_HOST || "";
    const port = parseInt(process.env.SMTP_PORT || "465", 10);
    const secure = process.env.SMTP_SECURE !== "false";
    const user = process.env.SMTP_USER || "";
    const pass = process.env.SMTP_PASS || "";

    return {
      transporter: nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      }),
      provider: "SMTP_FALLBACK",
      senderEmail: user,
    };
  }

  /**
   * Envía correo usando la API oficial de Gmail (REST v1) con OAuth2
   */
  private static async sendViaGmailApi(params: {
    from: string;
    to: string;
    subject: string;
    html: string;
  }): Promise<{ messageId: string }> {
    // 1. Obtener Access Token fresco desde Google OAuth2
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.GMAIL_CLIENT_ID,
        client_secret: env.GMAIL_CLIENT_SECRET,
        refresh_token: env.GMAIL_REFRESH_TOKEN,
        grant_type: "refresh_token",
      }),
    });

    const tokenData = (await tokenRes.json()) as any;
    if (!tokenData?.access_token) {
      throw new Error(`Fallo de autorización OAuth2 con Gmail: ${tokenData?.error_description || tokenData?.error || "No se obtuvo token"}`);
    }

    // 2. Construir mensaje RFC 2822 completo (multipart/alternative, Message-ID, Date y text fallback para anti-spam)
    // @ts-ignore
    const MailComposer = require("nodemailer/lib/mail-composer");
    const textFallback = params.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    const mail = new MailComposer({
      from: `"Go Eats" <${params.from}>`,
      to: params.to,
      subject: params.subject,
      text: textFallback,
      html: params.html,
    });

    const compiledBuffer: Buffer = await mail.compile().build();
    const base64UrlEncoded = compiledBuffer
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // 3. Enviar a través de la API oficial de Gmail (HTTPS puerto 443)
    const sendRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: base64UrlEncoded }),
    });

    const sendData = (await sendRes.json()) as any;
    if (sendData?.error) {
      throw new Error(`Gmail API error: ${sendData.error.message || JSON.stringify(sendData.error)}`);
    }

    return { messageId: sendData.id || "GMAIL_API_SENT" };
  }

  /**
   * Envía un correo con protección contra duplicados (eventId) y registro en base de datos
   */
  public static async dispatch(payload: EmailPayload) {
    const { recipient, event, eventId, data } = payload;

    if (!recipient.email) {
      console.warn(`[NotificationService] No se pudo enviar evento ${event}: falta correo de destino.`);
      return { success: false, error: "Recipient email is missing" };
    }

    // 1. CONTROL DE DUPLICADOS (Sección 11 del Plan)
    if (eventId) {
      const existing = await prisma.emailNotification.findUnique({
        where: { eventId },
      });

      if (existing && existing.status === "SENT") {
        console.log(`[NotificationService] Evento duplicado detectado (${eventId}). Se omite envío para evitar spam.`);
        return { success: true, duplicate: true, notificationId: existing.id };
      }
    }

    // 2. RENDERIZAR PLANTILLA
    const { subject, templatePath, html } = renderEmailTemplate(event, data, recipient.name);

    // 3. REGISTRAR O ACTUALIZAR EN BASE DE DATOS COMO "SENDING"
    let record = await prisma.emailNotification.upsert({
      where: { eventId: eventId || `auto_${Date.now()}_${Math.random().toString(36).substring(7)}` },
      create: {
        userId: recipient.userId || null,
        recipientEmail: recipient.email,
        type: event,
        template: templatePath,
        subject,
        status: "SENDING",
        eventId: eventId || null,
        metadataJson: JSON.stringify(data),
      },
      update: {
        status: "SENDING",
        metadataJson: JSON.stringify(data),
      },
    });

    // 4. EJECUTAR ENVÍO
    try {
      const isGmailOAuthReady = Boolean(
        env.GMAIL_USER &&
        env.GMAIL_CLIENT_ID &&
        env.GMAIL_CLIENT_SECRET &&
        env.GMAIL_REFRESH_TOKEN
      );

      let provider = "GMAIL_API_V1";
      let messageId = "";

      if (isGmailOAuthReady) {
        //  Envío directo mediante Gmail API REST v1 con OAuth2
        const result = await this.sendViaGmailApi({
          from: env.GMAIL_USER,
          to: recipient.email,
          subject,
          html,
        });
        messageId = result.messageId;
      } else {
        // Fallback a SMTP
        provider = "SMTP_FALLBACK";
        const { transporter, senderEmail } = this.getTransporter();
        const info = await transporter.sendMail({
          from: `"Go Eats" <${senderEmail}>`,
          to: recipient.email,
          subject,
          html,
        });
        messageId = info.messageId || "SMTP_OK";
      }

      // 5. MARCAR COMO SENT
      const updated = await prisma.emailNotification.update({
        where: { id: record.id },
        data: {
          status: "SENT",
          providerMessageId: messageId,
          sentAt: new Date(),
          error: null,
        },
      });

      console.log(`[NotificationService]  Correo enviado [${event}] -> ${recipient.email} (${provider}: ${messageId})`);
      return { success: true, notification: updated, provider };
    } catch (err: any) {
      console.error(`[NotificationService]  Error enviando correo [${event}] a ${recipient.email}:`, err.message || err);

      await prisma.emailNotification.update({
        where: { id: record.id },
        data: {
          status: "FAILED",
          error: err.message || String(err),
        },
      });

      return { success: false, error: err.message || err };
    }
  }

  /**
   * Reintenta el envío de un registro existente de correo directamente actualizando su estado
   */
  public static async retryRecord(id: number) {
    const record = await prisma.emailNotification.findUnique({ where: { id } });
    if (!record) {
      return { success: false, error: "Registro no encontrado" };
    }

    let parsedData: any = {};
    try {
      if (record.metadataJson) {
        parsedData = JSON.parse(record.metadataJson);
      }
    } catch (_) {}

    const { subject, html } = renderEmailTemplate(
      record.type as NotificationEvent,
      parsedData,
      parsedData.name || "Usuario"
    );

    // Marcar como SENDING
    await prisma.emailNotification.update({
      where: { id },
      data: { status: "SENDING", error: null },
    });

    try {
      const isGmailOAuthReady = Boolean(
        env.GMAIL_USER &&
        env.GMAIL_CLIENT_ID &&
        env.GMAIL_CLIENT_SECRET &&
        env.GMAIL_REFRESH_TOKEN
      );

      let provider = "GMAIL_API_V1";
      let messageId = "";

      if (isGmailOAuthReady) {
        const result = await this.sendViaGmailApi({
          from: env.GMAIL_USER,
          to: record.recipientEmail,
          subject,
          html,
        });
        messageId = result.messageId;
      } else {
        provider = "SMTP_FALLBACK";
        const { transporter, senderEmail } = this.getTransporter();
        const info = await transporter.sendMail({
          from: `"Go Eats" <${senderEmail}>`,
          to: record.recipientEmail,
          subject,
          html,
        });
        messageId = info.messageId || "SMTP_OK";
      }

      const updated = await prisma.emailNotification.update({
        where: { id },
        data: {
          status: "SENT",
          providerMessageId: messageId,
          sentAt: new Date(),
          error: null,
        },
      });

      console.log(`[NotificationService]  Reintento exitoso [ID ${id}] -> ${record.recipientEmail} (${provider})`);
      return { success: true, notification: updated, provider };
    } catch (err: any) {
      console.error(`[NotificationService]  Reintento fallido [ID ${id}]:`, err.message || err);
      await prisma.emailNotification.update({
        where: { id },
        data: {
          status: "FAILED",
          error: err.message || String(err),
        },
      });
      return { success: false, error: err.message || err };
    }
  }

  // ==========================================
  // DISPATCHERS ESPECÍFICOS POR ROL Y EVENTO
  // ==========================================

  // --- CLIENTE ---
  public static async notifyCustomerWelcome(user: { id: number; name: string; email: string }) {
    return this.dispatch({
      recipient: { email: user.email, name: user.name, userId: user.id },
      event: NotificationEvent.CUSTOMER_WELCOME,
      eventId: `user_${user.id}_welcome`,
      data: { name: user.name },
    });
  }

  public static async notifyOrderCreated(order: { id: number; total: number; deliveryAddress?: string | null; restaurant?: { name: string } }, customer: { id?: number; name: string; email?: string | null }) {
    if (!customer.email) return;
    return this.dispatch({
      recipient: { email: customer.email, name: customer.name, userId: customer.id },
      event: NotificationEvent.ORDER_CREATED,
      eventId: `order_${order.id}_created`,
      data: {
        orderId: order.id,
        orderNumber: `GE-${order.id.toString().padStart(5, "0")}`,
        orderTotal: order.total,
        restaurantName: order.restaurant?.name || "Restaurante",
        deliveryAddress: order.deliveryAddress,
      },
    });
  }

  public static async notifyOrderAccepted(order: { id: number; restaurant?: { name: string } }, customer: { id?: number; name: string; email?: string | null }) {
    if (!customer.email) return;
    return this.dispatch({
      recipient: { email: customer.email, name: customer.name, userId: customer.id },
      event: NotificationEvent.ORDER_ACCEPTED,
      eventId: `order_${order.id}_accepted`,
      data: {
        orderId: order.id,
        orderNumber: `GE-${order.id.toString().padStart(5, "0")}`,
        restaurantName: order.restaurant?.name || "Restaurante",
      },
    });
  }

  public static async notifyOrderPreparing(order: { id: number; restaurant?: { name: string } }, customer: { id?: number; name: string; email?: string | null }) {
    if (!customer.email) return;
    return this.dispatch({
      recipient: { email: customer.email, name: customer.name, userId: customer.id },
      event: NotificationEvent.ORDER_PREPARING,
      eventId: `order_${order.id}_preparing`,
      data: {
        orderId: order.id,
        orderNumber: `GE-${order.id.toString().padStart(5, "0")}`,
        restaurantName: order.restaurant?.name || "Restaurante",
      },
    });
  }

  public static async notifyDriverAssigned(order: { id: number; deliveryPin?: string | null; restaurant?: { name: string } }, customer: { id?: number; name: string; email?: string | null }, driverName: string) {
    if (!customer.email) return;
    return this.dispatch({
      recipient: { email: customer.email, name: customer.name, userId: customer.id },
      event: NotificationEvent.DRIVER_ASSIGNED,
      eventId: `order_${order.id}_driver_assigned`,
      data: {
        orderId: order.id,
        orderNumber: `GE-${order.id.toString().padStart(5, "0")}`,
        restaurantName: order.restaurant?.name || "Restaurante",
        driverName,
        deliveryPin: order.deliveryPin,
      },
    });
  }

  public static async notifyOrderOnTheWay(order: { id: number; deliveryAddress?: string | null; deliveryPin?: string | null; restaurant?: { name: string } }, customer: { id?: number; name: string; email?: string | null }, driverName: string) {
    if (!customer.email) return;
    return this.dispatch({
      recipient: { email: customer.email, name: customer.name, userId: customer.id },
      event: NotificationEvent.ORDER_ON_THE_WAY,
      eventId: `order_${order.id}_on_the_way`,
      data: {
        orderId: order.id,
        orderNumber: `GE-${order.id.toString().padStart(5, "0")}`,
        restaurantName: order.restaurant?.name || "Restaurante",
        driverName,
        deliveryAddress: order.deliveryAddress,
        deliveryPin: order.deliveryPin,
      },
    });
  }

  public static async notifyOrderDelivered(order: { id: number; restaurant?: { name: string } }, customer: { id?: number; name: string; email?: string | null }) {
    if (!customer.email) return;
    return this.dispatch({
      recipient: { email: customer.email, name: customer.name, userId: customer.id },
      event: NotificationEvent.ORDER_DELIVERED,
      eventId: `order_${order.id}_delivered`,
      data: {
        orderId: order.id,
        orderNumber: `GE-${order.id.toString().padStart(5, "0")}`,
        restaurantName: order.restaurant?.name || "Restaurante",
      },
    });
  }

  public static async notifyOrderCancelled(order: { id: number }, customer: { id?: number; name: string; email?: string | null }, reason?: string) {
    if (!customer.email) return;
    return this.dispatch({
      recipient: { email: customer.email, name: customer.name, userId: customer.id },
      event: NotificationEvent.ORDER_CANCELLED,
      eventId: `order_${order.id}_cancelled`,
      data: {
        orderId: order.id,
        orderNumber: `GE-${order.id.toString().padStart(5, "0")}`,
        reason: reason || "El pedido no pudo ser procesado por el restaurante.",
      },
    });
  }

  // --- REPARTIDOR ---
  public static async notifyDriverWelcome(driver: { id: number; name: string; email: string }) {
    return this.dispatch({
      recipient: { email: driver.email, name: driver.name, userId: driver.id },
      event: NotificationEvent.DRIVER_WELCOME,
      eventId: `driver_${driver.id}_welcome`,
      data: { name: driver.name },
    });
  }

  public static async notifyDriverApproved(driver: { id: number; name: string; email: string }) {
    return this.dispatch({
      recipient: { email: driver.email, name: driver.name, userId: driver.id },
      event: NotificationEvent.DRIVER_APPROVED,
      eventId: `driver_${driver.id}_approved`,
      data: { name: driver.name },
    });
  }

  public static async notifyDriverRejected(driver: { id: number; name: string; email: string }, reason?: string) {
    return this.dispatch({
      recipient: { email: driver.email, name: driver.name, userId: driver.id },
      event: NotificationEvent.DRIVER_REJECTED,
      eventId: `driver_${driver.id}_rejected`,
      data: { name: driver.name, reason: reason || "Documentación no legible o incompleta." },
    });
  }

  public static async notifyDriverNewOrder(driver: { id: number; name: string; email: string }, order: { id: number; total: number; deliveryAddress?: string | null; driverEarnings?: number | null }, restaurant: { name: string; address?: string | null }) {
    return this.dispatch({
      recipient: { email: driver.email, name: driver.name, userId: driver.id },
      event: NotificationEvent.DRIVER_NEW_ORDER,
      eventId: `driver_${driver.id}_order_${order.id}_assigned`,
      data: {
        orderId: order.id,
        orderNumber: `GE-${order.id.toString().padStart(5, "0")}`,
        restaurantName: restaurant.name,
        restaurantAddress: restaurant.address,
        deliveryAddress: order.deliveryAddress,
        driverEarnings: order.driverEarnings || 1.5,
      },
    });
  }

  // --- RESTAURANTE ---
  public static async notifyRestaurantApplicationReceived(restaurant: { id: number; name: string }, owner: { id: number; name: string; email: string }) {
    return this.dispatch({
      recipient: { email: owner.email, name: owner.name, userId: owner.id },
      event: NotificationEvent.RESTAURANT_APPLICATION_RECEIVED,
      eventId: `restaurant_${restaurant.id}_application_received`,
      data: { restaurantName: restaurant.name },
    });
  }

  public static async notifyRestaurantUnderReview(restaurant: { id: number; name: string }, owner: { id: number; name: string; email: string }) {
    return this.dispatch({
      recipient: { email: owner.email, name: owner.name, userId: owner.id },
      event: NotificationEvent.RESTAURANT_UNDER_REVIEW,
      eventId: `restaurant_${restaurant.id}_under_review`,
      data: { restaurantName: restaurant.name },
    });
  }

  public static async notifyRestaurantApproved(restaurant: { id: number; name: string }, owner: { id: number; name: string; email: string }) {
    return this.dispatch({
      recipient: { email: owner.email, name: owner.name, userId: owner.id },
      event: NotificationEvent.RESTAURANT_APPROVED,
      eventId: `restaurant_${restaurant.id}_approved`,
      data: { restaurantName: restaurant.name },
    });
  }

  public static async notifyRestaurantRejected(restaurant: { id: number; name: string }, owner: { id: number; name: string; email: string }, reason?: string) {
    return this.dispatch({
      recipient: { email: owner.email, name: owner.name, userId: owner.id },
      event: NotificationEvent.RESTAURANT_REJECTED,
      eventId: `restaurant_${restaurant.id}_rejected`,
      data: { restaurantName: restaurant.name, reason: reason || "No cumple con los estándares sanitarios o fiscales requeridos." },
    });
  }

  public static async notifyRestaurantNewOrder(restaurant: { id: number; name: string }, owner: { id: number; name: string; email?: string | null }, order: { id: number; total: number; type: string; customerName: string }) {
    if (!owner.email) return;
    return this.dispatch({
      recipient: { email: owner.email, name: owner.name, userId: owner.id },
      event: NotificationEvent.RESTAURANT_NEW_ORDER,
      eventId: `restaurant_${restaurant.id}_order_${order.id}_new`,
      data: {
        restaurantName: restaurant.name,
        orderId: order.id,
        orderNumber: `GE-${order.id.toString().padStart(5, "0")}`,
        orderTotal: order.total,
        orderType: order.type,
        customerName: order.customerName,
      },
    });
  }

  /**
   * Envía un correo directo HTML (ej. tickets de soporte o alertas administrativas)
   */
  public static async sendDirectMail(params: {
    to: string;
    subject: string;
    html: string;
    fromName?: string;
  }) {
    const isGmailOAuthReady = Boolean(
      env.GMAIL_USER &&
      env.GMAIL_CLIENT_ID &&
      env.GMAIL_CLIENT_SECRET &&
      env.GMAIL_REFRESH_TOKEN
    );

    if (isGmailOAuthReady) {
      return this.sendViaGmailApi({
        from: env.GMAIL_USER,
        to: params.to,
        subject: params.subject,
        html: params.html,
      });
    } else {
      const { transporter, senderEmail } = this.getTransporter();
      return transporter.sendMail({
        from: `"${params.fromName || 'GoEats Soporte'}" <${senderEmail}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
      });
    }
  }
}

