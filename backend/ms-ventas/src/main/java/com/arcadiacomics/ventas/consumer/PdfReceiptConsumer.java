package com.arcadiacomics.ventas.consumer;

import com.arcadiacomics.ventas.config.RabbitMQConstants;
import com.arcadiacomics.ventas.dto.VentaEventoDTO;
import com.arcadiacomics.ventas.dto.VentaItemDTO;
import com.arcadiacomics.ventas.service.PdfReportService;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Consumidor de RabbitMQ para la cola 'cola.ventas.pdf'.
 * Responsabilidades:
 * 1. Escuchar mensajes del evento 'venta.confirmada'.
 * 2. Maquetar en memoria la boleta PDF con OpenPDF (ByteArrayOutputStream).
 * 3. Despachar el correo electrónico con el PDF adjunto mediante JavaMailSender.
 * 4. Manejo de excepciones y logging de trazabilidad completo.
 */
@Service
public class PdfReceiptConsumer {

    private static final Logger log = LoggerFactory.getLogger(PdfReceiptConsumer.class);

    private final PdfReportService pdfReportService;
    private final JavaMailSender mailSender;

    @Value("${arcadia.mail.from:ventas@arcadiacomics.cl}")
    private String mailFrom;

    public PdfReceiptConsumer(
            PdfReportService pdfReportService,
            @Autowired(required = false) JavaMailSender mailSender) {
        this.pdfReportService = pdfReportService;
        this.mailSender = mailSender;
    }

    @RabbitListener(queues = RabbitMQConstants.QUEUE_VENTAS_PDF)
    public void procesarBoletaYDespacho(VentaEventoDTO venta) {
        log.info("======================================================================");
        log.info("📥 [COLA PDF] Mensaje recibido desde '{}'", RabbitMQConstants.QUEUE_VENTAS_PDF);
        log.info("   -> Orden ID: {}", venta.getIdVenta());
        log.info("   -> Cliente: {} ({})", venta.getClienteNombre(), venta.getClienteEmail());
        log.info("   -> Total: ${}", venta.getTotal());
        log.info("   -> Cantidad de ítems: {}", venta.getItems() != null ? venta.getItems().size() : 0);

        try {
            // Disparo para demostración de resiliencia y Dead Letter Queue (DLQ)
            if (venta.getClienteEmail() != null && venta.getClienteEmail().toLowerCase().contains("dlq-pdf")) {
                log.error("💥 [SIMULACIÓN ERROR DLQ PDF] Error forzado intencionalmente en PdfReceiptConsumer para orden '{}'", venta.getIdVenta());
                log.error("💥 [SIMULACIÓN ERROR DLQ PDF] Rechazando mensaje (NACK). RabbitMQ lo enviará a 'comics.ventas.dlx' -> 'cola.ventas.dlq'.");
                throw new RuntimeException("Simulación de error forzado en generación de boleta PDF para Dead Letter Queue (DLQ)");
            }

            // 1. Generación del documento PDF en memoria
            byte[] pdfBytes = pdfReportService.generarBoletaVentaPdf(venta);
            log.info("📄 PDF generado exitosamente en memoria ({} bytes)", pdfBytes.length);

            // 2. Despacho del correo con el PDF adjunto
            enviarCorreoConBoleta(venta, pdfBytes);

            log.info("✅ [COLA PDF] Proceso de emisión de boleta completado para orden '{}'", venta.getIdVenta());
            log.info("======================================================================");

        } catch (Exception e) {
            log.error("❌ [COLA PDF] Error en procesamiento de boleta para orden '{}': {}",
                    venta.getIdVenta(), e.getMessage(), e);
            // El fallo controlado permite que la política de reintentos de Spring AMQP
            // redirija el mensaje al Dead Letter Exchange 'comics.ventas.dlx' si supera el umbral
            throw new RuntimeException("Fallo en procesamiento de boleta PDF: " + e.getMessage(), e);
        }
    }

