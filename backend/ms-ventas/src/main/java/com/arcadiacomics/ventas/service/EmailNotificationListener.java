package com.arcadiacomics.ventas.service;

import com.arcadiacomics.ventas.config.RabbitMQConfig;
import com.arcadiacomics.ventas.dto.OrderEventDTO;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
public class EmailNotificationListener {

    @RabbitListener(queues = RabbitMQConfig.QUEUE_NAME)
    public void sendEmailNotification(OrderEventDTO event) {
        System.out.println("==========================================================");
        System.out.println("📧 SIMULACIÓN DE ENVÍO DE CORREO - ARCADIA COMICS 📧");
        System.out.println("==========================================================");
        System.out.println("Para: Usuario ID " + event.getUserId());
        System.out.println("Asunto: ¡Gracias por tu compra en Arcadia Comics!");
        System.out.println("----------------------------------------------------------");
        System.out.println("Hola,");
        System.out.println("Hemos recibido tu pedido correctamente. Aquí están los detalles:");
        System.out.println("Nº de Orden: " + event.getOrderId());
        System.out.println("Cantidad de items: " + (event.getItems() != null ? event.getItems().size() : 0));
        System.out.println();
        System.out.println("¡Tus cómics están siendo preparados para el envío!");
        System.out.println("Gracias por elegir Arcadia Comics.");
        System.out.println("==========================================================");
    }
}
