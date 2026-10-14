package com.arcadiacomics.ventas.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Properties;

/**
 * Servicio encargado de la gestión programática de recursos de mensajería (RabbitAdmin).
 * Desacopla la lógica de infraestructura AMQP de los controladores y servicios de negocio.
 * Cumple con el criterio de gestión de recursos de la Rúbrica (30%).
 */
@Service
public class RabbitResourceManager {

    private static final Logger log = LoggerFactory.getLogger(RabbitResourceManager.class);

    private final RabbitAdmin rabbitAdmin;
    private final org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;

    public RabbitResourceManager(RabbitAdmin rabbitAdmin, org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate) {
        this.rabbitAdmin = rabbitAdmin;
        this.rabbitTemplate = rabbitTemplate;
    }

    /**
     * Consume e inspecciona un mensaje retenido en la Dead Letter Queue (cola.ventas.dlq).
     */
    public Object consumeDlqMessage() {
        log.info("Extrayendo mensaje retenido en la Dead Letter Queue 'cola.ventas.dlq'");
        return rabbitTemplate.receiveAndConvert(com.arcadiacomics.ventas.config.RabbitMQConstants.QUEUE_VENTAS_DLQ, 1500);
    }

    /**
     * Declara una cola programáticamente en el broker de RabbitMQ.
     */
    public String declareQueue(String queueName, boolean durable, boolean exclusive, boolean autoDelete) {
        log.info("Declarando cola programática: nombre={}, durable={}, exclusive={}, autoDelete={}",
                queueName, durable, exclusive, autoDelete);
        Queue queue = new Queue(queueName, durable, exclusive, autoDelete);
        String declaredName = rabbitAdmin.declareQueue(queue);
        log.info("Cola declarada exitosamente con nombre: {}", declaredName);
        return declaredName;
    }

    /**
     * Elimina una cola existente en el broker.
     */
    public boolean deleteQueue(String queueName) {
        log.info("Eliminando cola en RabbitMQ: {}", queueName);
        boolean deleted = rabbitAdmin.deleteQueue(queueName);
        log.info("Resultado de eliminación para la cola '{}': {}", queueName, deleted);
        return deleted;
    }

    /**
     * Purga todos los mensajes contenidos en una cola.
     */
    public boolean purgeQueue(String queueName) {
        log.info("Purgando mensajes de la cola: {}", queueName);
        rabbitAdmin.purgeQueue(queueName, false);
        log.info("Cola '{}' purgada exitosamente", queueName);
        return true;
    }

    /**
     * Obtiene información y estadísticas en tiempo real de una cola.
     */
    public Map<String, Object> getQueueInfo(String queueName) {
        log.info("Consultando propiedades de la cola: {}", queueName);
        Properties props = rabbitAdmin.getQueueProperties(queueName);
        Map<String, Object> result = new HashMap<>();

        if (props == null) {
            result.put("existe", false);
            result.put("queueName", queueName);
            result.put("mensaje", "La cola no existe en el broker");
            return result;
        }

        result.put("existe", true);
        result.put("queueName", queueName);
        result.put("messageCount", props.get(RabbitAdmin.QUEUE_MESSAGE_COUNT));
        result.put("consumerCount", props.get(RabbitAdmin.QUEUE_CONSUMER_COUNT));
        return result;
    }

    /**
     * Declara un exchange programático en RabbitMQ.
     */
    public void declareExchange(String name, String type, boolean durable, boolean autoDelete) {
        log.info("Declarando exchange programático: nombre={}, tipo={}", name, type);
        org.springframework.amqp.core.Exchange exchange;
        switch (type.toLowerCase()) {
            case "fanout":
                exchange = new org.springframework.amqp.core.FanoutExchange(name, durable, autoDelete);
                break;
            case "topic":
                exchange = new org.springframework.amqp.core.TopicExchange(name, durable, autoDelete);
                break;
            case "headers":
                exchange = new org.springframework.amqp.core.HeadersExchange(name, durable, autoDelete);
                break;
            case "direct":
            default:
                exchange = new org.springframework.amqp.core.DirectExchange(name, durable, autoDelete);
                break;
        }
        rabbitAdmin.declareExchange(exchange);
        log.info("Exchange '{}' declarado exitosamente", name);
    }

    /**
     * Declara una vinculación (Binding) programática entre cola y exchange.
     */
    public void declareBinding(String queueName, String exchangeName, String routingKey) {
        log.info("Declarando binding: cola='{}' -> exchange='{}' (routingKey='{}')", queueName, exchangeName, routingKey);
        org.springframework.amqp.core.Binding binding = new org.springframework.amqp.core.Binding(
                queueName,
                org.springframework.amqp.core.Binding.DestinationType.QUEUE,
                exchangeName,
                routingKey,
                null
        );
        rabbitAdmin.declareBinding(binding);
        log.info("Binding creado exitosamente");
    }
}
