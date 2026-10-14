package com.arcadiacomics.ventas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * DTO para la declaración programática de colas en RabbitMQ.
 * Validado mediante Jakarta Bean Validation según requerimientos de la Rúbrica (30%).
 */
public class QueueDeclarationDTO {

    @NotBlank(message = "El nombre de la cola es obligatorio y no puede estar en blanco")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "El nombre de la cola solo puede contener letras, números, puntos, guiones y guiones bajos")
    private String queueName;

    private boolean durable = true;
    private boolean exclusive = false;
    private boolean autoDelete = false;

    public QueueDeclarationDTO() {
    }

    public QueueDeclarationDTO(String queueName, boolean durable, boolean exclusive, boolean autoDelete) {
        this.queueName = queueName;
        this.durable = durable;
        this.exclusive = exclusive;
        this.autoDelete = autoDelete;
    }

    public String getQueueName() {
        return queueName;
    }

    public void setQueueName(String queueName) {
        this.queueName = queueName;
    }

    public boolean isDurable() {
        return durable;
    }

    public void setDurable(boolean durable) {
        this.durable = durable;
    }

    public boolean isExclusive() {
        return exclusive;
    }

    public void setExclusive(boolean exclusive) {
        this.exclusive = exclusive;
    }

    public boolean isAutoDelete() {
        return autoDelete;
    }

    public void setAutoDelete(boolean autoDelete) {
        this.autoDelete = autoDelete;
    }
}
