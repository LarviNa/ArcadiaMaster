package com.arcadiacomics.ventas.service;

import com.arcadiacomics.ventas.config.RabbitMQConstants;
import com.arcadiacomics.ventas.dto.OrderEventDTO;
import com.arcadiacomics.ventas.dto.VentaEventoDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

/**
 * Productor de eventos de RabbitMQ para el dominio de Ventas.
 * Publica eventos desacoplados hacia el Direct Exchange 'comics.ventas.direct'
 * con la routing key 'venta.confirmada'.
 */
@Service
public class OrderEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(OrderEventPublisher.class);

    private final RabbitTemplate rabbitTemplate;

    public OrderEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    /**
     * Publica el evento de venta confirmada al exchange Direct de RabbitMQ.
     * Ambas colas ('cola.ventas.pdf' y 'cola.ventas.stock') reciben este mensaje simultáneamente.
     */
    public void publicarVentaConfirmada(VentaEventoDTO evento) {
        log.info("📢 [PRODUCTOR] Publicando evento de venta a RabbitMQ:");
        log.info("   -> Exchange: {}", RabbitMQConstants.EXCHANGE_DIRECT);
        log.info("   -> Routing Key: {}", RabbitMQConstants.ROUTING_KEY_VENTA_CONFIRMADA);
        log.info("   -> Orden ID: {}", evento.getIdVenta());
        log.info("   -> Cliente: {} ({})", evento.getClienteNombre(), evento.getClienteEmail());
        log.info("   -> Total: ${} | Cómics: {}", evento.getTotal(), evento.getItems() != null ? evento.getItems().size() : 0);

        rabbitTemplate.convertAndSend(
                RabbitMQConstants.EXCHANGE_DIRECT,
                RabbitMQConstants.ROUTING_KEY_VENTA_CONFIRMADA,
                evento
        );

        log.info("✅ [PRODUCTOR] Mensaje despachado exitosamente al broker.");
    }

    /**
     * Sobrecarga para compatibilidad con OrderEventDTO legado.
     */
    public void publishOrderPaidEvent(OrderEventDTO orderEventDTO) {
        publicarVentaConfirmada(orderEventDTO);
    }
}
