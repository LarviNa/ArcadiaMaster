package com.arcadiacomics.ventas.service;

import com.arcadiacomics.ventas.dto.VentaEventoDTO;
import com.arcadiacomics.ventas.dto.VentaItemDTO;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.text.NumberFormat;
import java.util.Locale;

/**
 * Servicio encargado de maquetar comprobantes / boletas de venta en formato PDF en memoria.
 * Utiliza OpenPDF para una generación rápida, ligera y con soporte de imágenes y detalle completo.
 */
@Service
public class PdfReportService {

    private static final Logger log = LoggerFactory.getLogger(PdfReportService.class);

    private static final Color COLOR_PRIMARY = new Color(37, 99, 235);    // Azul Arcadia
    private static final Color COLOR_DARK = new Color(15, 23, 42);        // Slate oscuro
    private static final Color COLOR_ACCENT = new Color(16, 185, 129);    // Verde éxito
    private static final Color COLOR_ROW_ALT = new Color(248, 250, 252);  // Gris muy claro
    private static final Color COLOR_BORDER = new Color(226, 232, 240);   // Gris borde

    /**
     * Genera la boleta electrónica en memoria para la venta recibida con detalle completo e imágenes.
     *
     * @param venta DTO del evento de venta con cliente, ítems, imágenes y montos.
     * @return arreglo de bytes con el contenido del PDF generado.
     */
    public byte[] generarBoletaVentaPdf(VentaEventoDTO venta) {
        log.info("📄 Generando boleta PDF completa con imágenes para la orden: {}", venta.getIdVenta());

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 32, 32, 36, 36);
            PdfWriter.getInstance(document, baos);
            document.open();

