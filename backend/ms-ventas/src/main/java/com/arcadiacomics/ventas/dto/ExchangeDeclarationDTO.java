package com.arcadiacomics.ventas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * DTO para la declaración programática de exchanges en RabbitMQ.
 * Validado con Bean Validation según la Rúbrica de Evaluación 3.
 */
public class ExchangeDeclarationDTO {

    @NotBlank(message = "El nombre del exchange es obligatorio")
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "El nombre del exchange contiene caracteres inválidos")
    private String exchangeName;

    @NotBlank(message = "El tipo de exchange es obligatorio (direct, fanout, topic, headers)")
    @Pattern(regexp = "^(?i)(direct|fanout|topic|headers)$", message = "El tipo de exchange debe ser: direct, fanout, topic o headers")
    private String type = "direct";

    private boolean durable = true;
    private boolean autoDelete = false;

    public ExchangeDeclarationDTO() {
    }

    public ExchangeDeclarationDTO(String exchangeName, String type, boolean durable, boolean autoDelete) {
        this.exchangeName = exchangeName;
        this.type = type;
        this.durable = durable;
        this.autoDelete = autoDelete;
    }

    public String getExchangeName() {
        return exchangeName;
    }

    public void setExchangeName(String exchangeName) {
        this.exchangeName = exchangeName;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public boolean isDurable() {
        return durable;
    }

    public void setDurable(boolean durable) {
        this.durable = durable;
    }

    public boolean isAutoDelete() {
        return autoDelete;
    }

    public void setAutoDelete(boolean autoDelete) {
        this.autoDelete = autoDelete;
    }
}
