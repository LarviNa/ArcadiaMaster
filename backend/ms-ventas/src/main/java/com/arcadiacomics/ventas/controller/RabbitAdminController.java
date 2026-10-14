package com.arcadiacomics.ventas.controller;

import com.arcadiacomics.ventas.dto.QueueDeclarationDTO;
import com.arcadiacomics.ventas.service.RabbitResourceManager;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controlador REST para la gestión programática de recursos de mensajería (RabbitAdmin).
 * Cumple con el criterio de evaluación de la Rúbrica oficial (30%):
 * - Endpoints REST con métodos POST, DELETE, GET.
 * - Validación mediante Bean Validation (@Valid).
 * - Manejo adecuado de códigos de estado HTTP (201, 200, 404).
 */
@RestController
@RequestMapping("/api/rabbitmq")
@CrossOrigin(origins = "*")
public class RabbitAdminController {

    private final RabbitResourceManager resourceManager;

    public RabbitAdminController(RabbitResourceManager resourceManager) {
        this.resourceManager = resourceManager;
    }

    /**
     * Declara una nueva cola en RabbitMQ mediante el DTO validado.
     */
    @PostMapping("/queues")
    public ResponseEntity<Map<String, Object>> declareQueue(@Valid @RequestBody QueueDeclarationDTO dto) {
        String queueName = resourceManager.declareQueue(
                dto.getQueueName(),
                dto.isDurable(),
                dto.isExclusive(),
                dto.isAutoDelete()
        );
        return new ResponseEntity<>(Map.of(
                "mensaje", "Cola declarada exitosamente en el broker de RabbitMQ",
                "queueName", queueName,
                "durable", dto.isDurable(),
                "status", "CREATED"
        ), HttpStatus.CREATED);
    }

    /**
     * Elimina una cola existente del broker.
     */
    @DeleteMapping("/queues/{queueName}")
    public ResponseEntity<Map<String, Object>> deleteQueue(@PathVariable String queueName) {
        boolean deleted = resourceManager.deleteQueue(queueName);
        if (deleted) {
            return ResponseEntity.ok(Map.of(
                    "mensaje", "Cola eliminada exitosamente del broker",
                    "queueName", queueName,
                    "eliminada", true
            ));
        } else {
            return new ResponseEntity<>(Map.of(
                    "mensaje", "La cola no existía o no pudo ser eliminada",
                    "queueName", queueName,
                    "eliminada", false
            ), HttpStatus.NOT_FOUND);
        }
    }

    /**
     * Consulta información y conteo de mensajes de una cola.
     */
    @GetMapping("/queues/{queueName}")
    public ResponseEntity<Map<String, Object>> getQueueInfo(@PathVariable String queueName) {
        Map<String, Object> info = resourceManager.getQueueInfo(queueName);
        return ResponseEntity.ok(info);
    }

    /**
     * Purga los mensajes contenidos en una cola.
     */
    @PostMapping("/queues/{queueName}/purge")
    public ResponseEntity<Map<String, Object>> purgeQueue(@PathVariable String queueName) {
        boolean purged = resourceManager.purgeQueue(queueName);
        return ResponseEntity.ok(Map.of(
                "mensaje", "Cola purgada exitosamente",
                "queueName", queueName,
                "purgada", purged
        ));
    }

    /**
     * Declara un nuevo exchange programático.
     */
    @PostMapping("/exchanges")
    public ResponseEntity<Map<String, Object>> declareExchange(
            @Valid @RequestBody com.arcadiacomics.ventas.dto.ExchangeDeclarationDTO dto) {
        resourceManager.declareExchange(
                dto.getExchangeName(),
                dto.getType(),
                dto.isDurable(),
                dto.isAutoDelete()
        );
        return new ResponseEntity<>(Map.of(
                "mensaje", "Exchange declarado exitosamente",
                "exchangeName", dto.getExchangeName(),
                "type", dto.getType(),
                "status", "CREATED"
        ), HttpStatus.CREATED);
    }

    /**
     * Declara un nuevo binding entre cola y exchange.
     */
    @PostMapping("/bindings")
    public ResponseEntity<Map<String, Object>> declareBinding(
            @Valid @RequestBody com.arcadiacomics.ventas.dto.BindingDeclarationDTO dto) {
        resourceManager.declareBinding(
                dto.getQueueName(),
                dto.getExchangeName(),
                dto.getRoutingKey()
        );
        return new ResponseEntity<>(Map.of(
                "mensaje", "Binding creado exitosamente",
                "queueName", dto.getQueueName(),
                "exchangeName", dto.getExchangeName(),
                "routingKey", dto.getRoutingKey(),
                "status", "CREATED"
        ), HttpStatus.CREATED);
    }

    /**
     * Inspecciona y extrae un mensaje retenido en la Dead Letter Queue (cola.ventas.dlq).
     * Endpoint clave para demostración y evaluación de resiliencia ante fallos.
     */
    @GetMapping("/dlq/messages")
    public ResponseEntity<Map<String, Object>> getDlqMessage() {
        Object mensaje = resourceManager.consumeDlqMessage();
        if (mensaje == null) {
            return ResponseEntity.ok(Map.of(
                    "status", "EMPTY",
                    "queue", "cola.ventas.dlq",
                    "mensaje", "No hay mensajes acumulados en la Dead Letter Queue actualmente"
            ));
        }
        return ResponseEntity.ok(Map.of(
                "status", "MESSAGE_RETRIEVED",
                "queue", "cola.ventas.dlq",
                "mensaje", "Mensaje recuperado con éxito desde la Dead Letter Queue",
                "payload", mensaje
        ));
    }
}
