import { NotificationEvent } from "./notification.types";

interface BaseLayoutOptions {
  preheader?: string;
  badge?: string;
  badgeColor?: string;
  title: string;
  recipientName: string;
  contentHtml: string;
  actionButton?: {
    text: string;
    url: string;
    bgColor?: string;
  };
  extraNote?: string;
}

export function renderBaseLayout(opts: BaseLayoutOptions): string {
  const badgeColor = opts.badgeColor || "#ff4757";
  const buttonBg = opts.actionButton?.bgColor || "#ff4757";

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${opts.title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      color: #1e293b;
    }
    .wrapper {
      width: 100%;
      background-color: #f4f6f8;
      padding: 40px 15px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 32px 24px;
      text-align: center;
      position: relative;
    }
    .logo {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #ffffff;
      text-decoration: none;
      display: inline-block;
    }
    .logo span {
      color: #ff4757;
    }
    .header-badge {
      display: inline-block;
      margin-top: 10px;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background-color: rgba(255, 71, 87, 0.15);
      color: #ff6b81;
      border: 1px solid rgba(255, 71, 87, 0.3);
    }
    .body {
      padding: 36px 32px;
    }
    .title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 16px 0;
      line-height: 1.3;
    }
    .greeting {
      font-size: 15px;
      color: #334155;
      margin-bottom: 20px;
    }
    .content {
      font-size: 14px;
      line-height: 1.65;
      color: #475569;
    }
    .card-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }
    .btn-container {
      text-align: center;
      margin: 32px 0 20px;
    }
    .btn {
      display: inline-block;
      background-color: ${buttonBg};
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      padding: 14px 32px;
      border-radius: 10px;
      box-shadow: 0 4px 14px rgba(255, 71, 87, 0.3);
      transition: all 0.2s ease;
    }
    .footer {
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 28px 24px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }
    .footer-links {
      margin-top: 10px;
    }
    .footer-links a {
      color: #64748b;
      text-decoration: none;
      margin: 0 8px;
    }
    .footer-links a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <!-- HEADER -->
      <div class="header">
        <a href="https://goeats.ec" class="logo">Go<span>Eats</span></a>
        ${opts.badge ? `<br><span class="header-badge" style="color: ${badgeColor}; border-color: ${badgeColor}40;">${opts.badge}</span>` : ""}
      </div>

      <!-- BODY -->
      <div class="body">
        <h1 class="title">${opts.title}</h1>
        <div class="greeting">Hola, <strong>${opts.recipientName}</strong>:</div>

        <div class="content">
          ${opts.contentHtml}
        </div>

        ${
          opts.actionButton
            ? `
          <div class="btn-container">
            <a href="${opts.actionButton.url}" class="btn" style="background-color: ${buttonBg};">${opts.actionButton.text}</a>
          </div>
        `
            : ""
        }

        ${
          opts.extraNote
            ? `
          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">
            ${opts.extraNote}
          </p>
        `
            : ""
        }
      </div>

      <!-- FOOTER -->
      <div class="footer">
        <div style="font-weight: 600; color: #64748b; margin-bottom: 4px;">Go Eats — Plataforma Gastronómica & Delivery</div>
        <div>© ${new Date().getFullYear()} Go Eats Inc. Todos los derechos reservados.</div>
        <div class="footer-links">
          <a href="#">Términos y Condiciones</a> • 
          <a href="#">Privacidad</a> • 
          <a href="#">Centro de Ayuda</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Renderizador de plantillas por rol y evento
 */
