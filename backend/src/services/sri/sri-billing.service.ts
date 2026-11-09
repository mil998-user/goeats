import fs from "fs";
import path from "path";
import { prisma } from "../../config/database";
import { SriClient } from "./sri-client";
import { signXml } from "./sri-signer";
import { generateClaveAcceso } from "./sri-utils";
import { generateInvoiceXml } from "./xml-generator";
import { generateRidePdf } from "./ride-generator";
import { sendInvoiceEmail } from "../email";
import { decryptSecret } from "../../utils/secrets";

export interface EmitBillingResult {
  success: boolean;
  invoiceId?: number;
  claveAcceso?: string;
  estado?: string;
  error?: string;
}

/**
 * Service to orchestrate the entire electronic billing process (SRI Ecuador) for a Sale
 */
export async function emitElectronicInvoice(saleId: number): Promise<EmitBillingResult> {
  try {
    // 1. Fetch sale with all necessary details
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        order: {
          include: {
            items: {
              include: {
                variant: {
                  include: { menuItem: true },
                },
              },
            },
          },
        },
        client: true,
        restaurant: {
          include: { issuer: true },
        },
      },
    });

    if (!sale) {
      return { success: false, error: "Sale not found" };
    }

    const { restaurant, client, order } = sale;
    const issuer = restaurant.issuer;

    if (!issuer) {
      return { success: false, error: "Falta configurar los datos de facturación del restaurante" };
    }

    // 2. Map items for XML generator
    const xmlItems = order.items.map((item) => {
      const isTaxable = item.variant.menuItem.productionAreaId !== null; // Let's say Cocina/Bar production items have 12% IVA, others 0%
      // Or we can check if it is standard. For simplicity, let's say if taxRate > 0, we apply 12.0 or 15.0.
      const ivaVal = sale.taxRate; 
      
      return {
        nombre: item.variant.menuItem.name + " (" + item.variant.name + ")",
        codigoPrincipal: item.variant.code || `PROD-${item.variant.id}`,
        descripcion: item.comments,
        precioUnitario: item.price,
        cantidad: item.quantity,
        descuento: 0,
        ivaPercentage: ivaVal,
      };
    });

    // 3. Generate key
    const typeEmission = "1"; // Normal emission
    const sequentialCode = sale.numberDoc; // 9 digits sequential e.g. "000000001"
    
    const claveAcceso = generateClaveAcceso({
      fecha: sale.createdAt,
      tipoComprobante: "01", // Factura
      ruc: issuer.ruc,
      ambiente: issuer.ambiente,
      establecimiento: issuer.establecimiento,
      puntoEmision: issuer.puntoEmision,
      secuencial: sequentialCode,
      codigoNumerico: "12345678", // Default numeric code
      tipoEmision: typeEmission,
    });

    // 4. Generate XML
    const xmlResult = generateInvoiceXml({
      secuencial: sequentialCode,
      ambiente: issuer.ambiente,
      establecimiento: issuer.establecimiento,
      puntoEmision: issuer.puntoEmision,
      fechaEmision: sale.createdAt,
      formaPago: sale.paymentMethod, // "01" (cash), "20" (card)
      emisor: {
        ruc: issuer.ruc,
        razonSocial: issuer.razonSocial,
        nombreComercial: issuer.nombreEmpresa,
        direccionMatriz: issuer.direccion,
        direccionEstablecimiento: issuer.direccion,
        obligadoContabilidad: issuer.obligadoContabilidad,
        regimen: issuer.regimen,
      },
      comprador: {
        nombres: client.name,
        tipoIdentificacion: client.typeId, // "04" (RUC), "05" (Cedula)
        identificacion: client.identification,
        direccion: client.address,
        email: client.email,
      },
      items: xmlItems,
    });
    const xmlContent = xmlResult.xml;

    // 5. Create active Invoice record
    const invoice = await prisma.invoice.create({
      data: {
        secuencial: sequentialCode,
        claveAcceso,
        xmlNoFirmado: xmlContent,
        estado: "CREADA",
        fechaEmision: sale.createdAt,
        tipoAmbiente: issuer.ambiente,
        subtotal0: sale.subtotal0,
        subtotalIva: sale.subtotalTax,
        valorIva: sale.taxValue,
        total: sale.total,
        formaPago: sale.paymentMethod,
        clientId: client.id,
        issuerId: issuer.id,
        saleId: sale.id,
      },
    });

    // If no p12 certificate or password is set, we skip the signing and live SOAP sending.
    // This is great for dry-runs, test restaurants, or when certificate is pending upload.
    if (!issuer.firmaElectronica || !issuer.codigoSri) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { estado: "FIRMADA" },
      });
      return {
        success: true,
        invoiceId: invoice.id,
        claveAcceso,
        estado: "FIRMADA",
        error: "Firmado local. Falta subir firma electrónica (.p12) para enviar al SRI.",
      };
    }

    // 6. Sign XML
    let signedXml: string;
    try {
      signedXml = await signXml(xmlContent, decryptSecret(issuer.firmaElectronica), decryptSecret(issuer.codigoSri));
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { estado: "FIRMADA" },
      });
    } catch (e: any) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { estado: "RECHAZADA", observaciones: `Error de firma: ${e.message}` },
      });
      return { success: false, error: `Error al firmar factura: ${e.message}` };
    }

    // 7. Send to SRI Reception
    const clientSoap = new SriClient();
    const xmlSignedBase64 = Buffer.from(signedXml, "utf-8").toString("base64");
    
    let recepcionResult;
    try {
      recepcionResult = await clientSoap.validarComprobante(xmlSignedBase64, issuer.ambiente);
    } catch (e: any) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { observaciones: `SRI Recepción no disponible: ${e.message}` },
      });
      return { success: true, invoiceId: invoice.id, claveAcceso, estado: "FIRMADA", error: "Enviado localmente. SRI Recepción no disponible." };
    }

    if (recepcionResult.estado !== "RECIBIDA") {
      const errorMsg = recepcionResult.mensajes.map((m: any) => `${m.mensaje} (${m.informacionAdicional || ""})`).join(" | ");
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { estado: "DEVUELTA", observaciones: `Rechazado Recepción: ${errorMsg}` },
      });
      return { success: false, error: `Rechazado por el SRI en Recepción: ${errorMsg}` };
    }

    // 8. Query SRI Authorization (loop query or simple wait)
    // We wait 2 seconds and query.
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    let autorizacionResult;
    try {
      autorizacionResult = await clientSoap.autorizacionComprobante(claveAcceso, issuer.ambiente);
    } catch (e: any) {
      return { success: true, invoiceId: invoice.id, claveAcceso, estado: "RECIBIDA", error: "Enviado al SRI, pero falló la consulta de autorización." };
    }

    if (autorizacionResult.estado !== "AUTORIZADO") {
      const errorMsg = autorizacionResult.mensajes.map((m: any) => `${m.mensaje} (${m.informacionAdicional || ""})`).join(" | ");
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { estado: "RECHAZADA", observaciones: `Rechazado Autorización: ${errorMsg}` },
      });
      return { success: false, error: `No autorizado por el SRI: ${errorMsg}` };
    }

    // 9. Successfully authorized! Update invoice database record
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        estado: "AUTORIZADA",
        xmlAutorizado: autorizacionResult.comprobanteXml || signedXml,
      },
    });

    // 10. Generate PDF RIDE using the generator we copied!
    let pdfBuffer: Buffer | null = null;
    try {
      pdfBuffer = await generateRidePdf({
        secuencial: sequentialCode,
        establecimiento: issuer.establecimiento,
        puntoEmision: issuer.puntoEmision,
        claveAcceso,
        numeroAutorizacion: claveAcceso, // La clave de acceso sirve de número de autorización offline
        fechaAutorizacion: autorizacionResult.fechaAutorizacion || new Date().toISOString(),
        ambiente: issuer.ambiente,
        tipoEmision: "NORMAL",
        fechaEmision: sale.createdAt.toLocaleDateString(),
        formaPagoText: sale.paymentMethod === "01" ? "EFECTIVO" : "TARJETA / TRANSFERENCIA",
        subtotal0: sale.subtotal0,
        subtotalIva: sale.subtotalTax,
        valorIva: sale.taxValue,
        ivaPercentage: sale.taxRate,
        total: sale.total,
        emisor: {
          ruc: issuer.ruc,
          razonSocial: issuer.razonSocial,
          nombreComercial: issuer.nombreEmpresa,
          direccionMatriz: issuer.direccion,
          direccionEstablecimiento: issuer.direccion,
          obligadoContabilidad: issuer.obligadoContabilidad,
          regimen: issuer.regimen,
        },
        comprador: {
          nombres: client.name,
          identificacion: client.identification,
          tipoIdentificacion: client.typeId,
          direccion: client.address,
          email: client.email,
        },
        items: xmlItems.map(item => ({
          codigoPrincipal: item.codigoPrincipal,
          nombre: item.nombre,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          descuento: item.descuento,
          total: item.precioUnitario * item.cantidad
        })),
      });

      // Save PDF representation in DB
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { pdfRIDE: pdfBuffer.toString("base64") },
      });
    } catch (e) {
      console.error("Error generating RIDE PDF:", e);
    }

    // 11. Send Email to client
    if (pdfBuffer && client.email) {
      try {
        await sendInvoiceEmail({
          to: client.email,
          invoiceNumber: `${issuer.establecimiento}-${issuer.puntoEmision}-${sequentialCode}`,
          xmlContent: autorizacionResult.comprobanteXml || signedXml,
          pdfBuffer,
          businessName: issuer.nombreEmpresa || issuer.razonSocial,
          customerName: client.name,
        });
      } catch (e) {
        console.error("Failed to send email:", e);
      }
    }

    return {
      success: true,
      invoiceId: invoice.id,
      claveAcceso,
      estado: "AUTORIZADA",
    };
  } catch (error: any) {
    console.error("Billing service failed:", error);
    return { success: false, error: error.message || "Billing service error" };
  }
}
