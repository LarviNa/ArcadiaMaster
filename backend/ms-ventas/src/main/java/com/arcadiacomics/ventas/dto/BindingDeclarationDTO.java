package com.arcadiacomics.ventas.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * DTO para la vinculación (Binding) programática entre cola y exchange.
 * Validado con Bean Validation según la Rúbrica de Evaluación 3.
 */
public class BindingDeclarationDTO {

    @NotBlank(message = "El nombre de la cola es obligatorio")
    private String queueName;

    @NotBlank(message = "El nombre del exchange es obligatorio")
    private String exchangeName;

    @NotBlank(message = "La routing key es obligatoria")
    private String routingKey;

    public BindingDeclarationDTO() {
    }

    public BindingDeclarationDTO(String queueName, String exchangeName, String routingKey) {
        this.queueName = queueName;
        this.exchangeName = exchangeName;
        this.routingKey = routingKey;
    }

    public String getQueueName() {
        return queueName;
    }

    public void setQueueName(String queueName) {
        this.queueName = queueName;
    }

    public String getExchangeName() {
        return exchangeName;
    }

    public void setExchangeName(String exchangeName) {
        this.exchangeName = exchangeName;
    }

    public String getRoutingKey() {
        return routingKey;
    }

    public void setRoutingKey(String routingKey) {
        this.routingKey = routingKey;
    }
}