    private void enviarCorreoConBoleta(VentaEventoDTO venta, byte[] pdfBytes) {
        if (mailSender == null) {
            log.warn("⚠️ JavaMailSender no está inicializado. Se omite el envío físico de correo.");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(mailFrom);
            helper.setTo(venta.getClienteEmail());
            helper.setSubject("Tu Comprobante de Compra - Arcadia Cómics (Orden #" + venta.getIdVenta() + ")");

            StringBuilder itemsHtml = new StringBuilder();
            itemsHtml.append("<table style='width: 100%; border-collapse: collapse; margin-top: 15px; background: #ffffff; border-radius: 6px; overflow: hidden; font-size: 13px; border: 1px solid #e2e8f0;'>")
                     .append("<thead><tr style='background: #2563eb; color: #ffffff;'>")
                     .append("<th style='padding: 8px; text-align: center; width: 50px;'>Portada</th>")
                     .append("<th style='padding: 8px; text-align: left;'>Cómic</th>")
                     .append("<th style='padding: 8px; text-align: center; width: 45px;'>Cant.</th>")
                     .append("<th style='padding: 8px; text-align: right; width: 85px;'>Precio</th>")
                     .append("<th style='padding: 8px; text-align: right; width: 85px;'>Subtotal</th>")
                     .append("</tr></thead><tbody>");

            if (venta.getItems() != null) {
                for (VentaItemDTO it : venta.getItems()) {
                    String imgTag = (it.getCoverImage() != null && !it.getCoverImage().isBlank())
                            ? "<img src='" + it.getCoverImage() + "' width='42' height='60' style='border-radius: 4px; object-fit: cover; box-shadow: 0 1px 3px rgba(0,0,0,0.2);' />"
                            : "<div style='width: 42px; height: 60px; background: #e2e8f0; border-radius: 4px; font-size: 10px; color: #64748b; line-height: 60px; text-align: center;'>📖</div>";

                    double precio = it.getPrecio() != null ? it.getPrecio() : 0.0;
                    double subtotal = it.getSubtotal() != null ? it.getSubtotal() : (precio * it.getCantidad());

                    itemsHtml.append("<tr style='border-bottom: 1px solid #f1f5f9;'>")
                             .append("<td style='padding: 6px; text-align: center; vertical-align: middle;'>").append(imgTag).append("</td>")
                             .append("<td style='padding: 6px; vertical-align: middle;'><strong>").append(it.getTitulo()).append("</strong><br/><span style='font-size: 11px; color: #64748b;'>ID: ").append(it.getComicId()).append("</span></td>")
                             .append("<td style='padding: 6px; text-align: center; vertical-align: middle;'>").append(it.getCantidad()).append("</td>")
                             .append("<td style='padding: 6px; text-align: right; vertical-align: middle;'>$").append(String.format("%,.0f", precio)).append("</td>")
                             .append("<td style='padding: 6px; text-align: right; vertical-align: middle; font-weight: bold;'>$").append(String.format("%,.0f", subtotal)).append("</td>")
                             .append("</tr>");
                }
            }
            itemsHtml.append("</tbody></table>");

            double total = venta.getTotal() != null ? venta.getTotal() : 0.0;
            double neto = total / 1.19;
            double iva = total - neto;

            String cuerpoHtml = "<div style='font-family: Arial, sans-serif; color: #333; max-width: 650px; margin: 0 auto;'>"
                    + "<div style='background: #2563eb; color: #fff; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;'>"
                    + "<h1 style='margin: 0; font-size: 24px;'>Arcadia Cómics Store</h1>"
                    + "<p style='margin: 5px 0 0 0; font-size: 14px;'>¡Gracias por tu compra! Tu pedido está en camino.</p>"
                    + "</div>"
                    + "<div style='background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0;'>"
                    + "<p style='margin-top: 0;'>Hola <strong>" + venta.getClienteNombre() + "</strong>,</p>"
                    + "<p>Tu orden <strong>#" + venta.getIdVenta() + "</strong> ha sido confirmada y procesada exitosamente.</p>"
                    + "<h3 style='color: #1e293b; margin-bottom: 5px;'>Resumen de tu Compra:</h3>"
                    + itemsHtml.toString()
                    + "<div style='margin-top: 15px; padding: 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; text-align: right;'>"
                    + "<p style='margin: 2px 0; font-size: 12px; color: #475569;'>Neto: <strong>$" + String.format("%,.0f", neto) + " CLP</strong></p>"
                    + "<p style='margin: 2px 0; font-size: 12px; color: #475569;'>IVA (19%): <strong>$" + String.format("%,.0f", iva) + " CLP</strong></p>"
                    + "<h2 style='margin: 5px 0 0 0; color: #2563eb; font-size: 18px;'>Total Pagado: $" + String.format("%,.0f", total) + " CLP</h2>"
                    + "</div>"
                    + "<p style='margin-top: 18px; font-size: 13px; color: #334155;'>📎 Adjunto a este correo encontrarás tu <strong>Boleta Electrónica Oficial en formato PDF</strong> con el timbre electrónico tributario y el detalle para imprimir o guardar.</p>"
                    + "<p style='color: #64748b; font-size: 11px; margin-bottom: 0;'>Este mensaje fue emitido automáticamente por la arquitectura desacoplada orientada a eventos con RabbitMQ ('cola.ventas.pdf').</p>"
                    + "</div>"
                    + "<div style='text-align: center; color: #94a3b8; font-size: 11px; padding: 15px;'>"
                    + "Arcadia Cómics Store · DSY1107 Desarrollo Cloud Native I"
                    + "</div>"
                    + "</div>";

            helper.setText(cuerpoHtml, true);

            // Adjuntar PDF generado desde el buffer en memoria
            String nombreArchivo = "Boleta-Arcadia-" + venta.getIdVenta() + ".pdf";
            helper.addAttachment(nombreArchivo, new ByteArrayResource(pdfBytes), "application/pdf");

            log.info("📧 Enviando correo con boleta adjunta a '{}'...", venta.getClienteEmail());
            mailSender.send(message);
            log.info("✉️ Correo despachado exitosamente a '{}' con archivo '{}'", venta.getClienteEmail(), nombreArchivo);

        } catch (Exception e) {
            log.warn("⚠️ Servidor SMTP no alcanzable en entorno local ({}).", e.getMessage());
            log.info("ℹ️ [MODO DEMO SMTP] El PDF fue generado en memoria ({} bytes) y está listo para ser despachado cuando el servidor SMTP esté conectado.", pdfBytes.length);
        }
    }
}
