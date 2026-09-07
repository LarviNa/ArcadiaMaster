package com.arcadiacomics.ventas.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

public class CheckoutRequest {

    @NotNull(message = "El ID del usuario no puede ser nulo")
    private String userId;

    @NotNull(message = "El monto total no puede ser nulo")
    @Positive(message = "El monto total debe ser mayor a cero")
    private Double totalAmount;

    @NotEmpty(message = "La lista de items no puede estar vacía")
    @Valid
    private List<OrderItemDTO> items;

    // Simulated Credit Card Details (Will not be persisted)
    @NotBlank(message = "El número de tarjeta es obligatorio")
    @Pattern(regexp = "\\d{16}", message = "El número de tarjeta debe tener 16 dígitos")
    private String cardNumber;

    @NotBlank(message = "La fecha de expiración es obligatoria")
    @Pattern(regexp = "(0[1-9]|1[0-2])/\\d{2}", message = "La fecha de expiración debe tener el formato MM/YY")
    private String expirationDate;

    @NotBlank(message = "El código de seguridad (CCV) es obligatorio")
    @Pattern(regexp = "\\d{3}", message = "El CCV debe tener exactamente 3 dígitos")
    private String ccv;

    public CheckoutRequest() {
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Double getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(Double totalAmount) {
        this.totalAmount = totalAmount;
    }

    public List<OrderItemDTO> getItems() {
        return items;
    }

    public void setItems(List<OrderItemDTO> items) {
        this.items = items;
    }

    public String getCardNumber() {
        return cardNumber;
    }

    public void setCardNumber(String cardNumber) {
        this.cardNumber = cardNumber;
    }

    public String getExpirationDate() {
        return expirationDate;
    }

    public void setExpirationDate(String expirationDate) {
        this.expirationDate = expirationDate;
    }

    public String getCcv() {
        return ccv;
    }

    public void setCcv(String ccv) {
        this.ccv = ccv;
    }

    @JsonIgnore
    @AssertTrue(message = "La tarjeta está vencida")
    public boolean isExpirationDateValid() {
        if (expirationDate == null || !expirationDate.matches("(0[1-9]|1[0-2])/\\d{2}")) {
            return true; // Let the @Pattern validation handle format issues
        }
        try {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MM/yy");
            YearMonth expiration = YearMonth.parse(expirationDate, formatter);
            return !expiration.isBefore(YearMonth.now());
        } catch (DateTimeParseException e) {
            return false;
        }
    }
}