export function renderEmailTemplate(
  event: NotificationEvent,
  data: Record<string, any>,
  recipientName: string
): { subject: string; templatePath: string; html: string } {
  switch (event) {
    // ==========================================
    // CLIENTES
    // ==========================================
    case NotificationEvent.CUSTOMER_WELCOME: {
      const subject = ` ¡Bienvenido a Go Eats, ${recipientName}! Tu cuenta está lista`;
      const html = renderBaseLayout({
        title: "¡Bienvenido a la comunidad Go Eats!",
        recipientName,
        badge: "CLIENTE GO EATS",
        contentHtml: `
          <p>Nos alegra mucho tenerte con nosotros. A partir de ahora podrás explorar los mejores restaurantes de tu ciudad, pedir a domicilio en tiempo real y disfrutar de promociones exclusivas.</p>
          
          <div class="card-box" style="text-align: center; background-color: #fff1f2; border-color: #fecdd3;">
            <div style="font-size: 12px; font-weight: 700; color: #e11d48; text-transform: uppercase;">CUPÓN DE PRIMERA COMPRA (15% OFF)</div>
            <div style="font-size: 24px; font-weight: 900; color: #9f1239; margin: 6px 0; letter-spacing: 1px;">BIENVENIDO15</div>
            <div style="font-size: 12px; color: #881337;">Aplica este cupón en el checkout para obtener 15% de descuento en tu primer pedido.</div>
          </div>

          <p>¿Qué te provoca hoy? Hamburguesas, sushi, pizzas artesanales o comida típica: todo al alcance de un clic.</p>
        `,
        actionButton: {
          text: "Explorar Restaurantes",
          url: data.appUrl || "http://localhost:5173",
        },
        extraNote: "Si no creaste esta cuenta, ignora este correo con total tranquilidad.",
      });
      return { subject, templatePath: "customer/welcome", html };
    }

    case NotificationEvent.CUSTOMER_VERIFY_EMAIL: {
      const subject = `Verifica tu correo electrónico — Go Eats`;
      const html = renderBaseLayout({
        title: "Confirma tu dirección de correo",
        recipientName,
        badge: "SEGURIDAD",
        badgeColor: "#3b82f6",
        contentHtml: `
          <p>Para proteger la seguridad de tu cuenta y asegurar que recibas las notificaciones de tus pedidos, necesitamos verificar tu correo electrónico.</p>
          <div class="card-box" style="text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #64748b;">Tu código de seguridad temporal es:</p>
            <div style="font-size: 28px; font-weight: 900; color: #0f172a; margin: 10px 0; letter-spacing: 4px;">${data.verificationCode || "784912"}</div>
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">Válido por los próximos 15 minutos.</p>
          </div>
        `,
        actionButton: {
          text: "Verificar mi Cuenta",
          url: data.verifyUrl || "http://localhost:5173",
          bgColor: "#3b82f6",
        },
      });
      return { subject, templatePath: "customer/verify-email", html };
    }

    case NotificationEvent.CUSTOMER_PASSWORD_RESET: {
      const subject = `Recuperación de contraseña — Go Eats`;
      const html = renderBaseLayout({
        title: "Restablece tu contraseña",
        recipientName,
        badge: "SEGURIDAD",
        badgeColor: "#f59e0b",
        contentHtml: `
          <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Go Eats.</p>
          <p>Haz clic en el siguiente botón para elegir una nueva contraseña segura:</p>
        `,
        actionButton: {
          text: "Restablecer Contraseña",
          url: data.resetUrl || "http://localhost:5173/auth?action=reset",
          bgColor: "#f59e0b",
        },
        extraNote: "Si no solicitaste este cambio, puedes ignorar este mensaje; tu contraseña actual seguirá siendo segura.",
      });
      return { subject, templatePath: "customer/password-reset", html };
    }

    case NotificationEvent.ORDER_CREATED: {
      const subject = `Pedido recibido #${data.orderNumber || data.orderId} — Go Eats`;
      const html = renderBaseLayout({
        title: `¡Hemos recibido tu pedido #${data.orderNumber || data.orderId}!`,
        recipientName,
        badge: "PEDIDO RECIBIDO",
        badgeColor: "#3b82f6",
        contentHtml: `
          <p>Tu orden ha sido enviada exitosamente al restaurante <strong>${data.restaurantName || "Restaurante"}</strong> y está a la espera de confirmación.</p>
          
          <div class="card-box">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 10px;">
              <span style="font-weight: 700; color: #1e293b;">Resumen del Pedido</span>
              <span style="font-weight: 700; color: #ff4757;">Total: $${Number(data.orderTotal || 0).toFixed(2)}</span>
            </div>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Restaurante:</strong> ${data.restaurantName || "Restaurante"}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Dirección de entrega:</strong> ${data.deliveryAddress || "A convenir"}</p>
            ${data.itemsList ? `<div style="margin-top: 8px; font-size: 13px; color: #64748b;">${data.itemsList}</div>` : ""}
          </div>

          <p>Te notificaremos en cuanto el restaurante empiece a preparar tus alimentos.</p>
        `,
        actionButton: {
          text: "Ver Estado del Pedido",
          url: data.trackingUrl || `http://localhost:5173/profile`,
        },
      });
      return { subject, templatePath: "customer/order-created", html };
    }

    case NotificationEvent.ORDER_ACCEPTED: {
      const subject = `¡Tu pedido #${data.orderNumber || data.orderId} fue aceptado! — Go Eats`;
      const html = renderBaseLayout({
        title: `¡El restaurante aceptó tu pedido!`,
        recipientName,
        badge: "PEDIDO ACEPTADO",
        badgeColor: "#10b981",
        contentHtml: `
          <p>El restaurante <strong>${data.restaurantName || "Restaurante"}</strong> ha aceptado tu pedido <strong>#${data.orderNumber || data.orderId}</strong> y pronto iniciará su preparación.</p>
          
          <div class="card-box" style="background-color: #ecfdf5; border-color: #a7f3d0;">
            <p style="margin: 0; font-size: 14px; color: #065f46; font-weight: 600;">
               Tiempo estimado de entrega: ${data.estimatedTime || "30 - 45 minutos"}
            </p>
          </div>
        `,
        actionButton: {
          text: "Rastrear Pedido en Vivo",
          url: data.trackingUrl || "http://localhost:5173/profile",
          bgColor: "#10b981",
        },
      });
      return { subject, templatePath: "customer/order-accepted", html };
    }

    case NotificationEvent.ORDER_PREPARING: {
      const subject = ` Tu pedido #${data.orderNumber || data.orderId} se está preparando — Go Eats`;
      const html = renderBaseLayout({
        title: `La cocina está en marcha`,
        recipientName,
        badge: "EN PREPARACIÓN",
        badgeColor: "#f59e0b",
        contentHtml: `
          <p>El chef de <strong>${data.restaurantName || "Restaurante"}</strong> ya está cocinando los platillos de tu pedido <strong>#${data.orderNumber || data.orderId}</strong>.</p>
          <p>Todo se prepara al momento con ingredientes frescos para que lo disfrutes al máximo.</p>
        `,
        actionButton: {
          text: "Seguir en el Mapa",
          url: data.trackingUrl || "http://localhost:5173/profile",
        },
      });
      return { subject, templatePath: "customer/order-preparing", html };
    }

    case NotificationEvent.DRIVER_ASSIGNED: {
      const subject = ` Repartidor asignado a tu pedido #${data.orderNumber || data.orderId} — Go Eats`;
      const html = renderBaseLayout({
        title: `Tu repartidor va en camino al local`,
        recipientName,
        badge: "REPARTIDOR ASIGNADO",
        badgeColor: "#6366f1",
        contentHtml: `
          <p>El motorizado <strong>${data.driverName || "Repartidor Go Eats"}</strong> ha sido asignado para recoger tu orden <strong>#${data.orderNumber || data.orderId}</strong> en <strong>${data.restaurantName}</strong>.</p>
          
          <div class="card-box" style="background-color: #eef2ff; border-color: #c7d2fe;">
            <div style="font-size: 13px; font-weight: 700; color: #3730a3;">PIN DE SEGURIDAD PARA ENTREGA:</div>
            <div style="font-size: 26px; font-weight: 900; color: #4338ca; margin: 6px 0; letter-spacing: 3px;">
              ${data.deliveryPin || "••••"}
            </div>
            <div style="font-size: 12px; color: #4f46e5;">Proporciona este código a tu repartidor al momento de recibir tu comida.</div>
          </div>
        `,
        actionButton: {
          text: "Rastrear Repartidor",
          url: data.trackingUrl || "http://localhost:5173/profile",
          bgColor: "#6366f1",
        },
      });
      return { subject, templatePath: "customer/driver-assigned", html };
    }

    case NotificationEvent.ORDER_ON_THE_WAY: {
      const subject = ` Tu pedido #${data.orderNumber || data.orderId} va en camino — Go Eats`;
      const html = renderBaseLayout({
        title: `¡Tu comida está muy cerca!`,
        recipientName,
        badge: "EN CAMINO",
        badgeColor: "#ff4757",
        contentHtml: `
          <p><strong>${data.driverName || "Tu repartidor"}</strong> ya recogió tu pedido en <strong>${data.restaurantName}</strong> y se dirige a tu dirección de entrega:</p>
          <div class="card-box">
            <p style="margin: 0; font-size: 13px; color: #1e293b;"> <strong>Destino:</strong> ${data.deliveryAddress || "Tu ubicación"}</p>
            ${data.deliveryPin ? `<p style="margin: 6px 0 0 0; font-size: 13px; color: #ff4757;"> <strong>PIN de entrega:</strong> ${data.deliveryPin}</p>` : ""}
          </div>
        `,
        actionButton: {
          text: "Ver Ubicación en Vivo",
          url: data.trackingUrl || "http://localhost:5173/profile",
        },
      });
      return { subject, templatePath: "customer/order-on-the-way", html };
    }

    case NotificationEvent.ORDER_DELIVERED: {
      const subject = ` ¡Pedido #${data.orderNumber || data.orderId} entregado! Buen provecho — Go Eats`;
      const html = renderBaseLayout({
        title: `¡Esperamos que disfrutes tu comida!`,
        recipientName,
        badge: "ENTREGADO",
        badgeColor: "#10b981",
        contentHtml: `
          <p>Tu pedido <strong>#${data.orderNumber || data.orderId}</strong> ha sido completado y entregado con éxito.</p>
          <p>Tu opinión es muy valiosa para nosotros y para <strong>${data.restaurantName || "el restaurante"}</strong>.</p>
        `,
        actionButton: {
          text: "Calificar el Servicio",
          url: data.appUrl || "http://localhost:5173/profile",
          bgColor: "#10b981",
        },
      });
      return { subject, templatePath: "customer/order-delivered", html };
    }

    case NotificationEvent.ORDER_CANCELLED: {
      const subject = `Pedido #${data.orderNumber || data.orderId} cancelado — Go Eats`;
      const html = renderBaseLayout({
        title: `Aviso sobre tu pedido #${data.orderNumber || data.orderId}`,
        recipientName,
        badge: "CANCELADO",
        badgeColor: "#ef4444",
        contentHtml: `
          <p>Lamentamos informarte que tu pedido <strong>#${data.orderNumber || data.orderId}</strong> ha sido cancelado.</p>
          ${data.reason ? `<div class="card-box" style="background-color: #fef2f2; border-color: #fecaca; color: #991b1b;"><p style="margin: 0; font-size: 13px;"><strong>Motivo:</strong> ${data.reason}</p></div>` : ""}
          <p>Si realizaste el pago en línea, la devolución o anulación de la transacción se procesará automáticamente.</p>
        `,
        actionButton: {
          text: "Ver Detalles",
          url: data.appUrl || "http://localhost:5173/profile",
          bgColor: "#64748b",
        },
      });
      return { subject, templatePath: "customer/order-cancelled", html };
    }

    // ==========================================
    // REPARTIDORES
    // ==========================================
    case NotificationEvent.DRIVER_WELCOME: {
      const subject = `¡Bienvenido al equipo de Repartidores Go Eats, ${recipientName}!`;
      const html = renderBaseLayout({
        title: `Cuenta de Repartidor Creada`,
        recipientName,
        badge: "DRIVER GO EATS",
        badgeColor: "#f59e0b",
        contentHtml: `
          <p>Gracias por postular como motorizado en la plataforma Go Eats. Tu perfil ha sido registrado y está a la espera de la validación de tus datos y documentos por el equipo administrativo.</p>
          <div class="card-box">
            <p style="margin: 0; font-size: 13px;">Tan pronto como tu cuenta sea aprobada, podrás activar el modo en línea y comenzar a generar ganancias con cada entrega.</p>
          </div>
        `,
        actionButton: {
          text: "Ir al Panel de Repartidor",
          url: "http://localhost:5173/driver",
          bgColor: "#f59e0b",
        },
      });
      return { subject, templatePath: "driver/welcome", html };
    }

    case NotificationEvent.DRIVER_APPROVED: {
      const subject = ` ¡Tu cuenta de repartidor ha sido APROBADA! — Go Eats`;
      const html = renderBaseLayout({
        title: `¡Felicidades! Ya puedes comenzar a repartir`,
        recipientName,
        badge: "APROBADO",
        badgeColor: "#10b981",
        contentHtml: `
          <p>Tu solicitud como motorizado en Go Eats ha sido revisada y <strong>aprobada oficialmente</strong>.</p>
          <p>Recuerda mantener tu app abierta, tu saldo de billetera con saldo disponible y tu equipo de protección siempre listo.</p>
        `,
        actionButton: {
          text: "Conectarse y Recibir Pedidos",
          url: "http://localhost:5173/driver",
          bgColor: "#10b981",
        },
      });
      return { subject, templatePath: "driver/approved", html };
    }

    case NotificationEvent.DRIVER_REJECTED: {
      const subject = `Estado de tu solicitud de repartidor — Go Eats`;
      const html = renderBaseLayout({
        title: `Actualización sobre tu solicitud`,
        recipientName,
        badge: "SOLICITUD NO APROBADA",
        badgeColor: "#ef4444",
        contentHtml: `
          <p>Agradecemos tu interés en formar parte de Go Eats. Por el momento, tu solicitud no ha podido ser aprobada.</p>
          ${data.reason ? `<div class="card-box" style="background-color: #fef2f2; border-color: #fecaca; color: #991b1b;"><p style="margin: 0; font-size: 13px;"><strong>Detalle:</strong> ${data.reason}</p></div>` : ""}
        `,
        actionButton: {
          text: "Contactar a Soporte",
          url: "http://localhost:5173",
          bgColor: "#64748b",
        },
      });
      return { subject, templatePath: "driver/rejected", html };
    }

    case NotificationEvent.DRIVER_NEW_ORDER: {
      const subject = ` ¡Nuevo pedido disponible para entrega #${data.orderNumber || data.orderId}! — Go Eats`;
      const html = renderBaseLayout({
        title: `Nuevo pedido asignado`,
        recipientName,
        badge: "NUEVO SERVICIO",
        badgeColor: "#6366f1",
        contentHtml: `
          <p>Tienes una nueva orden disponible para recoger:</p>
          <div class="card-box">
            <p style="margin: 4px 0; font-size: 13px;"><strong>Restaurante:</strong> ${data.restaurantName}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Dirección retiro:</strong> ${data.restaurantAddress || "Ver en app"}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Destino entrega:</strong> ${data.deliveryAddress || "Ver en app"}</p>
            <p style="margin: 4px 0; font-size: 14px; font-weight: 700; color: #10b981;"><strong>Tu ganancia estimada:</strong> $${Number(data.driverEarnings || 1.5).toFixed(2)}</p>
          </div>
        `,
        actionButton: {
          text: "Ver y Tomar Pedido",
          url: "http://localhost:5173/driver",
          bgColor: "#6366f1",
        },
      });
      return { subject, templatePath: "driver/new-order", html };
    }

    // ==========================================
    // RESTAURANTES
    // ==========================================
    case NotificationEvent.RESTAURANT_APPLICATION_RECEIVED: {
      const subject = `Solicitud de local recibida: ${data.restaurantName} — Go Eats`;
      const html = renderBaseLayout({
        title: `Hemos recibido la solicitud de tu local`,
        recipientName,
        badge: "SOLICITUD EN PROCESO",
        badgeColor: "#3b82f6",
        contentHtml: `
          <p>¡Gracias por querer formar parte de la red de locales gastronómicos de Go Eats!</p>
          <p>Hemos recibido los datos de registro de <strong>${data.restaurantName}</strong>. Nuestro equipo de soporte y administradores está revisando la información suministrada.</p>
          <div class="card-box">
            <p style="margin: 0; font-size: 13px; color: #64748b;">El tiempo de revisión habitual es de <strong>24 a 48 horas laborales</strong>. Te notificaremos inmediatamente en cuanto esté habilitado para vender.</p>
          </div>
        `,
        actionButton: {
          text: "Ver Panel del Restaurante",
          url: "http://localhost:5173/admin",
        },
      });
      return { subject, templatePath: "restaurant/application-received", html };
    }

    case NotificationEvent.RESTAURANT_UNDER_REVIEW: {
      const subject = `Tu local ${data.restaurantName} está en revisión — Go Eats`;
      const html = renderBaseLayout({
        title: `Tu restaurante se encuentra en fase de validación`,
        recipientName,
        badge: "EN REVISIÓN",
        badgeColor: "#f59e0b",
        contentHtml: `
          <p>Un administrador de Go Eats está validando la información fiscal, menú y configuración de entrega de <strong>${data.restaurantName}</strong>.</p>
          <p>Si necesitamos algún documento adicional, te lo solicitaremos por este medio.</p>
        `,
        actionButton: {
          text: "Ir a mi Panel",
          url: "http://localhost:5173/admin",
          bgColor: "#f59e0b",
        },
      });
      return { subject, templatePath: "restaurant/under-review", html };
    }

    case NotificationEvent.RESTAURANT_APPROVED: {
      const subject = ` ¡Tu local ${data.restaurantName} fue APROBADO! — Go Eats`;
      const html = renderBaseLayout({
        title: `¡Felicidades! Tu restaurante ya está activo`,
        recipientName,
        badge: "RESTAURANTE ACTIVO",
        badgeColor: "#10b981",
        contentHtml: `
          <p>Nos complace informarte que <strong>${data.restaurantName}</strong> ha sido aprobado con éxito por nuestro equipo administrativo.</p>
          <p>A partir de este instante, tu menú es visible para miles de clientes en la app y puedes comenzar a recibir pedidos en vivo tanto a domicilio como por código QR en mesa.</p>
          
          <div class="card-box" style="background-color: #ecfdf5; border-color: #a7f3d0;">
            <p style="margin: 0 0 6px 0; font-weight: 700; color: #065f46;">Próximos pasos recomendados:</p>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #047857;">
              <li>Carga tus mejores fotos en cada plato para maximizar ventas.</li>
              <li>Revisa tus horarios de atención en la sección de Ajustes.</li>
              <li>Imprime los códigos QR de tus mesas para autoservicio.</li>
            </ul>
          </div>
        `,
        actionButton: {
          text: "Acceder a mi Panel de Control",
          url: "http://localhost:5173/admin",
          bgColor: "#10b981",
        },
      });
      return { subject, templatePath: "restaurant/approved", html };
    }

    case NotificationEvent.RESTAURANT_REJECTED: {
      const subject = `Solicitud de local no aprobada: ${data.restaurantName} — Go Eats`;
      const html = renderBaseLayout({
        title: `Aviso sobre la postulación de tu local`,
        recipientName,
        badge: "NO APROBADO",
        badgeColor: "#ef4444",
        contentHtml: `
          <p>Tras revisar la postulación para <strong>${data.restaurantName}</strong>, lamentamos informarte que en esta ocasión no cumple con los criterios de admisión para operar en la plataforma.</p>
          ${data.reason ? `<div class="card-box" style="background-color: #fef2f2; border-color: #fecaca; color: #991b1b;"><p style="margin: 0; font-size: 13px;"><strong>Motivo:</strong> ${data.reason}</p></div>` : ""}
          <p>Puedes corregir la información requerida o contactar a soporte si consideras que se trata de un error.</p>
        `,
        actionButton: {
          text: "Contactar a Soporte",
          url: "http://localhost:5173",
          bgColor: "#64748b",
        },
      });
      return { subject, templatePath: "restaurant/rejected", html };
    }

    case NotificationEvent.RESTAURANT_NEW_ORDER: {
      const subject = ` ¡Nuevo pedido #${data.orderNumber || data.orderId} recibido! — Go Eats`;
      const html = renderBaseLayout({
        title: `¡Tienes una nueva comanda entrante!`,
        recipientName,
        badge: "NUEVO PEDIDO",
        badgeColor: "#ff4757",
        contentHtml: `
          <p>Se ha registrado un nuevo pedido para <strong>${data.restaurantName}</strong>.</p>
          <div class="card-box">
            <p style="margin: 4px 0; font-size: 13px;"><strong>Cliente:</strong> ${data.customerName || "Cliente Go Eats"}</p>
            <p style="margin: 4px 0; font-size: 13px;"><strong>Tipo de orden:</strong> ${data.orderType || "DELIVERY"}</p>
            <p style="margin: 4px 0; font-size: 14px; font-weight: 700; color: #10b981;"><strong>Total orden:</strong> $${Number(data.orderTotal || 0).toFixed(2)}</p>
          </div>
          <p>Ingresa de inmediato al panel POS o KDS de cocina para aceptar y preparar los platillos.</p>
        `,
        actionButton: {
          text: "Abrir Comanda en POS",
          url: "http://localhost:5173/admin",
        },
      });
      return { subject, templatePath: "restaurant/new-order", html };
    }

    default: {
      const subject = `Notificación de Go Eats`;
      const html = renderBaseLayout({
        title: "Actualización de tu cuenta Go Eats",
        recipientName,
        contentHtml: `<p>${data.message || "Tienes una nueva notificación de tu servicio en Go Eats."}</p>`,
      });
      return { subject, templatePath: "common/general", html };
    }
  }
}
