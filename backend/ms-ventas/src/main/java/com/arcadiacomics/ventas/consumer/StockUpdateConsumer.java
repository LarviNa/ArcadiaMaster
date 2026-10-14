package com.arcadiacomics.ventas.consumer;

import com.arcadiacomics.ventas.config.RabbitMQConstants;
import com.arcadiacomics.ventas.dto.VentaEventoDTO;
import com.arcadiacomics.ventas.dto.VentaItemDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Consumidor de RabbitMQ para la cola 'cola.ventas.stock'.
 * Responsabilidades:
 * 1. Escuchar los eventos 'venta.confirmada' de compras en la tienda.
 * 2. Procesar el descuento de inventario por cada cómic del pedido.
 * 3. Mantener registro de auditoría y persistencia/simulación del inventario disponible.
 * 4. Manejo de excepciones y trazabilidad con SLF4J.
 */
@Service
public class StockUpdateConsumer {

    private static final Logger log = LoggerFactory.getLogger(StockUpdateConsumer.class);

    // Registro en memoria de inventario actualizado (simulación y trazabilidad de persistencia)
    private final Map<String, Integer> stockMockCache = new ConcurrentHashMap<>();

    public StockUpdateConsumer() {
        // Inicializar stock de prueba alineado con los 12 cómics de la tienda
        stockMockCache.put("c001", 15);
        stockMockCache.put("c002", 10);
        stockMockCache.put("c003", 20);
        stockMockCache.put("c004", 8);
        stockMockCache.put("c005", 25);
        stockMockCache.put("c006", 18);
        stockMockCache.put("c007", 30);
        stockMockCache.put("c008", 12);
        stockMockCache.put("c009", 14);
        stockMockCache.put("c010", 22);
        stockMockCache.put("c011", 9);
        stockMockCache.put("c012", 20);
    }

    @RabbitListener(queues = RabbitMQConstants.QUEUE_VENTAS_STOCK)
    public void procesarDescuentoStock(VentaEventoDTO venta) {
        log.info("======================================================================");
        log.info("📦 [COLA STOCK] Mensaje recibido desde '{}'", RabbitMQConstants.QUEUE_VENTAS_STOCK);
        log.info("   -> Orden ID: {}", venta.getIdVenta());
        log.info("   -> Cliente: {}", venta.getClienteNombre());
        log.info("   -> Total ítems a descontar: {}", venta.getItems() != null ? venta.getItems().size() : 0);

        // Disparo para demostración de resiliencia y Dead Letter Queue (DLQ)
        if (venta.getClienteEmail() != null && venta.getClienteEmail().toLowerCase().contains("dlq")) {
            log.error("💥 [SIMULACIÓN ERROR DLQ] Error forzado intencionalmente en StockUpdateConsumer para orden '{}'", venta.getIdVenta());
            log.error("💥 [SIMULACIÓN ERROR DLQ] Rechazando mensaje (NACK sin requeue). RabbitMQ lo enviará a 'comics.ventas.dlx' -> 'cola.ventas.dlq'.");
            throw new RuntimeException("Simulación de error en consumidor para verificación de Dead Letter Queue (DLQ)");
        }

        try {
            if (venta.getItems() == null || venta.getItems().isEmpty()) {
                log.warn("⚠️ [COLA STOCK] La orden '{}' no contiene ítems para descontar.", venta.getIdVenta());
                return;
            }

            for (VentaItemDTO item : venta.getItems()) {
                String comicId = item.getComicId();
                int cantidadComprada = item.getCantidad() != null ? item.getCantidad() : 1;

                int stockActual = stockMockCache.getOrDefault(comicId, 15);
                int nuevoStock = Math.max(0, stockActual - cantidadComprada);
                stockMockCache.put(comicId, nuevoStock);

                log.info("   📉 [INVENTARIO] Cómic: '{}' (ID: {})", item.getTitulo(), comicId);
                log.info("      - Cantidad comprada: {}", cantidadComprada);
                log.info("      - Stock previo: {}", stockActual);
                log.info("      - Nuevo stock disponible: {}", nuevoStock);
            }

            log.info("✅ [COLA STOCK] Inventario actualizado exitosamente para la orden '{}'", venta.getIdVenta());
            log.info("======================================================================");

        } catch (Exception e) {
            log.error("❌ [COLA STOCK] Error al actualizar inventario para orden '{}': {}",
                    venta.getIdVenta(), e.getMessage(), e);
            throw new RuntimeException("Fallo en actualización de stock: " + e.getMessage(), e);
        }
    }

    /**
     * Consulta el stock disponible en memoria para un cómic específico.
     */
    public int getStockActual(String comicId) {
        return stockMockCache.getOrDefault(comicId, 10);
    }
}
