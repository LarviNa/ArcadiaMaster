package com.arcadiacomics.ventas.dto;

import java.util.List;
import java.util.List;

public class OrderEventDTO {

    private String orderId;
    private String userId;
    private List<OrderItemDTO> items;

    public OrderEventDTO() {
    }

    public OrderEventDTO(String orderId, String userId, List<OrderItemDTO> items) {
        this.orderId = orderId;
        this.userId = userId;
        this.items = items;
    }

    public String getOrderId() {
        return orderId;
    }

    public void setOrderId(String orderId) {
        this.orderId = orderId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public List<OrderItemDTO> getItems() {
        return items;
    }

    public void setItems(List<OrderItemDTO> items) {
        this.items = items;
    }
}