            // Fuentes tipográficas
            Font fontTituloEmpresa = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, COLOR_PRIMARY);
            Font fontSubtitulo = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, COLOR_DARK);
            Font fontTexto = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.DARK_GRAY);
            Font fontTextoBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, COLOR_DARK);
            Font fontTextoMuted = FontFactory.getFont(FontFactory.HELVETICA, 8, new Color(100, 116, 139));
            Font fontHeaderTabla = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
            Font fontTotal = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, COLOR_PRIMARY);

            NumberFormat formatoMoneda = NumberFormat.getCurrencyInstance(new Locale("es", "CL"));
            formatoMoneda.setMaximumFractionDigits(0);

            // =========================================================================
            // 1. ENCABEZADO CORPORATIVO
            // =========================================================================
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{62, 38});

            PdfPCell cellLeft = new PdfPCell();
            cellLeft.setBorder(Rectangle.NO_BORDER);
            cellLeft.addElement(new Paragraph("ARCADIA CÓMICS STORE", fontTituloEmpresa));
            cellLeft.addElement(new Paragraph("Tienda Oficial de Cómics, Manga & Coleccionables · Cloud Native", fontTexto));
            cellLeft.addElement(new Paragraph("RUT: 76.543.210-K · Casa Matriz: Av. Providencia 1234, Santiago, Chile", fontTextoMuted));
            cellLeft.addElement(new Paragraph("Contacto: ventas@arcadiacomics.cl · Web: https://arcadiacomics.cl", fontTextoMuted));
            headerTable.addCell(cellLeft);

            PdfPCell cellRight = new PdfPCell();
            cellRight.setBorder(Rectangle.BOX);
            cellRight.setBorderColor(COLOR_PRIMARY);
            cellRight.setBorderWidth(1.5f);
            cellRight.setPadding(8);
            cellRight.setBackgroundColor(new Color(239, 246, 255));
            cellRight.setHorizontalAlignment(Element.ALIGN_CENTER);

            Paragraph pBoleta = new Paragraph("BOLETA ELECTRÓNICA", fontSubtitulo);
            pBoleta.setAlignment(Element.ALIGN_CENTER);
            cellRight.addElement(pBoleta);

            Paragraph pFolio = new Paragraph("FOLIO: " + venta.getIdVenta().toUpperCase(), fontTextoBold);
            pFolio.setAlignment(Element.ALIGN_CENTER);
            cellRight.addElement(pFolio);

            String fechaStr = venta.getFechaVenta() != null ? venta.getFechaVenta().replace("T", " ") : "Fecha actual";
            Paragraph pFecha = new Paragraph("Emisión: " + fechaStr, fontTextoMuted);
            pFecha.setAlignment(Element.ALIGN_CENTER);
            cellRight.addElement(pFecha);

            headerTable.addCell(cellRight);
            document.add(headerTable);

            document.add(new Paragraph(" "));

            // =========================================================================
            // 2. DATOS DEL CLIENTE Y DESPACHO
            // =========================================================================
            PdfPTable clientTable = new PdfPTable(2);
            clientTable.setWidthPercentage(100);
            clientTable.setWidths(new float[]{60, 40});

            PdfPCell cCliente = new PdfPCell();
            cCliente.setBorder(Rectangle.BOX);
            cCliente.setBorderColor(COLOR_BORDER);
            cCliente.setBackgroundColor(COLOR_ROW_ALT);
            cCliente.setPadding(8);

            cCliente.addElement(new Paragraph("RECEPTOR / CLIENTE", fontTextoBold));
            cCliente.addElement(new Paragraph("Nombre: " + venta.getClienteNombre(), fontTexto));
            cCliente.addElement(new Paragraph("Email: " + venta.getClienteEmail(), fontTexto));
            cCliente.addElement(new Paragraph("Tipo de Entrega: Despacho a Domicilio / Retiro en Tienda", fontTextoMuted));
            clientTable.addCell(cCliente);

            PdfPCell cPago = new PdfPCell();
            cPago.setBorder(Rectangle.BOX);
            cPago.setBorderColor(COLOR_BORDER);
            cPago.setBackgroundColor(COLOR_ROW_ALT);
            cPago.setPadding(8);

            cPago.addElement(new Paragraph("INFORMACIÓN DE PAGO", fontTextoBold));
            cPago.addElement(new Paragraph("Estado: " + venta.getEstado() + " (Aprobado)", fontTextoBold));
            cPago.addElement(new Paragraph("Medio de Pago: Tarjeta Débito / Crédito Webpay", fontTexto));
            cPago.addElement(new Paragraph("Canal de Venta: Tienda Online (Arquitectura RabbitMQ)", fontTextoMuted));
            clientTable.addCell(cPago);

            document.add(clientTable);
            document.add(new Paragraph(" "));

            // =========================================================================
            // 3. TABLA DE ÍTEMS / CÓMICS CON PORTADA
            // =========================================================================
            // Columnas: [#, Portada, Título / Descripción, Cant., P. Unitario, Subtotal]
            PdfPTable itemsTable = new PdfPTable(6);
            itemsTable.setWidthPercentage(100);
            itemsTable.setWidths(new float[]{6, 14, 42, 10, 14, 14});

            String[] headers = {"#", "Portada", "Descripción del Cómic", "Cant.", "Precio Unit.", "Subtotal"};
            for (String h : headers) {
                PdfPCell cellH = new PdfPCell(new Phrase(h, fontHeaderTabla));
                cellH.setBackgroundColor(COLOR_PRIMARY);
                cellH.setPadding(6);
                cellH.setHorizontalAlignment(Element.ALIGN_CENTER);
                cellH.setVerticalAlignment(Element.ALIGN_MIDDLE);
                itemsTable.addCell(cellH);
            }

            int index = 1;
            double sumaSubtotales = 0.0;
            if (venta.getItems() != null && !venta.getItems().isEmpty()) {
                for (VentaItemDTO item : venta.getItems()) {
                    Color rowBg = (index % 2 == 0) ? COLOR_ROW_ALT : Color.WHITE;

                    // #1: Índice
                    PdfPCell cIndex = new PdfPCell(new Phrase(String.valueOf(index++), fontTexto));
                    cIndex.setBackgroundColor(rowBg);
                    cIndex.setHorizontalAlignment(Element.ALIGN_CENTER);
                    cIndex.setVerticalAlignment(Element.ALIGN_MIDDLE);
                    cIndex.setPadding(4);
                    itemsTable.addCell(cIndex);

                    // #2: Portada del Cómic
                    PdfPCell cImg = new PdfPCell();
                    cImg.setBackgroundColor(rowBg);
                    cImg.setHorizontalAlignment(Element.ALIGN_CENTER);
                    cImg.setVerticalAlignment(Element.ALIGN_MIDDLE);
                    cImg.setPadding(4);

                    Image comicCover = descargarImagenComic(item.getCoverImage());
                    if (comicCover != null) {
                        comicCover.setAlignment(Element.ALIGN_CENTER);
                        cImg.addElement(comicCover);
                    } else {
                        // Placeholder visual de portada si no está disponible la imagen en línea
                        Paragraph pPlaceholder = new Paragraph("📖\n[Portada]", fontTextoMuted);
                        pPlaceholder.setAlignment(Element.ALIGN_CENTER);
                        cImg.addElement(pPlaceholder);
                    }
                    itemsTable.addCell(cImg);

                    // #3: Título del Cómic
                    PdfPCell cTitle = new PdfPCell();
                    cTitle.setBackgroundColor(rowBg);
                    cTitle.setVerticalAlignment(Element.ALIGN_MIDDLE);
                    cTitle.setPadding(5);
                    cTitle.addElement(new Paragraph(item.getTitulo(), fontTextoBold));
                    cTitle.addElement(new Paragraph("ID Cómic: " + item.getComicId() + " · Edición Coleccionista", fontTextoMuted));
                    itemsTable.addCell(cTitle);

                    // #4: Cantidad
                    PdfPCell cCant = new PdfPCell(new Phrase(String.valueOf(item.getCantidad()), fontTexto));
                    cCant.setBackgroundColor(rowBg);
                    cCant.setHorizontalAlignment(Element.ALIGN_CENTER);
                    cCant.setVerticalAlignment(Element.ALIGN_MIDDLE);
                    cCant.setPadding(4);
                    itemsTable.addCell(cCant);

                    // #5: Precio Unitario
                    double pUnit = item.getPrecio() != null ? item.getPrecio() : 0.0;
                    PdfPCell cPrice = new PdfPCell(new Phrase(formatoMoneda.format(pUnit), fontTexto));
                    cPrice.setBackgroundColor(rowBg);
                    cPrice.setHorizontalAlignment(Element.ALIGN_RIGHT);
                    cPrice.setVerticalAlignment(Element.ALIGN_MIDDLE);
                    cPrice.setPadding(4);
                    itemsTable.addCell(cPrice);

                    // #6: Subtotal
                    double sub = item.getSubtotal() != null ? item.getSubtotal() : (pUnit * item.getCantidad());
                    sumaSubtotales += sub;
                    PdfPCell cSub = new PdfPCell(new Phrase(formatoMoneda.format(sub), fontTextoBold));
                    cSub.setBackgroundColor(rowBg);
                    cSub.setHorizontalAlignment(Element.ALIGN_RIGHT);
                    cSub.setVerticalAlignment(Element.ALIGN_MIDDLE);
                    cSub.setPadding(4);
                    itemsTable.addCell(cSub);
                }
            } else {
                PdfPCell emptyCell = new PdfPCell(new Phrase("No hay ítems registrados", fontTexto));
                emptyCell.setColspan(6);
                emptyCell.setPadding(8);
                emptyCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                itemsTable.addCell(emptyCell);
            }

            document.add(itemsTable);
            document.add(new Paragraph(" "));

            // =========================================================================
            // 4. TOTALES Y DESGLOSE TRIBUTARIO (IVA 19%)
            // =========================================================================
            PdfPTable totalTable = new PdfPTable(2);
            totalTable.setWidthPercentage(100);
            totalTable.setWidths(new float[]{55, 45});

            PdfPCell cellMensaje = new PdfPCell();
            cellMensaje.setBorder(Rectangle.NO_BORDER);
            Paragraph pAgradecimiento = new Paragraph("¡Gracias por tu compra en Arcadia Cómics!", fontTextoBold);
            Paragraph pEvento = new Paragraph("Comprobante generado y validado a través de RabbitMQ ('cola.ventas.pdf').", fontTextoMuted);
            Paragraph pResolucion = new Paragraph("Timbre Electrónico D.S.I. · Verifique validez en www.sii.cl", fontTextoMuted);
            cellMensaje.addElement(pAgradecimiento);
            cellMensaje.addElement(pEvento);
            cellMensaje.addElement(pResolucion);
            totalTable.addCell(cellMensaje);

            double totalFinal = venta.getTotal() != null ? venta.getTotal() : sumaSubtotales;
            double neto = totalFinal / 1.19;
            double iva = totalFinal - neto;

            PdfPCell cellTotal = new PdfPCell();
            cellTotal.setBorder(Rectangle.BOX);
            cellTotal.setBorderColor(COLOR_PRIMARY);
            cellTotal.setPadding(8);
            cellTotal.setBackgroundColor(new Color(240, 249, 255));

            PdfPTable desgloseTable = new PdfPTable(2);
            desgloseTable.setWidthPercentage(100);
            desgloseTable.setWidths(new float[]{60, 40});

            agregarFilaTotales(desgloseTable, "Monto Neto:", formatoMoneda.format(neto), fontTexto);
            agregarFilaTotales(desgloseTable, "IVA (19%):", formatoMoneda.format(iva), fontTexto);
            agregarFilaTotales(desgloseTable, "TOTAL PAGADO:", formatoMoneda.format(totalFinal), fontTotal);

            cellTotal.addElement(desgloseTable);
            totalTable.addCell(cellTotal);

            document.add(totalTable);
            document.close();

            byte[] pdfBytes = baos.toByteArray();
            log.info("✅ Boleta PDF con portadas generada exitosamente (tamaño: {} bytes)", pdfBytes.length);
            return pdfBytes;

        } catch (Exception e) {
            log.error("❌ Error al generar la boleta PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Error en generación de PDF: " + e.getMessage(), e);
        }
    }

    private void agregarFilaTotales(PdfPTable table, String label, String valor, Font font) {
        PdfPCell c1 = new PdfPCell(new Phrase(label, font));
        c1.setBorder(Rectangle.NO_BORDER);
        c1.setPadding(2);
        table.addCell(c1);

        PdfPCell c2 = new PdfPCell(new Phrase(valor, font));
        c2.setBorder(Rectangle.NO_BORDER);
        c2.setHorizontalAlignment(Element.ALIGN_RIGHT);
        c2.setPadding(2);
        table.addCell(c2);
    }

    /**
     * Intenta descargar y escalar la imagen de la portada del cómic con timeout estricto.
     * Si no está disponible o falla, retorna null para aplicar el fallback visual.
     */
    private Image descargarImagenComic(String urlStr) {
        if (urlStr == null || urlStr.trim().isEmpty()) {
            return null;
        }

        try {
            URI uri = URI.create(urlStr.trim());
            URL url = uri.toURL();
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(2000);
            conn.setReadTimeout(2000);
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            conn.setInstanceFollowRedirects(true);

            int responseCode = conn.getResponseCode();
            if (responseCode == HttpURLConnection.HTTP_OK) {
                try (InputStream in = conn.getInputStream();
                     ByteArrayOutputStream buffer = new ByteArrayOutputStream()) {
                    byte[] data = new byte[4096];
                    int nRead;
                    while ((nRead = in.read(data, 0, data.length)) != -1) {
                        buffer.write(data, 0, nRead);
                    }
                    byte[] imgBytes = buffer.toByteArray();
                    Image img = Image.getInstance(imgBytes);
                    img.scaleToFit(38, 54); // Escala perfecta para la celda de la tabla
                    return img;
                }
            }
        } catch (Exception e) {
            log.debug("No se pudo cargar la imagen del cómic desde {}: {}", urlStr, e.getMessage());
        }
        return null;
    }
}
