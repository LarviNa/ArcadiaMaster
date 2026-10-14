package com.arcadiacomics.ventas.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración de la topología Spring AMQP para RabbitMQ.
 * Implementa:
 * - Direct Exchange 'comics.ventas.direct'.
 * - Colas durables 'cola.ventas.pdf' y 'cola.ventas.stock'.
 * - Bindings compartidos con routing key 'venta.confirmada'.
 * - Dead Letter Exchange 'comics.ventas.dlx' y Dead Letter Queue 'cola.ventas.dlq'.
 * - Bean RabbitAdmin para gestión programática.
 * - Serializador JSON con Jackson2JsonMessageConverter.
 */
@Configuration
public class RabbitMQConfig {

    // Alias retrocompatibles que delegan a RabbitMQConstants
    public static final String EXCHANGE_NAME = RabbitMQConstants.EXCHANGE_DIRECT;
    public static final String QUEUE_NAME = RabbitMQConstants.QUEUE_VENTAS_PDF;
    public static final String ROUTING_KEY = RabbitMQConstants.ROUTING_KEY_VENTA_CONFIRMADA;

    // =========================================================================
    // 1. EXCHANGES (Direct Exchange Principal y DLX)
    // =========================================================================

    @Bean
    public DirectExchange comicsVentasDirectExchange() {
        return new DirectExchange(RabbitMQConstants.EXCHANGE_DIRECT, true, false);
    }

    @Bean
    public DirectExchange comicsVentasDlxExchange() {
        return new DirectExchange(RabbitMQConstants.EXCHANGE_DLX, true, false);
    }

    // =========================================================================
    // 2. COLAS DURABLES CON CONFIGURACIÓN DLQ
    // =========================================================================

    @Bean
    public Queue colaVentasPdf() {
        return QueueBuilder.durable(RabbitMQConstants.QUEUE_VENTAS_PDF)
                .withArgument("x-dead-letter-exchange", RabbitMQConstants.EXCHANGE_DLX)
                .withArgument("x-dead-letter-routing-key", RabbitMQConstants.ROUTING_KEY_VENTA_DLQ)
                .build();
    }

    @Bean
    public Queue colaVentasStock() {
        return QueueBuilder.durable(RabbitMQConstants.QUEUE_VENTAS_STOCK)
                .withArgument("x-dead-letter-exchange", RabbitMQConstants.EXCHANGE_DLX)
                .withArgument("x-dead-letter-routing-key", RabbitMQConstants.ROUTING_KEY_VENTA_DLQ)
                .build();
    }

    @Bean
    public Queue colaVentasDlq() {
        return QueueBuilder.durable(RabbitMQConstants.QUEUE_VENTAS_DLQ).build();
    }

    // =========================================================================
    // 3. BINDINGS (Fanout selectivo en Direct Exchange con misma Routing Key)
    // =========================================================================

    @Bean
    public Binding bindingVentasPdf(
            @Qualifier("colaVentasPdf") Queue colaVentasPdf,
            @Qualifier("comicsVentasDirectExchange") DirectExchange comicsVentasDirectExchange) {
        return BindingBuilder.bind(colaVentasPdf)
                .to(comicsVentasDirectExchange)
                .with(RabbitMQConstants.ROUTING_KEY_VENTA_CONFIRMADA);
    }

    @Bean
    public Binding bindingVentasStock(
            @Qualifier("colaVentasStock") Queue colaVentasStock,
            @Qualifier("comicsVentasDirectExchange") DirectExchange comicsVentasDirectExchange) {
        return BindingBuilder.bind(colaVentasStock)
                .to(comicsVentasDirectExchange)
                .with(RabbitMQConstants.ROUTING_KEY_VENTA_CONFIRMADA);
    }

    @Bean
    public Binding bindingVentasDlq(
            @Qualifier("colaVentasDlq") Queue colaVentasDlq,
            @Qualifier("comicsVentasDlxExchange") DirectExchange comicsVentasDlxExchange) {
        return BindingBuilder.bind(colaVentasDlq)
                .to(comicsVentasDlxExchange)
                .with(RabbitMQConstants.ROUTING_KEY_VENTA_DLQ);
    }

    // =========================================================================
    // 4. SERIALIZACIÓN JSON Y GESTIÓN CON RABBITADMIN
    // =========================================================================

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        return template;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory,
            MessageConverter jsonMessageConverter) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(jsonMessageConverter);
        factory.setDefaultRequeueRejected(false); // Rechazo sin reencolado -> RabbitMQ desvía a comics.ventas.dlx
        return factory;
    }

    @Bean
    public RabbitAdmin rabbitAdmin(ConnectionFactory connectionFactory) {
        RabbitAdmin admin = new RabbitAdmin(connectionFactory);
        admin.setAutoStartup(true);
        return admin;
    }
}
