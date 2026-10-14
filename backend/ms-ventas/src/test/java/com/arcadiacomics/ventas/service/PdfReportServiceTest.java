package com.arcadiacomics.ventas.service;

import com.arcadiacomics.ventas.dto.VentaEventoDTO;
import com.arcadiacomics.ventas.dto.VentaItemDTO;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PdfReportServiceTest {

    private final PdfReportService pdfReportService = new PdfReportService();

    @Test
    void testGenerarBoletaVentaPdfRetornaBytesValidos() {
        VentaItemDTO item1 = new VentaItemDTO("c001", "The Amazing Spider-Man #1", 12990.0, 2, "https://example.com/cover1.jpg");
        VentaItemDTO item2 = new VentaItemDTO("c004", "Watchmen", 18990.0, 1, "https://example.com/cover2.jpg");

        VentaEventoDTO venta = new VentaEventoDTO(
                "ORD-TEST-001",
                "u002",
                "Matias Barraza",
                "mat.barrazac@duocuc.cl",
                List.of(item1, item2),
                44970.0
        );

        byte[] pdfBytes = pdfReportService.generarBoletaVentaPdf(venta);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 500, "El PDF generado debe tener un tamaño razonable en bytes");

        // Los archivos PDF válidos inician con el encabezado "%PDF-"
        String header = new String(pdfBytes, 0, 5);
        assertEquals("%PDF-", header, "El documento generado debe comenzar con la firma de archivo PDF '%PDF-'");
    }
}
