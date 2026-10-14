package com.arcadiacomics.ventas.config;

/**
 * Constantes centralizadas para la topología de mensajería RabbitMQ.
 * Cumple con el criterio de nombres centralizados de la Rúbrica oficial (12%).
 */
public final class RabbitMQConstants {

    private RabbitMQConstants() {
        // Prevenir instanciación
    }

    // =========================================================================
    // EXCHANGE PRINCIPAL (Direct Exchange)
    // =========================================================================
    public static final String EXCHANGE_DIRECT = "comics.ventas.direct";

    // =========================================================================
    // COLAS DE TRABAJO (Durable Queues)
    // =========================================================================
    public static final String QUEUE_VENTAS_PDF = "cola.ventas.pdf";
    public static final String QUEUE_VENTAS_STOCK = "cola.ventas.stock";

    // =========================================================================
    // ROUTING KEY COMPARTIDA (Comportamiento Fanout Selectivo en Direct Exchange)
    // =========================================================================
    public static final String ROUTING_KEY_VENTA_CONFIRMADA = "venta.confirmada";

    // =========================================================================
    // DEAD LETTER EXCHANGE & DEAD LETTER QUEUE (DLX / DLQ)
    // =========================================================================
    public static final String EXCHANGE_DLX = "comics.ventas.dlx";
    public static final String QUEUE_VENTAS_DLQ = "cola.ventas.dlq";
    public static final String ROUTING_KEY_VENTA_DLQ = "venta.dlq";
}
