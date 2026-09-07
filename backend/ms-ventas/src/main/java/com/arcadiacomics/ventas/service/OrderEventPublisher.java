package com.arcadiacomics.ventas.service;

import com.arcadiacomics.ventas.config.RabbitMQConfig;
import com.arcadiacomics.ventas.dto.OrderEventDTO;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
public class OrderEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public OrderEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishOrderPaidEvent(OrderEventDTO orderEventDTO) {
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE_NAME,
                RabbitMQConfig.ROUTING_KEY,
                orderEventDTO
        );
    }
}
